import { describe, it, expect, afterEach } from "vitest";
import { taskService } from "@/modules/task/task.service";
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
import { asTestTicket } from "../../helpers/ticket-shape";

describe("epicService.deleteEpic orphans its issues instead of deleting them", () => {
  const orgIds: string[] = [];
  const userIds: string[] = [];

  afterEach(async () => {
    await cleanupTestData({ organizationIds: orgIds, userIds });
    orgIds.length = 0;
    userIds.length = 0;
  });

  it("sets epicId to null on the epic's issues and subtasks, but keeps the tickets", async () => {
    const admin = await createTestUser();
    const org = await createTestOrg(admin.id);
    const workspace = await createTestWorkspace(org.id, admin.id);
    const project = await createTestProject(workspace.id, admin.id);
    const epic = await createTestEpic(project.id);
    orgIds.push(org.id);
    userIds.push(admin.id);

    const issue = asTestTicket(
      await taskService.createTicket(admin.id, project.id, {
        title: "Issue in epic",
        reporterName: admin.name,
        epicId: epic.id,
      })
    );
    const subtask = asTestTicket(
      await taskService.createTicket(admin.id, project.id, {
        title: "Subtask of issue",
        reporterName: admin.name,
        parentTaskId: issue.id,
      })
    );
    expect(subtask.epicId).toBe(epic.id);

    await epicService.deleteEpic(admin.id, project.id, epic.id);

    const refreshedIssue = asTestTicket(
      await taskService.getTicket(admin.id, project.id, issue.id, false)
    );
    const refreshedSubtask = asTestTicket(
      await taskService.getTicket(admin.id, project.id, subtask.id, false)
    );
    expect(refreshedIssue.epicId).toBeNull();
    expect(refreshedSubtask.epicId).toBeNull();

    await expect(epicService.getEpic(admin.id, project.id, epic.id)).rejects.toThrow(/not found/i);
  });

  it("only an admin can delete an epic", async () => {
    const admin = await createTestUser();
    const org = await createTestOrg(admin.id);
    const workspace = await createTestWorkspace(org.id, admin.id);
    const project = await createTestProject(workspace.id, admin.id);
    const epic = await createTestEpic(project.id);
    const pm = await createTestUser();
    orgIds.push(org.id);
    userIds.push(admin.id, pm.id);

    await addWorkspaceMember(workspace.id, pm.id, "project_manager");

    await expect(epicService.deleteEpic(pm.id, project.id, epic.id)).rejects.toThrow(/Forbidden/);
  });
});
