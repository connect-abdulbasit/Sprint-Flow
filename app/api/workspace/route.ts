export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { organizationsTable, organizationMembersTable } from "@/src/db";
import { getCurrentUser } from "@/lib/auth";
import { eq } from "drizzle-orm";

// POST /api/workspace — create a new workspace
export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const name = String(body.name ?? "").trim();

  if (!name) {
    return NextResponse.json({ error: "Workspace name is required" }, { status: 400 });
  }

  // Insert the organization
  const inserted = await db
    .insert(organizationsTable)
    .values({ name, ownerId: user.id })
    .returning();

  const org = inserted[0];

  // Add the creator as owner in organization_members
  await db.insert(organizationMembersTable).values({
    organizationId: org.id,
    userId: user.id,
    role: "owner",
  });

  return NextResponse.json({ workspace: org }, { status: 201 });
}

// GET /api/workspace — list workspaces the current user belongs to
export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get all org memberships for this user, join with organizations
  const memberships = await db
    .select({
      id: organizationsTable.id,
      name: organizationsTable.name,
      ownerId: organizationsTable.ownerId,
      role: organizationMembersTable.role,
      createdAt: organizationsTable.createdAt,
    })
    .from(organizationMembersTable)
    .innerJoin(
      organizationsTable,
      eq(organizationMembersTable.organizationId, organizationsTable.id)
    )
    .where(eq(organizationMembersTable.userId, user.id));

  return NextResponse.json({ workspaces: memberships });
}
