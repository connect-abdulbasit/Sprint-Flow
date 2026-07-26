// AUD-046: organization/workspace name inputs were only checked for non-empty: a
// 256+ character name hit the underlying varchar(255) column and surfaced as a raw,
// unhandled Postgres error (500) instead of a clean validation message.
export const MAX_NAME_LENGTH = 255;

export function validateNameLength(name: string, label: string): string | null {
  if (name.length > MAX_NAME_LENGTH) {
    return `${label} must be at most ${MAX_NAME_LENGTH} characters.`;
  }
  return null;
}
