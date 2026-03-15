import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/src/index";
import { usersTable } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
    session: { strategy: "jwt" },
    providers: [
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;
                const [user] = await db
                    .select()
                    .from(usersTable)
                    .where(eq(usersTable.email, credentials.email as string));
                if (!user) return null;
                const passwordMatch = await bcrypt.compare(
                    credentials.password as string,
                    user.passwordHash
                );
                if (!passwordMatch) return null;
                return { id: String(user.id), name: user.name, email: user.email };
            },
        }),
    ],
    callbacks: {
        jwt({ token, user }) {
            if (user) token.id = user.id;
            return token;
        },
        session({ session, token }) {
            if (token?.id) session.user.id = token.id as string;
            return session;
        },
    },
});
