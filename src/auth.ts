import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";

const hasDb = !!db;

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: hasDb ? DrizzleAdapter(db!) : undefined,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  session: { strategy: hasDb ? "database" : "jwt" },
  cookies: {
    sessionToken: {
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  callbacks: {
    signIn({ profile }) {
      const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN?.trim();
      if (!allowedDomain) return true;
      const email = profile?.email;
      if (!email) return false;
      return email.toLowerCase().endsWith(`@${allowedDomain.toLowerCase()}`);
    },
    jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    session({ session, user, token }) {
      if (session.user) {
        session.user.id = user?.id ?? token?.sub ?? "";
      }
      return session;
    },
  },
});
