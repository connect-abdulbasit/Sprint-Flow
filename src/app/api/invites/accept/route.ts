export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { organizationInvitesTable, organizationMembersTable } from "@/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
    const user = await getCurrentUser(req);
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const token = String(body.token ?? "").trim();

    if (!token) {
        return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    try {

        const invites = await db
            .select()
            .from(organizationInvitesTable)
            .where(
                and(
                    eq(organizationInvitesTable.token, token),
                    eq(organizationInvitesTable.status, "pending")
                )
            )
            .execute();

        const invite = invites[0];
        if (!invite) {
            return NextResponse.json({ error: "Invalid or expired invite" }, { status: 404 });
        }


        const existingMembers = await db
            .select()
            .from(organizationMembersTable)
            .where(
                and(
                    eq(organizationMembersTable.organizationId, invite.organizationId),
                    eq(organizationMembersTable.userId, user.id)
                )
            )
            .limit(1)
            .execute();

        if (existingMembers.length > 0) {
            return NextResponse.json({ error: "Already a member of this organization" }, { status: 400 });
        }


        await db.insert(organizationMembersTable).values({
            organizationId: invite.organizationId,
            userId: user.id,
            role: invite.role,
        });


        await db
            .update(organizationInvitesTable)
            .set({ status: "accepted" })
            .where(eq(organizationInvitesTable.id, invite.id))
            .execute();

        return NextResponse.json({ success: true, message: "Successfully joined organization" });
    } catch (error) {
        console.error("Accept invite error:", error);
        return NextResponse.json(
            { error: (error as Error)?.message ?? "Failed to accept invite" },
            { status: 500 }
        );
    }
}

