import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { usersTable, sessionsTable } from "@/db";
import { GET as googleCallback } from "@/app/api/auth/google/callback/route";

const TEST_EMAIL = "aud001-oauth-test@example.com";
const STATE = "test-state-value";

function buildRequest() {
  const url = `http://localhost:3000/api/auth/google/callback?code=fake-code&state=${STATE}`;
  return new NextRequest(url, {
    headers: { cookie: `auth_state=${STATE}` },
  });
}

async function cleanupUser() {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, TEST_EMAIL));
  if (user) {
    await db.delete(sessionsTable).where(eq(sessionsTable.userId, user.id));
    await db.delete(usersTable).where(eq(usersTable.id, user.id));
  }
}

describe("GET /api/auth/google/callback (AUD-001 regression)", () => {
  beforeEach(async () => {
    await cleanupUser();

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = typeof input === "string" ? input : input.toString();
        if (url.includes("oauth2.googleapis.com/token")) {
          return new Response(JSON.stringify({ access_token: "fake-google-access-token" }), {
            status: 200,
          });
        }
        if (url.includes("googleapis.com/oauth2/v2/userinfo")) {
          return new Response(
            JSON.stringify({ email: TEST_EMAIL, name: "OAuth Tester", picture: null }),
            { status: 200 }
          );
        }
        throw new Error(`Unexpected fetch to ${url}`);
      })
    );
  });

  afterAll(async () => {
    await cleanupUser();
    vi.unstubAllGlobals();
  });

  it("creates a new user with authProvider=google when no account exists", async () => {
    const res = await googleCallback(buildRequest());

    expect(res.status).toBe(307); // NextResponse.redirect default
    expect(res.headers.get("location")).toContain("/organizations");
    expect(res.cookies.get("accessToken")?.value).toBeTruthy();
    expect(res.cookies.get("refreshToken")?.value).toBeTruthy();

    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, TEST_EMAIL));
    expect(user).toBeTruthy();
    expect(user.authProvider).toBe("google");
  });

  it("does NOT log the caller into a pre-existing password-based account with the same email", async () => {
    const [inserted] = await db
      .insert(usersTable)
      .values({
        email: TEST_EMAIL,
        name: "Victim",
        passwordHash: "attacker-controlled-hash",
        authProvider: "password",
      })
      .returning();

    const res = await googleCallback(buildRequest());

    expect(res.headers.get("location")).toContain("/signin");
    expect(res.headers.get("location")).toContain("error=account_exists_password");

    // No session should ever have been issued for the victim's account.
    expect(res.cookies.get("accessToken")?.value).toBeFalsy();
    expect(res.cookies.get("refreshToken")?.value).toBeFalsy();

    const sessions = await db
      .select()
      .from(sessionsTable)
      .where(eq(sessionsTable.userId, inserted.id));
    expect(sessions).toHaveLength(0);

    // The account itself must be untouched.
    const [unchanged] = await db.select().from(usersTable).where(eq(usersTable.id, inserted.id));
    expect(unchanged.passwordHash).toBe("attacker-controlled-hash");
    expect(unchanged.authProvider).toBe("password");
  });

  it("allows repeat Google sign-in for an account that was itself created via Google", async () => {
    const [inserted] = await db
      .insert(usersTable)
      .values({
        email: TEST_EMAIL,
        name: "Old Name",
        passwordHash: "",
        authProvider: "google",
      })
      .returning();

    const res = await googleCallback(buildRequest());

    expect(res.headers.get("location")).toContain("/organizations");
    expect(res.cookies.get("accessToken")?.value).toBeTruthy();

    const [updated] = await db.select().from(usersTable).where(eq(usersTable.id, inserted.id));
    expect(updated.name).toBe("OAuth Tester");
  });
});
