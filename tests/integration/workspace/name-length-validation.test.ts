import { describe, it, expect, afterEach } from "vitest";
import { workspaceService } from "@/modules/workspace/workspace.service";
import { organizationService } from "@/modules/organization/organization.service";
import { createTestUser, createTestOrg, cleanupTestData } from "../../helpers/db-fixtures";

describe("name length validation (AUD-046 regression)", () => {
  const orgIds: string[] = [];
  const userIds: string[] = [];

  afterEach(async () => {
    await cleanupTestData({ organizationIds: orgIds, userIds });
    orgIds.length = 0;
    userIds.length = 0;
  });

  it("rejects a workspace name over 255 characters with a clean error, not a raw DB error", async () => {
    const owner = await createTestUser();
    const org = await createTestOrg(owner.id);
    orgIds.push(org.id);
    userIds.push(owner.id);

    await expect(
      workspaceService.createWorkspace(owner.id, {
        name: "x".repeat(300),
        organizationId: org.id,
        slug: "too-long-name-test",
      })
    ).rejects.toThrow(/at most 255 characters/i);
  });

  it("rejects an organization name over 255 characters", async () => {
    const owner = await createTestUser();
    userIds.push(owner.id);

    await expect(organizationService.createOrganization(owner.id, "y".repeat(300))).rejects.toThrow(
      /at most 255 characters/i
    );
  });

  it("still accepts a normal-length name", async () => {
    const owner = await createTestUser();
    const org = await createTestOrg(owner.id);
    orgIds.push(org.id);
    userIds.push(owner.id);

    const workspace = await workspaceService.createWorkspace(owner.id, {
      name: "Perfectly Reasonable Name",
      organizationId: org.id,
      slug: "reasonable-name-test",
    });
    expect(workspace.name).toBe("Perfectly Reasonable Name");
  });
});
