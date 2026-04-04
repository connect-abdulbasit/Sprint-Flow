import { NextRequest, NextResponse } from "next/server";
import { authService } from "./auth.service";
import { setAuthCookies, clearAuthCookies } from "@/lib/auth";

export class AuthController {
  async signup(req: NextRequest) {
    try {
      const body = await req.json();
      const { email, password, name } = body;

      if (!email || !password || !name) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      const { user, accessToken, session } = await authService.signup({ email, password, name });

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
    try {
      const body = await req.json();
      const { email, password } = body;

      if (!email || !password) {
        return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
      }

      const { user, accessToken, session } = await authService.signin({ email, password });

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

      const { user, accessToken, session } = await authService.refresh(refreshToken);

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
        await authService.logout(refreshToken);
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
