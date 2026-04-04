import { db } from "@/lib/db";
import { usersTable, sessionsTable } from "@/db";
import { eq } from "drizzle-orm";
import { BaseRepository } from "@/repositories/base.repository";

export class AuthRepository extends BaseRepository<any> {
  async findUserByEmail(email: string) {
    const results = await db.select().from(usersTable).where(eq(usersTable.email, email)).execute();
    return results[0];
  }

  async findUserById(id: string) {
    const results = await db.select().from(usersTable).where(eq(usersTable.id, id)).execute();
    return results[0];
  }

  async createUser(data: typeof usersTable.$inferInsert) {
    const [user] = await db.insert(usersTable).values(data).returning().execute();
    return user;
  }

  async createSession(data: typeof sessionsTable.$inferInsert) {
    const [session] = await db.insert(sessionsTable).values(data).returning().execute();
    return session;
  }

  async findSessionByToken(token: string) {
    const results = await db
      .select()
      .from(sessionsTable)
      .where(eq(sessionsTable.refreshToken, token))
      .execute();
    return results[0];
  }

  async deleteSession(token: string) {
    await db.delete(sessionsTable).where(eq(sessionsTable.refreshToken, token)).execute();
  }

  async deleteUserSessions(userId: string) {
    await db.delete(sessionsTable).where(eq(sessionsTable.userId, userId)).execute();
  }
}

export const authRepository = new AuthRepository();
