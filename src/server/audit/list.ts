import { prisma } from "@/lib/prisma";

export async function listAuditLogs(input: { limit?: number; entityType?: string; actionContains?: string }) {
  const limit = Math.min(200, Math.max(1, input.limit ?? 80));
  return prisma.auditLog.findMany({
    where: {
      ...(input.entityType ? { entity_type: input.entityType } : {}),
      ...(input.actionContains ? { action: { contains: input.actionContains } } : {})
    },
    orderBy: { created_at: "desc" },
    take: limit
  });
}
