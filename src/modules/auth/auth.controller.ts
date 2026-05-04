import { NextRequest, NextResponse } from "next/server";
import { authService } from "./auth.service";
import { authRepository } from "./auth.repository";
import { setAuthCookies, clearAuthCookies, hashPassword, verifyPassword } from "@/lib/auth";
import { signAccessToken } from "@/lib/jwt";
import { authRateLimiter } from "@/lib/rate-limiter";

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

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
    const limit = authRateLimiter.check(`signin:${ip}`);
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
      const { email, password } = body;

      if (!email || !password) {
        return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
      }

      const user = await authRepository.findUserByEmail(email);
      if (!user) {
        return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
      }

      const isPasswordValid = verifyPassword(password, user.passwordHash);
      if (!isPasswordValid) {
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
}

export const authController = new AuthController();
