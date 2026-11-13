import { NextResponse } from "next/server";
import { can, permissions } from "@/lib/rbac";
import { errors } from "@/lib/messages";
import { prisma } from "@/lib/prisma";
import { requireApiSession } from "@/server/auth/session";
import { getActiveProjectForUser } from "@/server/tenant/project-access";
import { updateUserByAdmin } from "@/server/users/admin";

function userIdFromUrl(request: Request) {
  return new URL(request.url).pathname.split("/").filter(Boolean).pop() ?? "";
}

export async function PATCH(request: Request) {
  const auth = await requireApiSession();
  if ("error" in auth) return auth.error;
  if (!can(auth.user.roles, permissions.userManage) && !can(auth.user.roles, permissions.admin)) {
    return NextResponse.json({ error: errors.forbidden }, { status: 403 });
  }

  const project = await getActiveProjectForUser(auth.user);
  const committeeScopeIds = project
    ? (
        await prisma.committee.findMany({
          where: { project_id: project.id, deleted_at: null },
          select: { id: true }
        })
      ).map((c) => c.id)
    : [];

  const body = await request.json().catch(() => ({}));
  try {
    const user = await updateUserByAdmin({
      userId: userIdFromUrl(request),
      name: String(body.name ?? ""),
      username: String(body.username ?? ""),
      password: body.password ? String(body.password) : undefined,
      roleName: body.role_name ? String(body.role_name) : undefined,
      committeeId: body.committee_id === undefined || body.committee_id === null ? undefined : String(body.committee_id),
      position: body.position ? String(body.position) : undefined,
      committeeScopeIds,
      updatedById: auth.user.id
    });
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : errors.dataInvalid },
      { status: 400 }
    );
  }
}
