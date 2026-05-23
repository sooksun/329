import { NextResponse } from "next/server";
import { can, permissions } from "@/lib/rbac";
import { errors } from "@/lib/messages";
import { prisma } from "@/lib/prisma";
import { listAuditLogs } from "@/server/audit/list";
import { requireApiSession } from "@/server/auth/session";
import { forbiddenResponse } from "@/server/permissions/assert";

export async function GET(request: Request) {
  const auth = await requireApiSession();
  if ("error" in auth) return auth.error;
  if (!can(auth.user.roles, permissions.auditView) && !can(auth.user.roles, permissions.admin)) {
    return forbiddenResponse(errors.auditForbidden);
  }

  const url = new URL(request.url);
  const entityType = url.searchParams.get("entity_type")?.trim() || undefined;
  const limit = Number(url.searchParams.get("limit") ?? 80);

  const logs = await listAuditLogs({ limit, entityType });
  const userIds = [...new Set(logs.map((l) => l.user_id).filter(Boolean) as string[])];
  const users = userIds.length
    ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, username: true } })
    : [];
  const userMap = new Map(users.map((u) => [u.id, u]));

  return NextResponse.json({
    items: logs.map((log) => ({
      id: log.id,
      action: log.action,
      entity_type: log.entity_type,
      entity_id: log.entity_id,
      created_at: log.created_at,
      user: log.user_id ? userMap.get(log.user_id) ?? { id: log.user_id, name: "ผู้ใช้", username: "" } : null
    }))
  });
}
