export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

import { revokeSession, clearAuthCookies } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get("refreshToken")?.value;
  if (refreshToken) {
    await revokeSession(refreshToken);
  }

  const response = NextResponse.json({ ok: true });
  clearAuthCookies(response);

  return response;
}
