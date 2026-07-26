import bcrypt from "bcryptjs";

// AUD-029: bumped from 10 to 12 rounds — OWASP's current minimum recommendation.
export function hashPassword(password: string) {
  return bcrypt.hashSync(password, 12);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compareSync(password, hash);
}
