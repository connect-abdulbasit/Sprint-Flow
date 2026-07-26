import { describe, it, expect, afterEach } from "vitest";
import { workspaceService } from "@/modules/workspace/workspace.service";
import { createTestUser, createTestOrg, cleanupTestData } from "../../helpers/db-fixtures";

describe("workspaceService.createWorkspace slug uniqueness (AUD-044 regression)", () => {
  const orgIds: string[] = [];
  const userIds: string[] = [];

  afterEach(async () => {
    await cleanupTestData({ organizationIds: orgIds, userIds });
    orgIds.length = 0;
    userIds.length = 0;
  });

  it("rejects creating a second workspace with a slug already in use, even in a different organization", async () => {
    const ownerA = await createTestUser();
    const orgA = await createTestOrg(ownerA.id);
    orgIds.push(orgA.id);
    userIds.push(ownerA.id);

    const ownerB = await createTestUser();
    const orgB = await createTestOrg(ownerB.id);
    orgIds.push(orgB.id);
    userIds.push(ownerB.id);

    await workspaceService.createWorkspace(ownerA.id, {
      name: "Engineering",
      organizationId: orgA.id,
      slug: "shared-slug-test",
    });

    await expect(
      workspaceService.createWorkspace(ownerB.id, {
        name: "Also Engineering",
        organizationId: orgB.id,
        slug: "shared-slug-test",
      })
    ).rejects.toThrow(/already taken/i);
  });
});
