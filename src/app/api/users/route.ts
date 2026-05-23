import { NextResponse } from "next/server";
import { can, permissions } from "@/lib/rbac";
import { errors } from "@/lib/messages";
import { requireApiSession } from "@/server/auth/session";
import { createUserByAdmin, listUsersForAdmin } from "@/server/users/admin";

export async function GET() {
  const auth = await requireApiSession();
  if ("error" in auth) return auth.error;
  if (!can(auth.user.roles, permissions.userManage) && !can(auth.user.roles, permissions.admin)) {
    return NextResponse.json({ error: errors.forbidden }, { status: 403 });
  }
  const users = await listUsersForAdmin();
  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const auth = await requireApiSession();
  if ("error" in auth) return auth.error;
  if (!can(auth.user.roles, permissions.userManage) && !can(auth.user.roles, permissions.admin)) {
    return NextResponse.json({ error: errors.forbidden }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  try {
    const user = await createUserByAdmin({
      name: String(body.name ?? ""),
      username: String(body.username ?? ""),
      password: String(body.password ?? ""),
      roleName: body.role_name ? String(body.role_name) : undefined,
      committeeId: body.committee_id ? String(body.committee_id) : undefined,
      position: body.position ? String(body.position) : undefined,
      createdById: auth.user.id
    });
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : errors.dataInvalid },
      { status: 400 }
    );
  }
}
