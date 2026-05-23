import { NextResponse } from "next/server";
import { permissions } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { requireApiSession } from "@/server/auth/session";
import { assertPermission } from "@/server/permissions/assert";
import { reportService } from "@/server/services/report-service";
import { getActiveProjectForUser, userCanAccessProject } from "@/server/tenant/project-access";

export async function POST(request: Request) {
  const auth = await requireApiSession();
  if ("error" in auth) return auth.error;
  const denied = assertPermission(auth.user, permissions.reportGenerate);
  if (denied) return denied;

  const active = await getActiveProjectForUser(auth.user);
  if (!active) return NextResponse.json({ error: "ไม่พบโปรเจกต์ที่ใช้งาน" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const snapshot = await prisma.dashboardSnapshot.findFirst({
    where: body.snapshot_id
      ? { id: body.snapshot_id, project_id: active.id }
      : { project_id: active.id },
    orderBy: { created_at: "desc" }
  });
  if (!snapshot) return NextResponse.json({ error: "ต้องมี Snapshot ก่อนสร้างรายงาน" }, { status: 400 });

  if (!(await userCanAccessProject(auth.user, snapshot.project_id))) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึงโปรเจกต์นี้" }, { status: 403 });
  }

  if (reportService.isQueueEnabled()) {
    const { record, queued } = await reportService.enqueue(snapshot.id, auth.user.id, snapshot.project_id);
    if (queued) {
      return NextResponse.json(
        { jobId: record.id, status: record.status, queued: true, message: "กำลังสร้างรายงานในคิว" },
        { status: 202 }
      );
    }
  }

  const { report } = await reportService.generateInline(snapshot.id, auth.user.id);
  return NextResponse.json({ status: "COMPLETED", queued: false, report });
}
