import type { BudgetItem, Committee, Evidence, Risk, Task } from "@prisma/client";
import { autoDelayStatus, weightedProgress } from "@/lib/rules";

type TaskWithRelations = Task & {
  evidence: Evidence[];
  committee: Committee;
  owner?: { name: string } | null;
};

export function computeProjectSummary(input: {
  project: { event_date: Date; planned_budget: number; actual_budget: number };
  tasks: TaskWithRelations[];
  evidence: Evidence[];
  risks: Risk[];
  budgetItems: BudgetItem[];
}) {
  const { project, tasks, evidence, risks, budgetItems } = input;
  const overall = weightedProgress(tasks);
  const reported = weightedProgress(tasks.map((task) => ({ weight: task.weight, verified_progress: task.reported_progress })));
  const now = new Date();
  const next = new Date(now.getTime() + 7 * 86400000);

  return {
    overall,
    reported,
    daysRemaining: Math.max(0, Math.ceil((project.event_date.getTime() - now.getTime()) / 86400000)),
    totalTasks: tasks.length,
    completedTasks: tasks.filter((task) => ["DONE", "VERIFIED"].includes(task.status)).length,
    delayedTasks: tasks.filter((task) => task.status === "DELAYED").length,
    criticalRisks: risks.filter((risk) => ["Critical", "High"].includes(risk.level)).length,
    evidencePending: evidence.filter((item) => item.status === "PENDING").length,
    evidenceCoverage: Math.round((evidence.filter((item) => item.status === "APPROVED").length / Math.max(1, evidence.length)) * 100),
    next7DaysTasks: tasks.filter((task) => task.due_date >= now && task.due_date <= next).slice(0, 8),
    budget: {
      planned: project.planned_budget || budgetItems.reduce((sum, item) => sum + item.planned_amount, 0),
      requested: budgetItems.reduce((sum, item) => sum + item.requested_amount, 0),
      approved: budgetItems.reduce((sum, item) => sum + item.approved_amount, 0),
      committed: budgetItems.reduce((sum, item) => sum + item.committed_amount, 0),
      actual: project.actual_budget || budgetItems.reduce((sum, item) => sum + item.actual_amount, 0)
    }
  };
}

export function computeCommitteeStats(input: {
  committees: Committee[];
  tasks: TaskWithRelations[];
  budgetItems: BudgetItem[];
  risks: Risk[];
}) {
  const { committees, tasks, budgetItems, risks } = input;
  return committees.map((committee) => {
    const scoped = tasks.filter((task) => task.committee_id === committee.id);
    const scopedBudget = budgetItems.filter((item) => item.committee_id === committee.id);
    const scopedRisks = risks.filter((risk) => risk.committee_id === committee.id);
    return {
      ...committee,
      progress: weightedProgress(scoped),
      totalTasks: scoped.length,
      completedTasks: scoped.filter((task) => ["DONE", "VERIFIED"].includes(task.status)).length,
      delayedTasks: scoped.filter((task) => task.status === "DELAYED" || autoDelayStatus(task.status, task.due_date) === "DELAYED").length,
      missingEvidence: scoped.filter((task) => task.evidence.filter((item) => item.status === "APPROVED").length === 0).length,
      budgetUsed: scopedBudget.reduce((sum, item) => sum + item.actual_amount, 0),
      budgetPlanned: scopedBudget.reduce((sum, item) => sum + item.planned_amount, 0),
      riskLevel: scopedRisks[0]?.level ?? "Low"
    };
  });
}
