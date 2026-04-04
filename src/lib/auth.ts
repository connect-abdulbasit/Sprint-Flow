import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

import { authService } from "@/modules/auth/auth.service";
import { verifyAccessToken } from "@/lib/jwt";

export function hashPassword(password: string) {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compareSync(password, hash);
}

export function createRefreshToken() {
  return globalThis.crypto.randomUUID();
}

const isProduction = process.env.NODE_ENV === "production";

export function setAuthCookies({
  response,
  accessToken,
  refreshToken,
  refreshTokenExpiresAt,
}: {
  response: NextResponse;
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}) {
  response.cookies.set({
    name: "accessToken",
    value: accessToken,
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 15,
  });

  response.cookies.set({
    name: "refreshToken",
    value: refreshToken,
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    expires: refreshTokenExpiresAt,
  });
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set({
    name: "accessToken",
    value: "",
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  response.cookies.set({
    name: "refreshToken",
    value: "",
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getCurrentUser(req: NextRequest) {
  const token = req.cookies.get("accessToken")?.value;
  if (!token) return null;

  try {
    const payload = await verifyAccessToken(token);
    const user = await authService.getUserById(payload.sub);

    return user || null;
  } catch {
    return null;
  }
}

export async function createSession(userId: string) {
  return authService.createSession(userId);
}

export async function rotateSession(oldRefreshToken: string) {
  return authService.rotateSession(oldRefreshToken);
}

export async function revokeSession(refreshToken: string) {
  return authService.revokeSession(refreshToken);
}
