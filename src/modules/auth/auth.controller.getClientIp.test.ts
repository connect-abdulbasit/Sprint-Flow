import { describe, it, expect, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { getClientIp } from "./auth.controller";

describe("getClientIp (AUD-020 regression)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("ignores a client-supplied X-Forwarded-For header when TRUST_PROXY_HEADERS is unset", () => {
    vi.stubEnv("TRUST_PROXY_HEADERS", "");
    const req = new NextRequest("http://localhost:3000/api/auth/signin", {
      headers: { "x-forwarded-for": "1.2.3.4" },
    });
    // Every un-proxied request must resolve to the same fixed bucket, regardless of
    // what the client claims its IP is — otherwise an attacker can mint a fresh bucket
    // on every request and bypass the limiter entirely.
    expect(getClientIp(req)).toBe("unproxied");
  });

  it("still ignores a spoofed header even when the attacker sends a different value each time", () => {
    vi.stubEnv("TRUST_PROXY_HEADERS", "");
    const first = getClientIp(
      new NextRequest("http://localhost:3000/x", { headers: { "x-forwarded-for": "1.1.1.1" } })
    );
    const second = getClientIp(
      new NextRequest("http://localhost:3000/x", { headers: { "x-forwarded-for": "9.9.9.9" } })
    );
    expect(first).toBe(second);
  });

  it("trusts X-Forwarded-For only when explicitly configured to sit behind a proxy", () => {
    vi.stubEnv("TRUST_PROXY_HEADERS", "1");
    const req = new NextRequest("http://localhost:3000/api/auth/signin", {
      headers: { "x-forwarded-for": "203.0.113.5, 10.0.0.1" },
    });
    expect(getClientIp(req)).toBe("203.0.113.5");
  });

  it("falls back to X-Real-IP when trusted and X-Forwarded-For is absent", () => {
    vi.stubEnv("TRUST_PROXY_HEADERS", "true");
    const req = new NextRequest("http://localhost:3000/api/auth/signin", {
      headers: { "x-real-ip": "198.51.100.7" },
    });
    expect(getClientIp(req)).toBe("198.51.100.7");
  });
});
