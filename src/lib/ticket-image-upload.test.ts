import { describe, it, expect } from "vitest";
import { validateTicketImageFile, MAX_TICKET_IMAGE_BYTES } from "./ticket-image-upload";

function makeFile(type: string, size: number) {
  return new File([new Uint8Array(size)], "cover.bin", { type });
}

describe("validateTicketImageFile (AUD-002 / AUD-037 client-side mirror)", () => {
  it("accepts a small PNG", () => {
    expect(validateTicketImageFile(makeFile("image/png", 1024))).toBeNull();
  });

  it("rejects a non-image MIME type", () => {
    expect(validateTicketImageFile(makeFile("text/html", 1024))).toMatch(/JPEG, PNG, WebP/);
  });

  it("rejects an oversized image", () => {
    expect(validateTicketImageFile(makeFile("image/png", MAX_TICKET_IMAGE_BYTES + 1))).toMatch(
      /too large/
    );
  });
});
