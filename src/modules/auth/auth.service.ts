import { authRepository } from "./auth.repository";
import { signAccessToken } from "@/lib/jwt";
import { hashToken } from "@/lib/token-hash";
import { hashPassword, verifyPassword } from "@/lib/password-hash";
import { validatePasswordStrength } from "@/lib/password-policy";

export class AuthService {
  private createRefreshToken() {
    return globalThis.crypto.randomUUID();
  }

  async signup(data: { email: string; name: string; passwordHash: string }) {
    const existingUser = await authRepository.findUserByEmail(data.email);
    if (existingUser) {
      throw new Error("User already exists");
    }

    const user = await authRepository.createUser({
      email: data.email,
      name: data.name,
      passwordHash: data.passwordHash,
    });

    const accessToken = await signAccessToken(user);
    const session = await this.createSession(user.id);

    return { user, accessToken, session };
  }

  async signin(email: string) {
    const user = await authRepository.findUserByEmail(email);
    if (!user) {
      throw new Error("Invalid email or password");
    }

    const accessToken = await signAccessToken(user);
    const session = await this.createSession(user.id);

    return { user, accessToken, session };
  }

  async createSession(userId: string) {
    const refreshToken = this.createRefreshToken();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

    // AUD-021: only the hash is persisted — a database read (leak, backup, insider
    // access, SQL injection elsewhere) no longer yields directly usable session tokens.
    // The raw token is still what's returned to the caller to set as the cookie value.
    await authRepository.createSession({
      userId,
      refreshToken: hashToken(refreshToken),
      expiresAt,
    });

    return { refreshToken, expiresAt };
  }

  async rotateSession(oldRefreshToken: string) {
    const session = await authRepository.findSessionByToken(hashToken(oldRefreshToken));

    if (!session) return null;
    if (new Date(session.expiresAt) < new Date()) {
      await authRepository.deleteSession(session.refreshToken);
      return null;
    }

    const refreshToken = this.createRefreshToken();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

    await authRepository.updateSession(session.id, {
      refreshToken: hashToken(refreshToken),
      expiresAt,
    });

    return { userId: session.userId, refreshToken, expiresAt };
  }

  async revokeSession(refreshToken: string) {
    await authRepository.deleteSession(hashToken(refreshToken));
  }

  async getUserById(id: string) {
    return authRepository.findUserById(id);
  }

  /**
   * AUD-026: this is the missing remediation path — previously there was no way for a
   * user to invalidate every session (e.g. after suspecting their account was
   * compromised) and no password-change flow to pair it with.
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    if (user.authProvider !== "password") {
      throw new Error("This account signs in with Google and has no password to change.");
    }
    if (!verifyPassword(currentPassword, user.passwordHash)) {
      throw new Error("Current password is incorrect.");
    }
    const strengthError = validatePasswordStrength(newPassword);
    if (strengthError) {
      throw new Error(strengthError);
    }

    await authRepository.updateUserPassword(userId, hashPassword(newPassword));
    // Force re-authentication everywhere, including any device an attacker may have
    // been using, then issue a fresh session for the device the user just changed the
    // password from so they aren't logged out by their own action.
    await authRepository.deleteUserSessions(userId);
    const accessToken = await signAccessToken(user);
    const session = await this.createSession(userId);
    return { accessToken, session };
  }

  /** AUD-026: `deleteUserSessions` existed but was never called from anywhere. */
  async logoutAllDevices(userId: string) {
    await authRepository.deleteUserSessions(userId);
  }
}

export const authService = new AuthService();
