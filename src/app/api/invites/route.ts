export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { organizationInvitesTable, organizationMembersTable, organizationsTable } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import crypto from "crypto";

export async function POST(req: NextRequest) {
    const user = await getCurrentUser(req);
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const organizationId = String(body.organizationId ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const role = String(body.role ?? "").trim();

    if (!organizationId || !email || !role) {
        return NextResponse.json({ error: "organizationId, email, and role required" }, { status: 400 });
    }


    const memberResults = await db
        .select()
        .from(organizationMembersTable)
        .where(
            and(
                eq(organizationMembersTable.userId, user.id),
                eq(organizationMembersTable.organizationId, organizationId)
            )
        )
        .execute();

    const member = memberResults[0];
    if (!member || !["owner", "admin"].includes(member.role)) {
        return NextResponse.json({ error: "Forbidden: Not authorized to invite" }, { status: 403 });
    }

    try {
        const token = crypto.randomUUID();

        const results = await db.insert(organizationInvitesTable)
            .values({ organizationId, email, role: role as "member" | "admin" | "owner", token, status: "pending" })
            .returning()
            .execute();

        const invite = results[0];

        return NextResponse.json(invite);
    } catch (error) {
        console.error("Create invite error:", error);
        return NextResponse.json(
            { error: (error as Error)?.message ?? "Failed to create invite" },
            { status: 500 }
        );
    }
}

