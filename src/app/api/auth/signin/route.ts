export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { usersTable } from "@/db";
import { verifyPassword, createSession, setAuthCookies } from "@/lib/auth";
import { signAccessToken } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const email = String(body.email ?? "")
    .trim()
    .toLowerCase();
  const password = String(body.password ?? "");

  if (!email || !password) {
    return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
  }

  const users = await db.select().from(usersTable).where(eq(usersTable.email, email)).execute();

  const user = users[0];
  if (!user) {
    return NextResponse.json({ error: "No account found with this email" }, { status: 404 });
  }

  const passwordMatches = verifyPassword(password, user.passwordHash);
  if (!passwordMatches) {
    return NextResponse.json({ error: "Invalid Password" }, { status: 401 });
  }

  try {
    const accessToken = await signAccessToken(user);
    const session = await createSession(user.id);

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
      { status: 500 }
    );
  }
}
