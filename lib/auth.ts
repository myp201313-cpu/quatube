import { Prisma } from "@prisma/client";
import type { NextAuthConfig } from "next-auth";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { compare } from "bcryptjs";

// Keep this configuration Edge-compatible: do not import Prisma or Node-only modules here.
export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Google({ clientId: process.env.GOOGLE_CLIENT_ID ?? "", clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "" }),
    Credentials({
      credentials: { email: { label: "Email", type: "email" }, password: { label: "Password", type: "password" } },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;
        const { default: prisma } = await import("@/lib/prisma");
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash || !(await compare(password, user.passwordHash))) return null;
        return { id: user.id, email: user.email, name: user.name ?? email.split("@")[0], image: user.image };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) { if (user) token.id = user.id; return token; },
    async session({ session, token }) { if (session.user) session.user.id = token.sub ?? token.id ?? ""; return session; },
    async authorized({ auth, request }) {
      if (request.nextUrl.pathname.startsWith("/admin")) return Boolean(auth?.user);
      if (["/dashboard", "/watch", "/account"].some((path) => request.nextUrl.pathname.startsWith(path))) return Boolean(auth?.user);
      return true;
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
export const { GET, POST } = handlers;
