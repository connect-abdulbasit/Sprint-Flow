import { describe, it, expect, afterEach } from "vitest";
import { GET as getActivities } from "@/app/api/workspaces/[id]/activities/route";
import { activityService } from "@/modules/activity/activity.service";
import {
  createTestUser,
  createTestOrg,
  createTestWorkspace,
  addWorkspaceMember,
  cleanupTestData,
} from "../../helpers/db-fixtures";
import { authedRequest } from "../../helpers/request";

describe("GET /api/workspaces/[id]/activities (AUD-006 regression)", () => {
  const orgIds: string[] = [];
  const userIds: string[] = [];

  afterEach(async () => {
    await cleanupTestData({ organizationIds: orgIds, userIds });
    orgIds.length = 0;
    userIds.length = 0;
  });

  it("returns 401 for an authenticated user who is not a member of the workspace", async () => {
    const owner = await createTestUser();
    const org = await createTestOrg(owner.id);
    const workspace = await createTestWorkspace(org.id, owner.id);
    orgIds.push(org.id);
    userIds.push(owner.id);

    await activityService.logActivity({
      workspaceId: workspace.id,
      userId: owner.id,
      action: "created",
      entityType: "project",
      entityId: "some-id",
      entityName: "Secret Project",
    });

    const outsider = await createTestUser();
    userIds.push(outsider.id);

    const req = await authedRequest(
      `http://localhost:3000/api/workspaces/${workspace.id}/activities`,
      outsider
    );
    const res = await getActivities(req, { params: Promise.resolve({ id: workspace.id }) });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(JSON.stringify(body)).not.toContain("Secret Project");
  });

  it("allows a genuine member to read the workspace activity feed", async () => {
    const owner = await createTestUser();
    const org = await createTestOrg(owner.id);
    const workspace = await createTestWorkspace(org.id, owner.id);
    orgIds.push(org.id);
    userIds.push(owner.id);

    await activityService.logActivity({
      workspaceId: workspace.id,
      userId: owner.id,
      action: "created",
      entityType: "project",
      entityId: "some-id",
      entityName: "Visible Project",
    });

    const member = await createTestUser();
    userIds.push(member.id);
    await addWorkspaceMember(workspace.id, member.id, "member");

    const req = await authedRequest(
      `http://localhost:3000/api/workspaces/${workspace.id}/activities`,
      member
    );
    const res = await getActivities(req, { params: Promise.resolve({ id: workspace.id }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(JSON.stringify(body)).toContain("Visible Project");
  });

  it("returns 401 for an unauthenticated request", async () => {
    const owner = await createTestUser();
    const org = await createTestOrg(owner.id);
    const workspace = await createTestWorkspace(org.id, owner.id);
    orgIds.push(org.id);
    userIds.push(owner.id);

    const req = new (await import("next/server")).NextRequest(
      `http://localhost:3000/api/workspaces/${workspace.id}/activities`
    );
    const res = await getActivities(req, { params: Promise.resolve({ id: workspace.id }) });
    expect(res.status).toBe(401);
  });
});
