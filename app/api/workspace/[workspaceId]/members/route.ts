export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { organizationMembersTable, usersTable } from "@/src/db";
import { getCurrentUser } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

// POST /api/workspace/[workspaceId]/members — invite a member by email
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { workspaceId } = await params;
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const email = String(body.email ?? "").trim().toLowerCase();
  const role = (body.role ?? "member") as "member" | "admin";

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  // Find the user by email
  const targets = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));

  if (!targets.length) {
    // Return success regardless to avoid email enumeration
    return NextResponse.json({ message: "Invite sent (if account exists)" });
  }

  const target = targets[0];

  // Check if already a member
  const existing = await db
    .select()
    .from(organizationMembersTable)
    .where(
      and(
        eq(organizationMembersTable.organizationId, workspaceId),
        eq(organizationMembersTable.userId, target.id)
      )
    );

  if (existing.length > 0) {
    return NextResponse.json({ error: "User is already a member" }, { status: 409 });
  }

  await db.insert(organizationMembersTable).values({
    organizationId: workspaceId,
    userId: target.id,
    role,
  });

  return NextResponse.json({ message: "Member added successfully" });
}

// GET /api/workspace/[workspaceId]/members — list all members
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { workspaceId } = await params;
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const members = await db
    .select({
      userId: organizationMembersTable.userId,
      role: organizationMembersTable.role,
      joinedAt: organizationMembersTable.joinedAt,
      name: usersTable.name,
      email: usersTable.email,
    })
    .from(organizationMembersTable)
    .innerJoin(usersTable, eq(organizationMembersTable.userId, usersTable.id))
    .where(eq(organizationMembersTable.organizationId, workspaceId));

  return NextResponse.json({ members });
}
