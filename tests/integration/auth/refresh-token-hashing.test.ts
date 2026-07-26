import { describe, it, expect, afterEach } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sessionsTable } from "@/modules/auth/auth.schema";
import { authService } from "@/modules/auth/auth.service";
import { hashToken } from "@/lib/token-hash";
import { createTestUser, cleanupTestData } from "../../helpers/db-fixtures";

describe("authService session storage (AUD-021 regression)", () => {
  const userIds: string[] = [];

  afterEach(async () => {
    await cleanupTestData({ userIds });
    userIds.length = 0;
  });

  it("never stores the raw refresh token in the database", async () => {
    const user = await createTestUser();
    userIds.push(user.id);

    const { refreshToken } = await authService.createSession(user.id);

    const [row] = await db.select().from(sessionsTable).where(eq(sessionsTable.userId, user.id));
    expect(row.refreshToken).not.toBe(refreshToken);
    expect(row.refreshToken).toBe(hashToken(refreshToken));
  });

  it("can still look up and rotate a session using the raw token the client holds", async () => {
    const user = await createTestUser();
    userIds.push(user.id);

    const { refreshToken } = await authService.createSession(user.id);
    const rotated = await authService.rotateSession(refreshToken);

    expect(rotated).not.toBeNull();
    expect(rotated?.userId).toBe(user.id);
    expect(rotated?.refreshToken).not.toBe(refreshToken);
  });

  it("stores the rotated token hashed too, and the old raw token no longer works", async () => {
    const user = await createTestUser();
    userIds.push(user.id);

    const { refreshToken: original } = await authService.createSession(user.id);
    const rotated = await authService.rotateSession(original);
    expect(rotated).not.toBeNull();

    const stillWorks = await authService.rotateSession(original);
    expect(stillWorks).toBeNull();

    const [row] = await db.select().from(sessionsTable).where(eq(sessionsTable.userId, user.id));
    expect(row.refreshToken).toBe(hashToken(rotated!.refreshToken));
  });

  it("revokeSession deletes by hash and the raw token becomes unusable", async () => {
    const user = await createTestUser();
    userIds.push(user.id);

    const { refreshToken } = await authService.createSession(user.id);
    await authService.revokeSession(refreshToken);

    const rows = await db.select().from(sessionsTable).where(eq(sessionsTable.userId, user.id));
    expect(rows).toHaveLength(0);
  });
});
