import type { NextAuthConfig } from "next-auth";

// Edge-safe config (no Prisma/bcrypt here) — consumed by middleware and by
// the full auth.ts (which adds the Credentials provider).
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [],
  callbacks: {
    authorized({ auth }) {
      // Only authentication is checked here; role-based routing between
      // /dashboard and /master is handled by each area's own layout so a
      // logged-in user with the wrong role is redirected to their own area
      // instead of being bounced back to the login page.
      return !!auth?.user;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.status = user.status;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "MASTER" | "USER";
        session.user.status = token.status as "ACTIVE" | "INACTIVE";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
