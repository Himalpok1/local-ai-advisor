import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { getDb } from "@/lib/db";
import { accounts, users } from "@/lib/db/schema";

// Lazy config: the DB pool is only created when an auth request actually runs.
export const { handlers, auth, signIn, signOut } = NextAuth(() => ({
  adapter: DrizzleAdapter(getDb(), { usersTable: users, accountsTable: accounts }),
  providers: [Google],
  // Self-hosted. Hostinger's proxy hands Next a Host of 0.0.0.0:3000, so production also sets AUTH_URL.
  trustHost: true,
  // Signed JWT cookie: reading the session never hits MySQL; the DB is only used on sign-in.
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (typeof token.id === "string") session.user.id = token.id;
      return session;
    },
  },
}));
