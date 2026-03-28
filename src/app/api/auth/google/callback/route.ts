export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { usersTable } from "@/db";

import { signAccessToken } from "@/lib/jwt";
import { createSession, setAuthCookies } from "@/lib/auth";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:3000/api/auth/google/callback";

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error("Missing Google OAuth environment variables");
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
        return NextResponse.json({ error: "Missing authorization code" }, { status: 400 });
    }

    try {

        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: GOOGLE_CLIENT_ID!,
                client_secret: GOOGLE_CLIENT_SECRET!,
                code,
                grant_type: "authorization_code",
                redirect_uri: GOOGLE_REDIRECT_URI,
            }).toString(),
        });

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok) {
            console.error("Google token error:", tokenData);
            return NextResponse.json({ error: "Failed to exchange code" }, { status: 400 });
        }

        const { access_token } = tokenData;


        const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: { Authorization: `Bearer ${access_token}` },
        });

        const googleUser = await userInfoResponse.json();

        if (!userInfoResponse.ok || !googleUser.email) {
            console.error("Google userinfo error:", googleUser);
            return NextResponse.json({ error: "Failed to get user info" }, { status: 400 });
        }

        const { email, name, picture } = googleUser;


        const existingUsers = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.email, email))
            .limit(1)
            .execute();

        let user;

        if (existingUsers.length === 0) {

            await db.insert(usersTable).values({
                name,
                email,
                passwordHash: '',  // Empty for Google user
                avatarUrl: picture || null,
            }).execute();


            const insertedUsers = await db
                .select()
                .from(usersTable)
                .where(eq(usersTable.email, email))
                .limit(1)
                .execute();
            user = insertedUsers[0];
        } else {

            user = existingUsers[0];
            if (user.name !== name || user.avatarUrl !== picture) {
                await db
                    .update(usersTable)
                    .set({
                        name,
                        avatarUrl: picture || null,
                        updatedAt: new Date(),
                    })
                    .where(eq(usersTable.id, user.id))
                    .execute();
            }
        }


        const accessToken = await signAccessToken({ id: user.id!, email: user.email!, name: user.name! });
        const session = await createSession(user.id!);


        const response = NextResponse.redirect(new URL("/organizations", req.url));

        setAuthCookies({
            response,
            accessToken,
            refreshToken: session.refreshToken,
            refreshTokenExpiresAt: session.expiresAt,
        });

        return response;

    } catch (error) {
        console.error("Google callback error:", error);
        return NextResponse.json(
            { error: (error as Error)?.message ?? "Authentication failed" },
            { status: 500 }
        );
    }
}
