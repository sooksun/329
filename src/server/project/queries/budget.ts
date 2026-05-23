import { prisma } from "@/lib/prisma";

export async function listBudgetItems(projectId: string) {
  return prisma.budgetItem.findMany({
    where: { project_id: projectId, deleted_at: null },
    include: {
      committee: true,
      task: true,
      transactions: { orderBy: { created_at: "desc" } }
    },
    orderBy: { created_at: "desc" }
  });
}
