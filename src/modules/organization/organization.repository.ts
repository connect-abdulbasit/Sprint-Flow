import { db } from "@/lib/db";
import { organizationsTable, organizationMembersTable, organizationInvitesTable } from "@/db";
import { eq, and } from "drizzle-orm";
import { BaseRepository } from "@/repositories/base.repository";

export class OrganizationRepository extends BaseRepository<any> {
  async createOrganization(data: typeof organizationsTable.$inferInsert) {
    const [organization] = await db.insert(organizationsTable).values(data).returning().execute();
    return organization;
  }

  async addMember(data: typeof organizationMembersTable.$inferInsert) {
    const [member] = await db.insert(organizationMembersTable).values(data).returning().execute();
    return member;
  }

  async getMember(userId: string, organizationId: string) {
    const results = await db
      .select()
      .from(organizationMembersTable)
      .where(
        and(
          eq(organizationMembersTable.userId, userId),
          eq(organizationMembersTable.organizationId, organizationId)
        )
      )
      .execute();
    return results[0];
  }

  async getUserOrganizations(userId: string) {
    const results = await db
      .select()
      .from(organizationMembersTable)
      .where(eq(organizationMembersTable.userId, userId))
      .leftJoin(
        organizationsTable,
        eq(organizationMembersTable.organizationId, organizationsTable.id)
      )
      .execute();

    return results.map((r) => r.organizations).filter(Boolean);
  }

  async getOrganization(userId: string, organizationId: string) {
    const results = await db
      .select()
      .from(organizationMembersTable)
      .where(
        and(
          eq(organizationMembersTable.userId, userId),
          eq(organizationMembersTable.organizationId, organizationId)
        )
      )
      .leftJoin(
        organizationsTable,
        eq(organizationMembersTable.organizationId, organizationsTable.id)
      )
      .execute();

    const first = results[0];
    return first ? first.organizations : null;
  }

  async createInvite(data: typeof organizationInvitesTable.$inferInsert) {
    const [invite] = await db.insert(organizationInvitesTable).values(data).returning().execute();
    return invite;
  }

  async findInviteByToken(token: string) {
    const results = await db
      .select()
      .from(organizationInvitesTable)
      .where(
        and(
          eq(organizationInvitesTable.token, token),
          eq(organizationInvitesTable.status, "pending")
        )
      )
      .execute();
    return results[0];
  }

  async updateInviteStatus(inviteId: string, status: "pending" | "accepted" | "declined") {
    await db
      .update(organizationInvitesTable)
      .set({ status })
      .where(eq(organizationInvitesTable.id, inviteId))
      .execute();
  }

  async updateOrganization(organizationId: string, data: Partial<typeof organizationsTable.$inferInsert>) {
    const [organization] = await db
      .update(organizationsTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(organizationsTable.id, organizationId))
      .returning()
      .execute();
    return organization;
  }

  async deleteOrganization(organizationId: string) {
    await db.delete(organizationsTable).where(eq(organizationsTable.id, organizationId)).execute();
  }
}

export const organizationRepository = new OrganizationRepository();
