// Client-side mirror of the server-side allowlist in
// src/modules/task/task.service.ts (ALLOWED_TICKET_IMAGE_MIME_TYPES). This only
// improves UX by failing fast before a network round-trip — the server re-validates
// independently and is the actual security boundary (AUD-002).
export const ALLOWED_TICKET_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;
export const MAX_TICKET_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

export function validateTicketImageFile(file: File): string | null {
  if (!ALLOWED_TICKET_IMAGE_MIME_TYPES.includes(file.type as never)) {
    return "Please choose a JPEG, PNG, WebP, or GIF image.";
  }
  if (file.size > MAX_TICKET_IMAGE_BYTES) {
    return `Image is too large. Maximum size is ${MAX_TICKET_IMAGE_BYTES / (1024 * 1024)}MB.`;
  }
  return null;
}
