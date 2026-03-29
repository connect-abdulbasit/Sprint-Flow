export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { organizationsTable, organizationMembersTable } from "@/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
    const user = await getCurrentUser(req);
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const name = String(body.name ?? "").trim();

    if (!name) {
        return NextResponse.json({ error: "Organization name required" }, { status: 400 });
    }

    try {
        const [organization] = await db.insert(organizationsTable)
            .values({ name, ownerId: user.id })
            .returning();

        await db.insert(organizationMembersTable)
            .values({ organizationId: organization.id, userId: user.id, role: "owner" });

        return NextResponse.json(organization);
    } catch (error) {
        console.error("Create organization error:", error);
        return NextResponse.json(
            { error: (error as Error)?.message ?? "Failed to create organization" },
            { status: 500 }
        );
    }
}

export async function GET(req: NextRequest) {
    const user = await getCurrentUser(req);
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const members = await db
            .select()
            .from(organizationMembersTable)
            .where(eq(organizationMembersTable.userId, user.id))
            .leftJoin(organizationsTable, eq(organizationMembersTable.organizationId, organizationsTable.id));

        const organizations = members.map((m) => m.organizations);

        return NextResponse.json(organizations.filter(Boolean));
    } catch (error) {
        console.error("Fetch organizations error:", error);
        return NextResponse.json(
            { error: (error as Error)?.message ?? "Failed to fetch organizations" },
            { status: 500 }
        );
    }
}

