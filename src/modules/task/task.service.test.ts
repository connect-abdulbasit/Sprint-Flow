import { describe, it, expect } from "vitest";
import {
  parseImagePayload,
  ALLOWED_TICKET_IMAGE_MIME_TYPES,
  MAX_TICKET_IMAGE_BYTES,
} from "./task.service";

function toBase64DataUrl(mime: string, bytes: number) {
  const buf = Buffer.alloc(bytes, 1);
  return `data:${mime};base64,${buf.toString("base64")}`;
}

describe("parseImagePayload (AUD-002 / AUD-037 regression)", () => {
  it("returns null image when imageBase64 is null", () => {
    expect(parseImagePayload(null, null)).toEqual({ image: null, imageMimeType: null });
  });

  it("accepts every allowed image MIME type", () => {
    for (const mime of ALLOWED_TICKET_IMAGE_MIME_TYPES) {
      const result = parseImagePayload(toBase64DataUrl(mime, 10), null);
      expect(result.imageMimeType).toBe(mime);
      expect(result.image?.length).toBe(10);
    }
  });

  it("rejects a non-image MIME type disguised as a data URL (stored XSS vector)", () => {
    expect(() => parseImagePayload(toBase64DataUrl("text/html", 10), null)).toThrow(
      /Unsupported image type/
    );
  });

  it("rejects a non-image MIME type passed via the explicit imageMimeType field", () => {
    const raw = Buffer.from("<script>alert(1)</script>").toString("base64");
    expect(() => parseImagePayload(raw, "text/html")).toThrow(/Unsupported image type/);
  });

  it("rejects an svg (can embed inline script) since it's not in the allowlist", () => {
    expect(() => parseImagePayload(toBase64DataUrl("image/svg+xml", 10), null)).toThrow(
      /Unsupported image type/
    );
  });

  it("rejects a payload larger than the size cap", () => {
    expect(() =>
      parseImagePayload(toBase64DataUrl("image/png", MAX_TICKET_IMAGE_BYTES + 1), null)
    ).toThrow(/too large/);
  });

  it("accepts a payload exactly at the size cap", () => {
    const result = parseImagePayload(toBase64DataUrl("image/png", MAX_TICKET_IMAGE_BYTES), null);
    expect(result.image?.length).toBe(MAX_TICKET_IMAGE_BYTES);
  });

  it("throws when imageMimeType is missing and cannot be inferred", () => {
    const raw = Buffer.from("abc").toString("base64");
    expect(() => parseImagePayload(raw, undefined)).toThrow(/imageMimeType is required/);
  });

  it("throws when the base64 content decodes to zero bytes", () => {
    expect(() => parseImagePayload("!!!!", "image/png")).toThrow(/not valid base64/);
  });
});
