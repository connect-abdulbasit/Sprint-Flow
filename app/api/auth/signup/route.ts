export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { usersTable } from "@/src/db";
import { hashPassword, createSession, setAuthCookies } from "@/lib/auth";
import { signAccessToken } from "@/lib/jwt";

export async function POST(req: NextRequest) {
    const rawBody = await req.text();

    let body: any;
    try {
        body = JSON.parse(rawBody);
    } catch (error) {
        console.error("Signup error: invalid JSON", rawBody, error);
        return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!name || !email || !password) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (password.length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const existingUsers = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email))
        .execute();

    if (existingUsers.length > 0) {
        return NextResponse.json({ error: "An account with that email already exists" }, { status: 409 });
    }

    const passwordHash = hashPassword(password);

    const inserted = await db
        .insert(usersTable)
        .values({ name, email, passwordHash })
        .returning();

    const user = inserted[0];

    try {
        const accessToken = await signAccessToken(user);
        const session = await createSession(user.id);

        const response = NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } });
        setAuthCookies({
            response,
            accessToken,
            refreshToken: session.refreshToken,
            refreshTokenExpiresAt: session.expiresAt,
        });

        return response;
    } catch (error) {
        console.error("Signup error:", error);
        return NextResponse.json({ error: (error as Error)?.message ?? "Failed to create account" }, { status: 500 });
    }
}
