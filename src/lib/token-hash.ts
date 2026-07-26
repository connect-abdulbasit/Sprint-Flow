import crypto from "crypto";

/**
 * AUD-021: refresh tokens must never be stored raw. SHA-256 is appropriate here (unlike
 * for passwords) because the token itself is already high-entropy random data, not a
 * low-entropy human-chosen secret — there's nothing for an attacker to dictionary-attack,
 * so a slow KDF like bcrypt buys nothing and only adds cost to every session lookup.
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
