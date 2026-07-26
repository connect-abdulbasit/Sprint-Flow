import { describe, it, expect, afterEach } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { tasksTable } from "@/modules/task/task.schema";
import { taskRepository } from "@/modules/task/task.repository";
import {
  createTestUser,
  createTestOrg,
  createTestWorkspace,
  createTestProject,
  cleanupTestData,
} from "../../helpers/db-fixtures";

describe("taskRepository.createWithNextTicketNumber concurrency (AUD-034 regression)", () => {
  const orgIds: string[] = [];
  const userIds: string[] = [];

  afterEach(async () => {
    await cleanupTestData({ organizationIds: orgIds, userIds });
    orgIds.length = 0;
    userIds.length = 0;
  });

  it("assigns unique, gapless ticket numbers under concurrent creation in the same project", async () => {
    const admin = await createTestUser();
    const org = await createTestOrg(admin.id);
    const workspace = await createTestWorkspace(org.id, admin.id);
    const project = await createTestProject(workspace.id, admin.id);
    orgIds.push(org.id);
    userIds.push(admin.id);

    const concurrency = 8;
    const results = await Promise.all(
      Array.from({ length: concurrency }, (_, i) =>
        taskRepository.createWithNextTicketNumber({
          projectId: project.id,
          title: `Concurrent ticket ${i}`,
          type: "task",
          priority: "medium",
          status: "todo",
          reporterId: admin.id,
          reporterName: admin.name,
        })
      )
    );

    const ticketNumbers = results.map((r) => r.ticketNumber).sort((a, b) => a - b);
    const uniqueNumbers = new Set(ticketNumbers);
    expect(uniqueNumbers.size).toBe(concurrency);
    expect(ticketNumbers).toEqual(Array.from({ length: concurrency }, (_, i) => i + 1));

    const rows = await db.select().from(tasksTable).where(eq(tasksTable.projectId, project.id));
    expect(rows).toHaveLength(concurrency);
  });
});
