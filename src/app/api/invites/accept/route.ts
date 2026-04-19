import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Organization-level invite acceptance has been deprecated.
// Use POST /api/invites/[token]/accept instead.
export async function POST() {
  return NextResponse.json(
    { error: "Use POST /api/invites/[token]/accept to accept workspace invitations." },
    { status: 400 }
  );
}
