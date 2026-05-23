import { getServerSession, type Session } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { errors } from "@/lib/messages";

export type SessionUser = {
  id: string;
  roles: string[];
  name?: string | null;
  email?: string | null;
};

export function getSessionUser(session: Session | null): SessionUser | null {
  const raw = session?.user as { id?: string; roles?: string[]; name?: string | null; email?: string | null } | undefined;
  if (!raw?.id) return null;
  return {
    id: raw.id,
    roles: raw.roles ?? [],
    name: raw.name,
    email: raw.email
  };
}

export async function getOptionalSessionUser() {
  const session = await getServerSession(authOptions);
  return getSessionUser(session);
}

export async function requireSessionUser() {
  const user = await getOptionalSessionUser();
  if (!user) return null;
  return user;
}

export async function requireApiSession() {
  const user = await requireSessionUser();
  if (!user) {
    return { error: NextResponse.json({ error: errors.loginRequired }, { status: 401 }) };
  }
  return { user };
}
