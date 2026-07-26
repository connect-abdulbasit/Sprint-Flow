import { describe, it, expect, afterEach } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sessionsTable } from "@/modules/auth/auth.schema";
import { authService } from "@/modules/auth/auth.service";
import { hashPassword, verifyPassword } from "@/lib/password-hash";
import { createTestUser, cleanupTestData } from "../../helpers/db-fixtures";

describe("authService.logoutAllDevices (AUD-026 regression)", () => {
  const userIds: string[] = [];

  afterEach(async () => {
    await cleanupTestData({ userIds });
    userIds.length = 0;
  });

  it("deletes every session for the user", async () => {
    const user = await createTestUser();
    userIds.push(user.id);

    await authService.createSession(user.id);
    await authService.createSession(user.id);
    await authService.createSession(user.id);

    const before = await db.select().from(sessionsTable).where(eq(sessionsTable.userId, user.id));
    expect(before.length).toBe(3);

    await authService.logoutAllDevices(user.id);

    const after = await db.select().from(sessionsTable).where(eq(sessionsTable.userId, user.id));
    expect(after).toHaveLength(0);
  });
});

describe("authService.changePassword (AUD-026 / AUD-030 regression)", () => {
  const userIds: string[] = [];

  afterEach(async () => {
    await cleanupTestData({ userIds });
    userIds.length = 0;
  });

  it("rejects the wrong current password", async () => {
    const user = await createTestUser({ passwordHash: hashPassword("original-pass") });
    userIds.push(user.id);

    await expect(
      authService.changePassword(user.id, "wrong-password", "new-strong-pass")
    ).rejects.toThrow(/incorrect/i);
  });

  it("rejects a weak new password", async () => {
    const user = await createTestUser({ passwordHash: hashPassword("original-pass") });
    userIds.push(user.id);

    await expect(authService.changePassword(user.id, "original-pass", "short")).rejects.toThrow(
      /at least 8 characters/i
    );
  });

  it("updates the password hash and revokes all existing sessions, issuing a fresh one", async () => {
    const user = await createTestUser({ passwordHash: hashPassword("original-pass") });
    userIds.push(user.id);

    await authService.createSession(user.id); // an "other device" session

    const result = await authService.changePassword(user.id, "original-pass", "new-strong-pass");
    expect(result.accessToken).toBeTruthy();
    expect(result.session.refreshToken).toBeTruthy();

    const updatedUser = await authService.getUserById(user.id);
    expect(verifyPassword("new-strong-pass", updatedUser!.passwordHash)).toBe(true);
    expect(verifyPassword("original-pass", updatedUser!.passwordHash)).toBe(false);

    // Exactly one session should exist: the fresh one just issued.
    const sessions = await db.select().from(sessionsTable).where(eq(sessionsTable.userId, user.id));
    expect(sessions).toHaveLength(1);
  });

  it("rejects password changes for Google-linked accounts with no password", async () => {
    const user = await createTestUser({ authProvider: "google", passwordHash: "" });
    userIds.push(user.id);

    await expect(
      authService.changePassword(user.id, "anything", "new-strong-pass")
    ).rejects.toThrow(/Google/);
  });
});
