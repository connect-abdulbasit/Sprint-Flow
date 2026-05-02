import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserWithRole } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * GET /api/workspaces/[id]/role
 * Returns the current user's role in the specified workspace.
 */
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: workspaceId } = await context.params;

  const userWithRole = await getCurrentUserWithRole(req, workspaceId);
  if (!userWithRole) {
    return NextResponse.json(
      { error: "Unauthorized or not a member of this workspace" },
      { status: 401 }
    );
  }

  return NextResponse.json({ role: userWithRole.workspaceRole });
}
