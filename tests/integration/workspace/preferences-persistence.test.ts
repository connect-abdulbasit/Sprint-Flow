import { describe, it, expect, afterEach } from "vitest";
import { workspaceService } from "@/modules/workspace/workspace.service";
import {
  createTestUser,
  createTestOrg,
  createTestWorkspace,
  addWorkspaceMember,
  cleanupTestData,
} from "../../helpers/db-fixtures";

describe("workspace preferences & notification settings persistence (AUD-047 regression)", () => {
  const orgIds: string[] = [];
  const userIds: string[] = [];

  afterEach(async () => {
    await cleanupTestData({ organizationIds: orgIds, userIds });
    orgIds.length = 0;
    userIds.length = 0;
  });

  it("persists preference changes across separate get calls, not just an echo of the request", async () => {
    const admin = await createTestUser();
    const org = await createTestOrg(admin.id);
    const workspace = await createTestWorkspace(org.id, admin.id);
    orgIds.push(org.id);
    userIds.push(admin.id);

    const defaults = await workspaceService.getWorkspacePreferences(admin.id, workspace.id);
    expect(defaults.defaultView).toBe("board");

    await workspaceService.updateWorkspacePreferences(admin.id, workspace.id, {
      defaultView: "list",
      tags: ["urgent", "design"],
    });

    // A fresh call, simulating a page reload — must reflect the saved value, not a
    // hardcoded default.
    const reloaded = await workspaceService.getWorkspacePreferences(admin.id, workspace.id);
    expect(reloaded.defaultView).toBe("list");
    expect(reloaded.tags).toEqual(["urgent", "design"]);
  });

  it("persists notification setting changes across separate get calls", async () => {
    const admin = await createTestUser();
    const org = await createTestOrg(admin.id);
    const workspace = await createTestWorkspace(org.id, admin.id);
    orgIds.push(org.id);
    userIds.push(admin.id);

    await workspaceService.updateWorkspaceNotificationSettings(admin.id, workspace.id, {
      taskAssigned: false,
      comments: false,
    });

    const reloaded = await workspaceService.getWorkspaceNotificationSettings(
      admin.id,
      workspace.id
    );
    expect(reloaded.taskAssigned).toBe(false);
    expect(reloaded.comments).toBe(false);
    expect(reloaded.memberJoined).toBe(true);
  });

  it("rejects preference reads/writes from a non-member", async () => {
    const admin = await createTestUser();
    const org = await createTestOrg(admin.id);
    const workspace = await createTestWorkspace(org.id, admin.id);
    orgIds.push(org.id);
    userIds.push(admin.id);

    const outsider = await createTestUser();
    userIds.push(outsider.id);

    await expect(
      workspaceService.getWorkspacePreferences(outsider.id, workspace.id)
    ).rejects.toThrow(/Forbidden/);
    await expect(
      workspaceService.updateWorkspaceNotificationSettings(outsider.id, workspace.id, {
        taskAssigned: false,
      })
    ).rejects.toThrow(/Forbidden/);
  });

  it("allows any workspace member, not just admins, to read and save their view preference", async () => {
    const admin = await createTestUser();
    const org = await createTestOrg(admin.id);
    const workspace = await createTestWorkspace(org.id, admin.id);
    orgIds.push(org.id);
    userIds.push(admin.id);

    const member = await createTestUser();
    userIds.push(member.id);
    await addWorkspaceMember(workspace.id, member.id, "member");

    const updated = await workspaceService.updateWorkspacePreferences(member.id, workspace.id, {
      defaultView: "timeline",
    });
    expect(updated.defaultView).toBe("timeline");
  });
});
