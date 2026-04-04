import { authRepository } from "./auth.repository";
import {
  hashPassword,
  verifyPassword,
  createSession,
  rotateSession,
  revokeSession,
} from "@/lib/auth";
import { signAccessToken } from "@/lib/jwt";

export class AuthService {
  async signup(data: { email: string; password: string; name: string }) {
    const existingUser = await authRepository.findUserByEmail(data.email);
    if (existingUser) {
      throw new Error("User already exists");
    }

    const passwordHash = hashPassword(data.password);
    const user = await authRepository.createUser({
      email: data.email,
      name: data.name,
      passwordHash,
    });

    const accessToken = await signAccessToken(user);
    const session = await createSession(user.id);

    return { user, accessToken, session };
  }

  async signin(data: { email: string; password: string }) {
    const user = await authRepository.findUserByEmail(data.email);
    if (!user) {
      throw new Error("Invalid email or password");
    }

    const isPasswordValid = verifyPassword(data.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

    const accessToken = await signAccessToken(user);
    const session = await createSession(user.id);

    return { user, accessToken, session };
  }

  async refresh(refreshToken: string) {
    const session = await rotateSession(refreshToken);
    if (!session) {
      throw new Error("Invalid or expired refresh token");
    }

    const user = await authRepository.findUserById(session.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const accessToken = await signAccessToken(user);
    return { user, accessToken, session };
  }

  async logout(refreshToken: string) {
    await revokeSession(refreshToken);
  }
}

export const authService = new AuthService();
