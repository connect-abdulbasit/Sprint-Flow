export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projectsTable } from "@/src/db";
import { getCurrentUser } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

// DELETE /api/workspace/[workspaceId]/projects/[projectId]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; projectId: string }> }
) {
  const { workspaceId, projectId } = await params;
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify project belongs to this workspace before deleting
  const projects = await db
    .select()
    .from(projectsTable)
    .where(
      and(
        eq(projectsTable.id, projectId),
        eq(projectsTable.organizationId, workspaceId)
      )
    );

  if (!projects.length) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  await db.delete(projectsTable).where(eq(projectsTable.id, projectId));

  return NextResponse.json({ message: "Project deleted" });
}
