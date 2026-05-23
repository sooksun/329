import { prisma } from "@/lib/prisma";

export async function listCommittees(projectId: string) {
  return prisma.committee.findMany({
    where: { project_id: projectId, deleted_at: null },
    orderBy: { sort_order: "asc" }
  });
}
