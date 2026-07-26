import { describe, it, expect, afterEach } from "vitest";
import { eq } from "drizzle-orm";
import { access, mkdir, writeFile, rm } from "fs/promises";
import { join } from "path";
import { db } from "@/lib/db";
import { workspacesTable } from "@/modules/workspace/workspace.schema";
import { organizationService } from "@/modules/organization/organization.service";
import {
  createTestUser,
  createTestOrg,
  createTestWorkspace,
  cleanupTestData,
} from "../../helpers/db-fixtures";

function uploadDir() {
  return join(process.cwd(), "public", "uploads", "workspaces");
}

async function fileExists(path: string) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

describe("organizationService.deleteOrganization (AUD-043 regression)", () => {
  const orgIds: string[] = [];
  const userIds: string[] = [];

  afterEach(async () => {
    // orgIds already deleted by the test itself in most cases; cleanup is defensive.
    await cleanupTestData({ organizationIds: orgIds, userIds });
    orgIds.length = 0;
    userIds.length = 0;
  });

  it("removes the workspace's uploaded logo file from disk when the parent org is deleted", async () => {
    const owner = await createTestUser();
    const org = await createTestOrg(owner.id);
    const workspace = await createTestWorkspace(org.id, owner.id);
    userIds.push(owner.id);

    const dir = uploadDir();
    await mkdir(dir, { recursive: true });
    const filePath = join(dir, `${workspace.id}.png`);
    await writeFile(filePath, Buffer.from([1, 2, 3]));
    await db
      .update(workspacesTable)
      .set({ logoUrl: `/uploads/workspaces/${workspace.id}.png` })
      .where(eq(workspacesTable.id, workspace.id));

    expect(await fileExists(filePath)).toBe(true);

    await organizationService.deleteOrganization(owner.id, org.id);

    expect(await fileExists(filePath)).toBe(false);
    await rm(filePath, { force: true });
  });
});
