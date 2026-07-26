// AUD-030: signup previously only checked that a password was truthy — a single
// character was accepted, client and server. This is a deliberately simple length-only
// policy (no forced character-class mix, which mostly just pushes users toward
// predictable substitutions) matching current NIST guidance.
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 256;

export function validatePasswordStrength(password: string): string | null {
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`;
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return `Password must be at most ${MAX_PASSWORD_LENGTH} characters long.`;
  }
  return null;
}
