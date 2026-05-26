import { NextResponse } from "next/server";
import { formatThaiDateTime } from "@/lib/format-date";
import { permissions } from "@/lib/rbac";
import { errors } from "@/lib/messages";
import { prisma } from "@/lib/prisma";
import { requireApiSession } from "@/server/auth/session";
import { assertPermission } from "@/server/permissions/assert";
import { invalidateProjectCache } from "@/server/cache/invalidate";
import { buildSnapshotPayload } from "@/server/project/loaders/snapshot-payload";

export async function POST() {
  const auth = await requireApiSession();
  if ("error" in auth) return auth.error;
  const denied = assertPermission(auth.user, permissions.snapshotManage);
  if (denied) return denied;

  const payload = await buildSnapshotPayload();
  if (!payload) return NextResponse.json({ error: errors.noActiveProject }, { status: 404 });

  const snapshot = await prisma.dashboardSnapshot.create({
    data: {
      project_id: payload.project.id,
      title: `Snapshot ${formatThaiDateTime(new Date())}`,
      data: JSON.stringify(payload.frozen),
      created_by: auth.user.id
    }
  });
  await prisma.auditLog.create({
    data: {
      user_id: auth.user.id,
      action: "Create dashboard snapshot",
      entity_type: "DashboardSnapshot",
      entity_id: snapshot.id,
      new_value: JSON.stringify(payload.frozen)
    }
  });
  await invalidateProjectCache(payload.project.id);
  return NextResponse.json(snapshot);
}
