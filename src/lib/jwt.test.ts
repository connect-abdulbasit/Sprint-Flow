import { describe, it, expect } from "vitest";
import { signAccessToken, verifyAccessToken } from "./jwt";

function base64UrlEncode(input: string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

describe("jwt (AUD-064 regression)", () => {
  it("verifies a normally-signed token", async () => {
    const token = await signAccessToken({ id: "user-1", email: "a@example.com", name: "A" });
    const payload = await verifyAccessToken(token);
    expect(payload.sub).toBe("user-1");
  });

  it("rejects a token whose header claims an unsupported algorithm, even with the original signature", async () => {
    const token = await signAccessToken({ id: "user-1", email: "a@example.com", name: "A" });
    const [, payloadB64, signature] = token.split(".");

    const forgedHeader = base64UrlEncode(JSON.stringify({ alg: "none", typ: "JWT" }));
    const forgedToken = `${forgedHeader}.${payloadB64}.${signature}`;

    await expect(verifyAccessToken(forgedToken)).rejects.toThrow(/Unsupported JWT algorithm/);
  });

  it("rejects a token claiming alg: HS512", async () => {
    const token = await signAccessToken({ id: "user-1", email: "a@example.com", name: "A" });
    const [, payloadB64, signature] = token.split(".");
    const forgedHeader = base64UrlEncode(JSON.stringify({ alg: "HS512", typ: "JWT" }));
    const forgedToken = `${forgedHeader}.${payloadB64}.${signature}`;

    await expect(verifyAccessToken(forgedToken)).rejects.toThrow(/Unsupported JWT algorithm/);
  });

  it("still rejects a tampered signature on a correctly-labeled token", async () => {
    const token = await signAccessToken({ id: "user-1", email: "a@example.com", name: "A" });
    const tampered = token.slice(0, -4) + "abcd";
    await expect(verifyAccessToken(tampered)).rejects.toThrow(/Invalid signature/);
  });
});
