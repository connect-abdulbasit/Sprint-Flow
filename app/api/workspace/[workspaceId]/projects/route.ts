export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projectsTable, projectMembersTable } from "@/src/db";
import { getCurrentUser } from "@/lib/auth";
import { eq } from "drizzle-orm";

// GET /api/workspace/[workspaceId]/projects — list all projects in this workspace
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { workspaceId } = await params;
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projects = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.organizationId, workspaceId));

  return NextResponse.json({ projects });
}

// POST /api/workspace/[workspaceId]/projects — create a new project
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { workspaceId } = await params;
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const name = String(body.name ?? "").trim();
  const description = String(body.description ?? "").trim() || null;
  const status = String(body.status ?? "active").trim();

  if (!name) {
    return NextResponse.json({ error: "Project name is required" }, { status: 400 });
  }

  const inserted = await db
    .insert(projectsTable)
    .values({
      name,
      description,
      status,
      organizationId: workspaceId,
      createdBy: user.id,
    })
    .returning();

  const project = inserted[0];

  // Add creator as project owner
  await db.insert(projectMembersTable).values({
    projectId: project.id,
    userId: user.id,
    role: "owner",
  });

  return NextResponse.json({ project }, { status: 201 });
}
