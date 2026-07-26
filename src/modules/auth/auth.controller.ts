import { NextRequest, NextResponse } from "next/server";
import { authService } from "./auth.service";
import { authRepository } from "./auth.repository";
import {
  setAuthCookies,
  clearAuthCookies,
  hashPassword,
  verifyPassword,
  getCurrentUser,
} from "@/lib/auth";
import { signAccessToken } from "@/lib/jwt";
import { authRateLimiter } from "@/lib/rate-limiter";
import { validatePasswordStrength } from "@/lib/password-policy";

// AUD-020: X-Forwarded-For / X-Real-IP are client-supplied headers. Trusting them
// unconditionally let an attacker defeat the entire IP-based rate limit by sending a
// fresh random value on every request. They're only trustworthy when the app sits
// behind infrastructure (Vercel, an nginx/ALB reverse proxy, etc.) that itself
// overwrites these headers rather than passing through whatever the client sent —
// which is exactly what TRUST_PROXY_HEADERS asserts is true for this deployment.
function isProxyTrusted(): boolean {
  return process.env.TRUST_PROXY_HEADERS === "1" || process.env.TRUST_PROXY_HEADERS === "true";
}

export function getClientIp(req: NextRequest): string {
  if (isProxyTrusted()) {
    const forwardedFor = req.headers.get("x-forwarded-for");
    if (forwardedFor) return forwardedFor.split(",")[0].trim();
    const realIp = req.headers.get("x-real-ip");
    if (realIp) return realIp;
  }
  // Next.js does not expose the raw socket address to route handlers, so without an
  // explicitly trusted proxy in front of it, every direct request shares one bucket.
  // This is intentionally conservative — see AUD-024 for the account-level throttle
  // that keeps working regardless of how the IP bucket resolves.
  return "unproxied";
}

// AUD-022: a fixed, valid bcrypt hash with no matching plaintext. Comparing against it
// costs about the same as a real password check, so response timing can't be used to
// tell "no such account" apart from "wrong password" for that account.
const DUMMY_PASSWORD_HASH = hashPassword("no-such-user-dummy-comparison-target");

export class AuthController {
  async signup(req: NextRequest) {
    const ip = getClientIp(req);
    const limit = authRateLimiter.check(`signup:${ip}`);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(limit.resetAfterMs / 1000)) },
        }
      );
    }

    try {
      const body = await req.json();
      const { email, password, name } = body;

      if (!email || !password || !name) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      const passwordError = validatePasswordStrength(password);
      if (passwordError) {
        return NextResponse.json({ error: passwordError }, { status: 400 });
      }

      const passwordHash = hashPassword(password);
      const { user, accessToken, session } = await authService.signup({
        email,
        name,
        passwordHash,
      });

      const response = NextResponse.json({
        user: { id: user.id, name: user.name, email: user.email },
      });

      setAuthCookies({
        response,
        accessToken,
        refreshToken: session.refreshToken,
        refreshTokenExpiresAt: session.expiresAt,
      });

      return response;
    } catch (error) {
      console.error("Signup error:", error);
      return NextResponse.json(
        { error: (error as Error)?.message ?? "Failed to sign up" },
        { status: 400 }
      );
    }
  }

  async signin(req: NextRequest) {
    const ip = getClientIp(req);
    const ipLimit = authRateLimiter.check(`signin-ip:${ip}`);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(ipLimit.resetAfterMs / 1000)) },
        }
      );
    }

    try {
      const body = await req.json();
      const { email, password } = body;

      if (!email || !password) {
        return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
      }

      // AUD-024: throttle by account too, not just IP — otherwise an attacker who can
      // rotate/spoof source IPs faces no brake at all when targeting one specific account.
      const normalizedEmail = String(email).trim().toLowerCase();
      const accountLimit = authRateLimiter.check(`signin-account:${normalizedEmail}`);
      if (!accountLimit.allowed) {
        return NextResponse.json(
          { error: "Too many attempts. Please try again later." },
          {
            status: 429,
            headers: { "Retry-After": String(Math.ceil(accountLimit.resetAfterMs / 1000)) },
          }
        );
      }

      const user = await authRepository.findUserByEmail(email);
      // AUD-022: always perform the bcrypt comparison, even when no user was found, so
      // the two failure paths take the same amount of time.
      const isPasswordValid = verifyPassword(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);
      if (!user || !isPasswordValid) {
        return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
      }

      const { accessToken, session } = await authService.signin(email);

      const response = NextResponse.json({
        user: { id: user.id, name: user.name, email: user.email },
      });

      setAuthCookies({
        response,
        accessToken,
        refreshToken: session.refreshToken,
        refreshTokenExpiresAt: session.expiresAt,
      });

      return response;
    } catch (error) {
      console.error("Signin error:", error);
      return NextResponse.json(
        { error: (error as Error)?.message ?? "Failed to sign in" },
        { status: 401 }
      );
    }
  }

  async refresh(req: NextRequest) {
    try {
      const refreshToken = req.cookies.get("refreshToken")?.value;
      if (!refreshToken) {
        return NextResponse.json({ error: "Missing refresh token" }, { status: 401 });
      }

      const session = await authService.rotateSession(refreshToken);
      if (!session) {
        return NextResponse.json({ error: "Invalid or expired refresh token" }, { status: 401 });
      }

      const user = await authService.getUserById(session.userId);
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 401 });
      }

      const accessToken = await signAccessToken(user);

      const response = NextResponse.json({
        user: { id: user.id, name: user.name, email: user.email },
      });

      setAuthCookies({
        response,
        accessToken,
        refreshToken: session.refreshToken,
        refreshTokenExpiresAt: session.expiresAt,
      });

      return response;
    } catch (error) {
      console.error("Refresh error:", error);
      return NextResponse.json(
        { error: (error as Error)?.message ?? "Failed to refresh token" },
        { status: 401 }
      );
    }
  }

  async logout(req: NextRequest) {
    try {
      const refreshToken = req.cookies.get("refreshToken")?.value;
      if (refreshToken) {
        await authService.revokeSession(refreshToken);
      }

      const response = NextResponse.json({ success: true });
      clearAuthCookies(response);

      return response;
    } catch (error) {
      console.error("Logout error:", error);
      return NextResponse.json(
        { error: (error as Error)?.message ?? "Failed to logout" },
        { status: 500 }
      );
    }
  }

  /** AUD-026: log out every session for the current user, not just this device. */
  async logoutAllDevices(req: NextRequest) {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      await authService.logoutAllDevices(user.id);
      const response = NextResponse.json({ success: true });
      clearAuthCookies(response);
      return response;
    } catch (error) {
      console.error("Logout all devices error:", error);
      return NextResponse.json(
        { error: (error as Error)?.message ?? "Failed to log out of all devices" },
        { status: 500 }
      );
    }
  }

  /** AUD-026 / AUD-030: the missing account-recovery/remediation path. */
  async changePassword(req: NextRequest) {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const body = await req.json();
      const { currentPassword, newPassword } = body;
      if (!currentPassword || !newPassword) {
        return NextResponse.json(
          { error: "Current and new password are required" },
          { status: 400 }
        );
      }

      const { accessToken, session } = await authService.changePassword(
        user.id,
        currentPassword,
        newPassword
      );

      const response = NextResponse.json({ success: true });
      setAuthCookies({
        response,
        accessToken,
        refreshToken: session.refreshToken,
        refreshTokenExpiresAt: session.expiresAt,
      });
      return response;
    } catch (error) {
      const message = (error as Error)?.message ?? "Failed to change password";
      console.error("Change password error:", error);
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }
}

export const authController = new AuthController();
