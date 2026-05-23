import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiSession } from "@/server/auth/session";
import { assertPermission } from "@/server/permissions/assert";
import { permissions } from "@/lib/rbac";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireApiSession();
  if ("error" in auth) return auth.error;
  const denied = assertPermission(auth.user, permissions.reportGenerate);
  if (denied) return denied;

  const { id } = await context.params;
  const job = await prisma.reportGenerationJob.findUnique({
    where: { id },
    include: { project: true }
  });
  if (!job) return NextResponse.json({ error: "ไม่พบงานสร้างรายงาน" }, { status: 404 });

  const report = job.report_id
    ? await prisma.powerPointReport.findUnique({ where: { id: job.report_id } })
    : null;

  return NextResponse.json({
    jobId: job.id,
    status: job.status,
    error: job.error,
    file_path: job.file_path,
    report,
    completed_at: job.completed_at
  });
}
