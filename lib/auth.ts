import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { sessionsTable, usersTable } from "@/src/db";
import { signAccessToken, verifyAccessToken } from "@/lib/jwt";

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
        const users = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.id, payload.sub))
            .execute();

        const user = users[0];

        return user || null;
    } catch {
        return null;
    }
}

export async function createSession(userId: string) {
    const refreshToken = createRefreshToken();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

    await db
        .insert(sessionsTable)
        .values({ userId, refreshToken, expiresAt });

    return { refreshToken, expiresAt };
}

export async function rotateSession(oldRefreshToken: string) {
    const sessions = await db
        .select()
        .from(sessionsTable)
        .where(eq(sessionsTable.refreshToken, oldRefreshToken))
        .execute();

    const session = sessions[0];

    if (!session) return null;
    if (new Date(session.expiresAt) < new Date()) {
        await db.delete(sessionsTable).where(eq(sessionsTable.id, session.id));
        return null;
    }

    const refreshToken = createRefreshToken();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

    await db
        .update(sessionsTable)
        .set({ refreshToken, expiresAt })
        .where(eq(sessionsTable.id, session.id));

    return { userId: session.userId, refreshToken, expiresAt };
}

export async function revokeSession(refreshToken: string) {
    await db.delete(sessionsTable).where(eq(sessionsTable.refreshToken, refreshToken));
}
