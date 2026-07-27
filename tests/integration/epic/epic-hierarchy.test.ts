import { describe, it, expect, afterEach } from "vitest";
import { taskService } from "@/modules/task/task.service";
import {
  createTestUser,
  createTestOrg,
  createTestWorkspace,
  createTestProject,
  createTestEpic,
  cleanupTestData,
} from "../../helpers/db-fixtures";
import { asTestTicket } from "../../helpers/ticket-shape";

describe("Epic -> Issue -> Subtask hierarchy", () => {
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
    const epic = await createTestEpic(project.id);
    orgIds.push(org.id);
    userIds.push(admin.id);
    return { admin, project, epic };
  }

  it("denormalizes the parent's epicId onto a new subtask, regardless of what's passed", async () => {
    const { admin, project, epic } = await setup();
    const issue = asTestTicket(
      await taskService.createTicket(admin.id, project.id, {
        title: "Parent issue",
        reporterName: admin.name,
        epicId: epic.id,
      })
    );

    const otherEpic = await createTestEpic(project.id);
    const subtask = asTestTicket(
      await taskService.createTicket(admin.id, project.id, {
        title: "Subtask",
        reporterName: admin.name,
        parentTaskId: issue.id,
        // Deliberately pass a different epic — the server must ignore this and
        // follow the parent's epic instead.
        epicId: otherEpic.id,
      })
    );

    expect(subtask.epicId).toBe(epic.id);
    expect(subtask.parentTaskId).toBe(issue.id);
    // Subtasks are never independently sprint-scheduled.
    expect(subtask.sprintId).toBeNull();
  });

  it("rejects nesting a subtask under another subtask (depth cap = 1)", async () => {
    const { admin, project } = await setup();
    const issue = asTestTicket(
      await taskService.createTicket(admin.id, project.id, {
        title: "Parent issue",
        reporterName: admin.name,
      })
    );
    const subtask = asTestTicket(
      await taskService.createTicket(admin.id, project.id, {
        title: "Subtask",
        reporterName: admin.name,
        parentTaskId: issue.id,
      })
    );

    await expect(
      taskService.createTicket(admin.id, project.id, {
        title: "Grandchild subtask",
        reporterName: admin.name,
        parentTaskId: subtask.id,
      })
    ).rejects.toThrow(/more than one level deep/);
  });

  it("rejects turning a task that already has subtasks into a subtask itself", async () => {
    const { admin, project } = await setup();
    const parentA = asTestTicket(
      await taskService.createTicket(admin.id, project.id, {
        title: "Parent A",
        reporterName: admin.name,
      })
    );
    await taskService.createTicket(admin.id, project.id, {
      title: "Child of A",
      reporterName: admin.name,
      parentTaskId: parentA.id,
    });
    const parentB = asTestTicket(
      await taskService.createTicket(admin.id, project.id, {
        title: "Parent B",
        reporterName: admin.name,
      })
    );

    await expect(
      taskService.updateTicket(admin.id, project.id, parentA.id, { parentTaskId: parentB.id })
    ).rejects.toThrow(/already has subtasks/);
  });

  it("cascades an epic change on the parent issue down to its existing subtasks", async () => {
    const { admin, project, epic } = await setup();
    const issue = asTestTicket(
      await taskService.createTicket(admin.id, project.id, {
        title: "Parent issue",
        reporterName: admin.name,
        epicId: epic.id,
      })
    );
    const subtask = asTestTicket(
      await taskService.createTicket(admin.id, project.id, {
        title: "Subtask",
        reporterName: admin.name,
        parentTaskId: issue.id,
      })
    );
    expect(subtask.epicId).toBe(epic.id);

    const newEpic = await createTestEpic(project.id);
    await taskService.updateTicket(admin.id, project.id, issue.id, { epicId: newEpic.id });

    const refreshedSubtask = asTestTicket(
      await taskService.getTicket(admin.id, project.id, subtask.id, false)
    );
    expect(refreshedSubtask.epicId).toBe(newEpic.id);
  });
});
