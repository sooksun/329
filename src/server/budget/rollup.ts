import { prisma } from "@/lib/prisma";

/** รวมยอดจาก BudgetItem ขึ้น Committee และ Project */
export async function rollupBudgetTotals(projectId: string) {
  const items = await prisma.budgetItem.findMany({
    where: { project_id: projectId, deleted_at: null },
    select: { committee_id: true, planned_amount: true, actual_amount: true }
  });

  const projectPlanned = items.reduce((sum, item) => sum + item.planned_amount, 0);
  const projectActual = items.reduce((sum, item) => sum + item.actual_amount, 0);

  await prisma.project.update({
    where: { id: projectId },
    data: { planned_budget: projectPlanned, actual_budget: projectActual }
  });

  const committees = await prisma.committee.findMany({
    where: { project_id: projectId, deleted_at: null },
    select: { id: true }
  });

  for (const committee of committees) {
    const scoped = items.filter((item) => item.committee_id === committee.id);
    await prisma.committee.update({
      where: { id: committee.id },
      data: {
        planned_budget: scoped.reduce((sum, item) => sum + item.planned_amount, 0),
        actual_budget: scoped.reduce((sum, item) => sum + item.actual_amount, 0)
      }
    });
  }
}
