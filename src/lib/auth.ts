import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import { isLoginAllowed, recordLoginFailure, resetLoginAttempts } from "@/server/auth/login-rate-limit";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials.password) return null;
        // กัน brute force: ล็อกชั่วคราวเมื่อพยายามผิดเกินกำหนด
        if (!isLoginAllowed(credentials.username)) return null;
        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
          include: { roles: { include: { role: true } } }
        });
        if (!user || user.deleted_at) {
          recordLoginFailure(credentials.username);
          return null;
        }
        const ok = await bcrypt.compare(credentials.password, user.password_hash);
        if (!ok) {
          recordLoginFailure(credentials.username);
          return null;
        }
        resetLoginAttempts(credentials.username);
        return { id: user.id, name: user.name, email: user.email, roles: user.roles.map((r) => r.role.name) } as any;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.roles = (user as any).roles ?? [];
      }
      return token;
    },
    async session({ session, token }) {
      (session.user as any).id = token.id;
      (session.user as any).roles = token.roles ?? [];
      return session;
    }
  }
};
