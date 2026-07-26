import { describe, it, expect, afterEach } from "vitest";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { sprintsTable } from "@/modules/sprint/sprint.schema";
import { sprintService } from "@/modules/sprint/sprint.service";
import {
  createTestUser,
  createTestOrg,
  createTestWorkspace,
  createTestProject,
  createTestSprint,
  cleanupTestData,
} from "../../helpers/db-fixtures";

describe("sprintService.startSprint concurrency (AUD-033 regression)", () => {
  const orgIds: string[] = [];
  const userIds: string[] = [];

  afterEach(async () => {
    await cleanupTestData({ organizationIds: orgIds, userIds });
    orgIds.length = 0;
    userIds.length = 0;
  });

  it("only ever allows one sprint per project to become active under concurrent start requests", async () => {
    const admin = await createTestUser();
    const org = await createTestOrg(admin.id);
    const workspace = await createTestWorkspace(org.id, admin.id);
    const project = await createTestProject(workspace.id, admin.id);
    orgIds.push(org.id);
    userIds.push(admin.id);

    const sprintA = await createTestSprint(project.id, { status: "planning" });
    const sprintB = await createTestSprint(project.id, { status: "planning" });

    const results = await Promise.allSettled([
      sprintService.startSprint(admin.id, project.id, sprintA.id),
      sprintService.startSprint(admin.id, project.id, sprintB.id),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const activeSprints = await db
      .select()
      .from(sprintsTable)
      .where(and(eq(sprintsTable.projectId, project.id), eq(sprintsTable.status, "active")));
    expect(activeSprints).toHaveLength(1);
  });

  it("still allows starting a sprint normally when no other sprint is active", async () => {
    const admin = await createTestUser();
    const org = await createTestOrg(admin.id);
    const workspace = await createTestWorkspace(org.id, admin.id);
    const project = await createTestProject(workspace.id, admin.id);
    orgIds.push(org.id);
    userIds.push(admin.id);

    const sprint = await createTestSprint(project.id, { status: "planning" });
    const result = await sprintService.startSprint(admin.id, project.id, sprint.id);
    expect(result.status).toBe("active");
  });
});
