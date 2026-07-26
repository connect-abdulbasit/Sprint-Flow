import { describe, it, expect, afterEach } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { workspacesTable } from "@/modules/workspace/workspace.schema";
import { workspaceService } from "@/modules/workspace/workspace.service";
import { createTestUser, createTestOrg, cleanupTestData } from "../../helpers/db-fixtures";

describe("workspaceService.createWorkspace (AUD-008 regression)", () => {
  const orgIds: string[] = [];
  const userIds: string[] = [];

  afterEach(async () => {
    await cleanupTestData({ organizationIds: orgIds, userIds });
    orgIds.length = 0;
    userIds.length = 0;
  });

  it("rejects creating a workspace inside an organization the caller does not belong to", async () => {
    const orgOwner = await createTestUser();
    const org = await createTestOrg(orgOwner.id);
    orgIds.push(org.id);
    userIds.push(orgOwner.id);

    const attacker = await createTestUser();
    userIds.push(attacker.id);

    await expect(
      workspaceService.createWorkspace(attacker.id, {
        name: "Planted Workspace",
        organizationId: org.id,
        slug: "planted-workspace",
      })
    ).rejects.toThrow(/Forbidden/);

    const workspaces = await db
      .select()
      .from(workspacesTable)
      .where(eq(workspacesTable.organizationId, org.id));
    expect(workspaces).toHaveLength(0);
  });

  it("allows a genuine organization member to create a workspace", async () => {
    const orgOwner = await createTestUser();
    const org = await createTestOrg(orgOwner.id);
    orgIds.push(org.id);
    userIds.push(orgOwner.id);

    const workspace = await workspaceService.createWorkspace(orgOwner.id, {
      name: "Legit Workspace",
      organizationId: org.id,
      slug: "legit-workspace",
    });

    expect(workspace.organizationId).toBe(org.id);
  });
});
