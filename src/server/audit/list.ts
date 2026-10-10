import { prisma } from "@/lib/prisma";

/**
 * บันทึกของโปรเจกต์ที่ใช้งานอยู่เท่านั้น — includeGlobal (Super Admin) เห็นรายการระดับระบบ
 * ที่ไม่ผูกโปรเจกต์ด้วย (เช่น สร้างผู้ใช้ และบันทึกเก่าก่อนมีคอลัมน์ project_id)
 */
export async function listAuditLogs(input: {
  projectId: string;
  includeGlobal?: boolean;
  limit?: number;
  entityType?: string;
  actionContains?: string;
}) {
  const limit = Math.min(200, Math.max(1, Number.isFinite(input.limit) ? input.limit! : 80));
  return prisma.auditLog.findMany({
    where: {
      OR: [{ project_id: input.projectId }, ...(input.includeGlobal ? [{ project_id: null }] : [])],
      ...(input.entityType ? { entity_type: input.entityType } : {}),
      ...(input.actionContains ? { action: { contains: input.actionContains } } : {})
    },
    orderBy: { created_at: "desc" },
    take: limit
  });
}
