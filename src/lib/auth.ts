// src/lib/auth.ts
import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import { db } from "./db";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = (user as any).role;
      }
      return session;
    },
    async signIn({ user }) {
      // Tự động set ADMIN cho email đặc biệt
      if (user.email === process.env.ADMIN_EMAIL) {
        await db.user.update({
          where: { email: user.email },
          data: { role: "ADMIN" },
        }).catch(() => {}); // ignore nếu user chưa tồn tại
      }
      return true;
    },
  },
  pages: { signIn: "/login", error: "/login" },
  session: { strategy: "database" },
};

declare module "next-auth" {
  interface Session {
    user: { id: string; name?: string | null; email?: string | null; image?: string | null; role: string };
  }
}
