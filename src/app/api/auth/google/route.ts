export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:3000/api/auth/google/callback";

if (!GOOGLE_CLIENT_ID) {
    throw new Error("Missing GOOGLE_CLIENT_ID environment variable");
}

export async function GET(req: NextRequest) {
    const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID!,
        redirect_uri: GOOGLE_REDIRECT_URI,
        scope: "email profile",
        response_type: "code",
        access_type: "offline",
        prompt: "select_account",
    });

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    return NextResponse.redirect(googleAuthUrl);
}
