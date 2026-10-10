import { prisma } from "@/lib/prisma";

/** ไม่ดึง `data` (LongText — payload ทั้งโปรเจกต์ที่ freeze ไว้) — หน้ารายการใช้แค่ id/ชื่อ/เวลา */
const snapshotSummarySelect = {
  id: true,
  project_id: true,
  title: true,
  created_by: true,
  created_at: true
} as const;

export async function listSnapshots(projectId: string) {
  return prisma.dashboardSnapshot.findMany({
    where: { project_id: projectId },
    select: snapshotSummarySelect,
    orderBy: { created_at: "desc" }
  });
}

export async function listReports(projectId: string) {
  return prisma.powerPointReport.findMany({
    where: { project_id: projectId },
    include: { snapshot: { select: snapshotSummarySelect } },
    orderBy: { created_at: "desc" }
  });
}
