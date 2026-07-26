import { describe, it, expect, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { authController } from "@/modules/auth/auth.controller";
import { createTestUser, cleanupTestData } from "../../helpers/db-fixtures";

function signinRequest(email: string, password: string, ip: string) {
  return new NextRequest("http://localhost:3000/api/auth/signin", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify({ email, password }),
  });
}

describe("authController.signin (AUD-022 / AUD-024 regression)", () => {
  const userIds: string[] = [];

  afterEach(async () => {
    await cleanupTestData({ userIds });
    userIds.length = 0;
  });

  it("returns the same error for a non-existent email as for a wrong password, without crashing", async () => {
    const uniqueIp = `10.${Math.floor(Math.random() * 250)}.0.1`;
    const res = await authController.signin(
      signinRequest("definitely-not-a-real-user@example.com", "whatever123", uniqueIp)
    );
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Invalid email or password");
  });

  it("rejects a wrong password for a real account with the same message", async () => {
    const user = await createTestUser({
      passwordHash: await import("@/lib/auth").then((m) => m.hashPassword("correct-horse")),
    });
    userIds.push(user.id);

    const uniqueIp = `10.${Math.floor(Math.random() * 250)}.0.2`;
    const res = await authController.signin(signinRequest(user.email, "wrong-password", uniqueIp));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Invalid email or password");
  });

  it("locks out an account after repeated failed attempts regardless of the caller's IP", async () => {
    const user = await createTestUser({
      passwordHash: await import("@/lib/auth").then((m) => m.hashPassword("correct-horse")),
    });
    userIds.push(user.id);

    // 5 failed attempts from 5 different IPs — the account-level bucket (not the IP
    // bucket) should still kick in, since AUD-020 means IP alone can't be trusted.
    let lastStatus = 0;
    for (let i = 0; i < 6; i++) {
      const res = await authController.signin(
        signinRequest(user.email, "wrong-password", `172.16.${i}.${i}`)
      );
      lastStatus = res.status;
    }
    expect(lastStatus).toBe(429);
  });
});
