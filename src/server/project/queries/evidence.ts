import { prisma } from "@/lib/prisma";

export async function listEvidence(projectId: string) {
  return prisma.evidence.findMany({
    where: { project_id: projectId, deleted_at: null },
    include: { committee: true, task: true, fileAsset: true },
    orderBy: { created_at: "desc" }
  });
}

export async function countEvidenceByStatus(projectId: string) {
  const rows = await prisma.evidence.groupBy({
    by: ["status"],
    where: { project_id: projectId, deleted_at: null },
    _count: { _all: true }
  });
  return rows.reduce(
    (acc, row) => {
      acc[row.status] = row._count._all;
      return acc;
    },
    {} as Record<string, number>
  );
}
