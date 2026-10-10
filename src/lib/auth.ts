import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import {
  clientIpFromHeaders,
  isLoginAllowed,
  recordLoginFailure,
  resetLoginAttempts
} from "@/server/auth/login-rate-limit";

/** ตรวจ role/สถานะผู้ใช้จาก DB ซ้ำทุก 5 นาที — เปลี่ยน role หรือลบผู้ใช้แล้วมีผลโดยไม่ต้องรอ token หมดอายุ */
const ROLE_REFRESH_MS = 5 * 60 * 1000;

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.username || !credentials.password) return null;
        // กัน brute force: ล็อกชั่วคราวเมื่อพยายามผิดเกินกำหนด (ต่อ username+IP และต่อ IP)
        const ip = clientIpFromHeaders(req?.headers);
        if (!isLoginAllowed(credentials.username, ip)) return null;
        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
          include: { roles: { include: { role: true } } }
        });
        if (!user || user.deleted_at) {
          recordLoginFailure(credentials.username, ip);
          return null;
        }
        const ok = await bcrypt.compare(credentials.password, user.password_hash);
        if (!ok) {
          recordLoginFailure(credentials.username, ip);
          return null;
        }
        resetLoginAttempts(credentials.username, ip);
        return { id: user.id, name: user.name, email: user.email, roles: user.roles.map((r) => r.role.name) } as any;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.roles = (user as any).roles ?? [];
        token.rolesCheckedAt = Date.now();
        return token;
      }
      if (token.id && !token.revoked && Date.now() - Number(token.rolesCheckedAt ?? 0) > ROLE_REFRESH_MS) {
        const fresh = await prisma.user.findUnique({
          where: { id: String(token.id) },
          select: { deleted_at: true, roles: { select: { role: { select: { name: true } } } } }
        });
        if (!fresh || fresh.deleted_at) {
          token.revoked = true;
          token.roles = [];
        } else {
          token.roles = fresh.roles.map((r) => r.role.name);
        }
        token.rolesCheckedAt = Date.now();
      }
      return token;
    },
    async session({ session, token }) {
      // ผู้ใช้ถูกลบ/ปิดใช้งาน → session ไม่มี id → requireApiSession ตอบ 401
      (session.user as any).id = token.revoked ? undefined : token.id;
      (session.user as any).roles = token.roles ?? [];
      return session;
    }
  }
};
