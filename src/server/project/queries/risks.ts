import { prisma } from "@/lib/prisma";

export async function listRisks(projectId: string) {
  return prisma.risk.findMany({
    where: { project_id: projectId, deleted_at: null },
    include: { committee: true, task: true },
    orderBy: { score: "desc" }
  });
}
