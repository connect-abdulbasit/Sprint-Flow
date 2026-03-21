export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { usersTable } from "@/db";
import { rotateSession, setAuthCookies } from "@/lib/auth";
import { signAccessToken } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get("refreshToken")?.value;
  if (!refreshToken) {
    return NextResponse.json({ error: "Missing refresh token" }, { status: 401 });
  }

  const session = await rotateSession(refreshToken);
  if (!session) {
    return NextResponse.json({ error: "Invalid or expired refresh token" }, { status: 401 });
  }

  const users = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, session.userId))
    .execute();

  const user = users[0];
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }

  try {
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
    console.error("Refresh token error:", error);
    return NextResponse.json(
      { error: (error as Error)?.message ?? "Failed to refresh token" },
      { status: 500 }
    );
  }
}
