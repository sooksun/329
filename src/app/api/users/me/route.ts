import { NextResponse } from "next/server";
import { errors } from "@/lib/messages";
import { requireApiSession } from "@/server/auth/session";
import { prisma } from "@/lib/prisma";
import { updateOwnProfile } from "@/server/users/profile";

export async function GET() {
  const auth = await requireApiSession();
  if ("error" in auth) return auth.error;

  const user = await prisma.user.findFirst({
    where: { id: auth.user.id, deleted_at: null },
    select: { id: true, name: true, username: true, email: true, created_at: true, updated_at: true }
  });
  if (!user) {
    return NextResponse.json({ error: "ไม่พบบัญชีผู้ใช้" }, { status: 404 });
  }
  return NextResponse.json(user);
}

export async function PATCH(request: Request) {
  const auth = await requireApiSession();
  if ("error" in auth) return auth.error;

  const body = await request.json().catch(() => ({}));
  try {
    const updated = await updateOwnProfile(auth.user.id, {
      name: String(body.name ?? ""),
      username: String(body.username ?? ""),
      password: body.password ? String(body.password) : undefined,
      currentPassword: body.current_password ? String(body.current_password) : undefined
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : errors.dataInvalid },
      { status: 400 }
    );
  }
}
