export const MAX_ATTACHMENT_LABEL_LENGTH = 255;

/** Only http(s) links are ever stored — this is a link-attachment feature, not a
 * file upload, so there's no reason to accept `javascript:`/`data:`/`file:` etc. */
export function assertValidAttachmentUrl(url: unknown): asserts url is string {
  const raw = typeof url === "string" ? url.trim() : "";
  if (!raw) {
    throw new Error("fileUrl is required");
  }
  if (raw.length > 2048) {
    throw new Error("fileUrl is too long");
  }
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error("fileUrl must be a valid absolute URL");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("fileUrl must start with http:// or https://");
  }
}

export function normalizeAttachmentLabel(label: unknown): string | null {
  if (label === undefined || label === null) return null;
  const trimmed = String(label).trim();
  if (!trimmed) return null;
  if (trimmed.length > MAX_ATTACHMENT_LABEL_LENGTH) {
    throw new Error(`label must be ${MAX_ATTACHMENT_LABEL_LENGTH} characters or fewer`);
  }
  return trimmed;
}
