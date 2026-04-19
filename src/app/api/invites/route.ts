import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Organization-level invites have been deprecated.
// Invitations are now handled at the workspace level.
// Use POST /api/workspaces/[id]/invites instead.
export async function POST() {
  return NextResponse.json(
    {
      error:
        "Invites are only permitted at the workspace level. Use POST /api/workspaces/[id]/invites.",
    },
    { status: 400 }
  );
}
