import type { Priority, TaskStatus } from "@prisma/client";
import { errors } from "./messages";
import { clampProgress, riskLevel } from "./utils";

export type WeightedItem = { weight: number; verified_progress: number };

export function weightedProgress(items: WeightedItem[]) {
  const active = items.filter((item) => item.weight > 0);
  const totalWeight = active.reduce((sum, item) => sum + item.weight, 0);
  if (!totalWeight) return 0;
  return clampProgress(
    active.reduce((sum, item) => sum + item.weight * clampProgress(item.verified_progress), 0) / totalWeight
  );
}

export function evidenceProgress(required: number, approved: number) {
  if (required <= 0) return 100;
  return clampProgress((approved / required) * 100);
}

export function autoDelayStatus(status: TaskStatus, dueDate: Date, now = new Date()): TaskStatus {
  if (["DONE", "VERIFIED"].includes(status)) return status;
  return dueDate.getTime() < now.getTime() ? "DELAYED" : status;
}

export function validateSubtaskInput(input: {
  title: string;
  reported_progress: number;
  verified_progress: number;
}) {
  if (!input.title.trim()) throw new Error(errors.subtaskTitleRequired);
  if (input.reported_progress < 0 || input.reported_progress > 100) {
    throw new Error(errors.reportedProgressRange);
  }
  if (input.verified_progress < 0 || input.verified_progress > 100) {
    throw new Error(errors.verifiedProgressRange);
  }
  return true;
}

export function validateTaskInput(input: {
  owner_id?: string | null;
  priority: Priority;
  start_date: Date;
  due_date: Date;
  reported_progress: number;
  verified_progress: number;
  is_critical?: boolean;
}) {
  if (!input.owner_id) throw new Error(errors.taskOwnerRequired);
  if (input.start_date > input.due_date) throw new Error(errors.taskDateInvalid);
  if (input.is_critical && !input.due_date) throw new Error(errors.criticalTaskDueDate);
  if (input.reported_progress < 0 || input.reported_progress > 100) throw new Error(errors.reportedProgressRange);
  if (input.verified_progress < 0 || input.verified_progress > 100) throw new Error(errors.verifiedProgressRange);
  return true;
}

export type TaskDoneInput = {
  hasApprovedEvidence: boolean;
  hasReviewer: boolean;
  verified_progress: number;
};

export function canMarkDone(input: TaskDoneInput) {
  return (
    input.hasApprovedEvidence && input.hasReviewer && clampProgress(input.verified_progress) === 100
  );
}

/** รายการเงื่อนไขที่ยังไม่ครบก่อนปิดงาน DONE (ภารกิจหลัก) */
export function taskDoneBlockers(input: TaskDoneInput): string[] {
  const blockers: string[] = [];
  if (!input.hasApprovedEvidence) blockers.push("ต้องมีหลักฐานที่อนุมัติแล้วอย่างน้อย 1 รายการ");
  if (!input.hasReviewer) blockers.push("ต้องระบุผู้ตรวจสอบ (reviewer) ของภารกิจ");
  if (clampProgress(input.verified_progress) !== 100) {
    blockers.push("ความคืบหน้าที่ตรวจแล้วต้องครบ 100%");
  }
  return blockers;
}

export function validateBudget(input: { amount: number; project_id?: string; task_id?: string | null; plan_id?: string | null }) {
  if (input.amount < 0) throw new Error(errors.budgetAmountNegative);
  if (!input.project_id || (!input.task_id && !input.plan_id)) throw new Error(errors.budgetLinkRequired);
  return true;
}

export function detectBudgetOverrun(actual: number, approved: number) {
  return actual > approved;
}

export function computeRisk(likelihood: number, impact: number) {
  const score = likelihood * impact;
  return { score, level: riskLevel(score) };
}

export function hasDependencyLoop(edges: Array<{ task_id: string; depends_on_id: string }>, next: { task_id: string; depends_on_id: string }) {
  const graph = new Map<string, string[]>();
  for (const edge of [...edges, next]) {
    graph.set(edge.task_id, [...(graph.get(edge.task_id) ?? []), edge.depends_on_id]);
  }
  const seen = new Set<string>();
  function visit(node: string): boolean {
    if (node === next.task_id && seen.size > 0) return true;
    if (seen.has(node)) return false;
    seen.add(node);
    return (graph.get(node) ?? []).some(visit);
  }
  return visit(next.depends_on_id);
}
