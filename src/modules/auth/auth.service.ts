import { authRepository } from "./auth.repository";
import { signAccessToken } from "@/lib/jwt";

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

    await authRepository.createSession({ userId, refreshToken, expiresAt });

    return { refreshToken, expiresAt };
  }

  async rotateSession(oldRefreshToken: string) {
    const session = await authRepository.findSessionByToken(oldRefreshToken);

    if (!session) return null;
    if (new Date(session.expiresAt) < new Date()) {
      await authRepository.deleteSession(session.refreshToken);
      return null;
    }

    const refreshToken = this.createRefreshToken();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

    await authRepository.updateSession(session.id, { refreshToken, expiresAt });

    return { userId: session.userId, refreshToken, expiresAt };
  }

  async revokeSession(refreshToken: string) {
    await authRepository.deleteSession(refreshToken);
  }

  async getUserById(id: string) {
    return authRepository.findUserById(id);
  }
}

export const authService = new AuthService();
