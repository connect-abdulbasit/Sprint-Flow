import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "./middleware";

function req(path: string, init: { method?: string; origin?: string; cookie?: string } = {}) {
  const headers = new Headers();
  if (init.origin) headers.set("origin", init.origin);
  if (init.cookie) headers.set("cookie", init.cookie);
  return new NextRequest(`http://localhost:3000${path}`, {
    method: init.method ?? "GET",
    headers,
  });
}

describe("middleware (AUD-027 / AUD-028 regression)", () => {
  it("rejects a cross-origin POST to an API route with 403", async () => {
    const res = await middleware(
      req("/api/workspaces", { method: "POST", origin: "https://evil.example.com" })
    );
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toMatch(/cross-origin/i);
  });

  it("does not block a same-origin POST on Origin grounds", async () => {
    const res = await middleware(
      req("/api/workspaces", { method: "POST", origin: "http://localhost:3000" })
    );
    // No auth cookie present, so this should fail auth (401 JSON), not CSRF (403).
    expect(res.status).toBe(401);
  });

  it("does not block a cross-origin GET (safe method) on Origin grounds", async () => {
    const res = await middleware(
      req("/api/workspaces", { method: "GET", origin: "https://evil.example.com" })
    );
    // Safe method bypasses the CSRF check entirely; falls through to the auth check.
    expect(res.status).toBe(401);
  });

  it("allows a cross-origin POST with no Origin header through the CSRF check", async () => {
    const res = await middleware(req("/api/workspaces", { method: "POST" }));
    // No Origin header at all — not blocked by CSRF; still 401 because unauthenticated.
    expect(res.status).toBe(401);
  });

  it("returns 401 JSON (not an HTML redirect) for an unauthenticated API request", async () => {
    const res = await middleware(req("/api/workspaces"));
    expect(res.status).toBe(401);
    expect(res.headers.get("content-type")).toContain("application/json");
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("still redirects an unauthenticated page navigation to /signin", async () => {
    const res = await middleware(req("/organizations"));
    expect([302, 307]).toContain(res.status);
    expect(res.headers.get("location")).toContain("/signin");
  });
});
