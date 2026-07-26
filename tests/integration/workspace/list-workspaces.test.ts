import { describe, it, expect, afterEach } from "vitest";
import { workspaceRepository } from "@/modules/workspace/workspace.repository";
import {
  createTestUser,
  createTestOrg,
  createTestWorkspace,
  addWorkspaceMember,
  cleanupTestData,
} from "../../helpers/db-fixtures";

describe("workspaceRepository.getUserWorkspaces (AUD-053 regression)", () => {
  const orgIds: string[] = [];
  const userIds: string[] = [];

  afterEach(async () => {
    await cleanupTestData({ organizationIds: orgIds, userIds });
    orgIds.length = 0;
    userIds.length = 0;
  });

  it("returns a real member count instead of a hardcoded 1", async () => {
    const owner = await createTestUser();
    const org = await createTestOrg(owner.id);
    const workspace = await createTestWorkspace(org.id, owner.id);
    orgIds.push(org.id);
    userIds.push(owner.id);

    const memberA = await createTestUser();
    const memberB = await createTestUser();
    userIds.push(memberA.id, memberB.id);
    await addWorkspaceMember(workspace.id, memberA.id, "member");
    await addWorkspaceMember(workspace.id, memberB.id, "member");

    const results = await workspaceRepository.getUserWorkspaces(owner.id);
    const found = results.find((w) => w?.id === workspace.id);

    // owner + memberA + memberB = 3
    expect(found?.memberCount).toBe(3);
  });

  it("returns memberCount 1 for a workspace with just its creator", async () => {
    const owner = await createTestUser();
    const org = await createTestOrg(owner.id);
    const workspace = await createTestWorkspace(org.id, owner.id);
    orgIds.push(org.id);
    userIds.push(owner.id);

    const results = await workspaceRepository.getUserWorkspaces(owner.id);
    const found = results.find((w) => w?.id === workspace.id);
    expect(found?.memberCount).toBe(1);
  });
});
