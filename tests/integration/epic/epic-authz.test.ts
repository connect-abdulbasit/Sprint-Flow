import { describe, it, expect, afterEach } from "vitest";
import { epicService } from "@/modules/epic/epic.service";
import {
  createTestUser,
  createTestOrg,
  createTestWorkspace,
  createTestProject,
  createTestEpic,
  addWorkspaceMember,
  cleanupTestData,
} from "../../helpers/db-fixtures";

describe("epicService role-based authorization", () => {
  const orgIds: string[] = [];
  const userIds: string[] = [];

  afterEach(async () => {
    await cleanupTestData({ organizationIds: orgIds, userIds });
    orgIds.length = 0;
    userIds.length = 0;
  });

  async function setup() {
    const admin = await createTestUser();
    const org = await createTestOrg(admin.id);
    const workspace = await createTestWorkspace(org.id, admin.id);
    const project = await createTestProject(workspace.id, admin.id);
    const member = await createTestUser();
    const pm = await createTestUser();
    await addWorkspaceMember(workspace.id, member.id, "member");
    await addWorkspaceMember(workspace.id, pm.id, "project_manager");
    orgIds.push(org.id);
    userIds.push(admin.id, member.id, pm.id);
    return { admin, member, pm, workspace, project };
  }

  it("a plain member cannot create an epic", async () => {
    const { member, project } = await setup();
    await expect(
      epicService.createEpic(member.id, project.id, { name: "Member's epic" })
    ).rejects.toThrow(/Forbidden/);
  });

  it("a plain member can view epics", async () => {
    const { member, project } = await setup();
    await createTestEpic(project.id);
    await expect(epicService.listEpics(member.id, project.id)).resolves.not.toThrow();
  });

  it("a project_manager can create, edit, archive, duplicate, and move epics", async () => {
    const { pm, project } = await setup();

    const created = await epicService.createEpic(pm.id, project.id, { name: "PM's epic" });
    const updated = await epicService.updateEpic(pm.id, project.id, created.id, {
      status: "in_progress",
    });
    expect(updated.status).toBe("in_progress");

    const archived = await epicService.archiveEpic(pm.id, project.id, created.id);
    expect(archived.archivedAt).not.toBeNull();

    const duplicated = await epicService.duplicateEpic(pm.id, project.id, created.id);
    expect(duplicated.name).toContain("copy");

    const secondEpic = await epicService.createEpic(pm.id, project.id, { name: "Second" });
    const moved = await epicService.moveEpic(pm.id, project.id, secondEpic.id, 0);
    expect(moved[0].id).toBe(secondEpic.id);
  });

  it("a project_manager cannot delete an epic — only an admin can", async () => {
    const { pm, admin, project } = await setup();
    const epic = await createTestEpic(project.id);

    await expect(epicService.deleteEpic(pm.id, project.id, epic.id)).rejects.toThrow(/Forbidden/);
    await expect(epicService.deleteEpic(admin.id, project.id, epic.id)).resolves.toBeUndefined();
  });

  it("a non-member of the workspace cannot see or touch the project's epics at all", async () => {
    const { project } = await setup();
    const outsider = await createTestUser();
    userIds.push(outsider.id);

    await expect(epicService.listEpics(outsider.id, project.id)).rejects.toThrow(/access denied/);
    await expect(
      epicService.createEpic(outsider.id, project.id, { name: "Intruder epic" })
    ).rejects.toThrow(/access denied/);
  });
});
