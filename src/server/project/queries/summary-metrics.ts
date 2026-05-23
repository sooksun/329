import { prisma } from "@/lib/prisma";
import { weightedProgress } from "@/lib/rules";

/** Lightweight aggregates for shell navigation without loading full task graphs. */
export async function getSummaryMetrics(projectId: string) {
  const [project, taskProgress, delayedTasks, criticalRisks, evidencePending, totalTasks, budgetTotals] = await Promise.all([
    prisma.project.findUnique({ where: { id: projectId } }),
    prisma.task.findMany({
      where: { project_id: projectId, deleted_at: null },
      select: { weight: true, verified_progress: true, reported_progress: true }
    }),
    prisma.task.count({ where: { project_id: projectId, deleted_at: null, status: "DELAYED" } }),
    prisma.risk.count({
      where: { project_id: projectId, deleted_at: null, level: { in: ["Critical", "High"] } }
    }),
    prisma.evidence.count({ where: { project_id: projectId, deleted_at: null, status: "PENDING" } }),
    prisma.task.count({ where: { project_id: projectId, deleted_at: null } }),
    prisma.budgetItem.aggregate({
      where: { project_id: projectId, deleted_at: null },
      _sum: { planned_amount: true, actual_amount: true }
    })
  ]);

  if (!project) return null;

  const overall = weightedProgress(taskProgress);
  const reported = weightedProgress(
    taskProgress.map((task) => ({ weight: task.weight, verified_progress: task.reported_progress }))
  );
  const now = new Date();

  return {
    overall,
    reported,
    daysRemaining: Math.max(0, Math.ceil((project.event_date.getTime() - now.getTime()) / 86400000)),
    totalTasks,
    delayedTasks,
    criticalRisks,
    evidencePending,
    budget: {
      planned: project.planned_budget || budgetTotals._sum.planned_amount || 0,
      actual: project.actual_budget || budgetTotals._sum.actual_amount || 0
    }
  };
}
