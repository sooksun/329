import type { RiskStatus } from "@prisma/client";
import { errors } from "@/lib/messages";
import { computeRisk } from "@/lib/rules";
import { prisma } from "@/lib/prisma";

const riskStatuses = new Set<RiskStatus>(["OPEN", "MITIGATING", "WATCHING", "CLOSED"]);

export async function nextRiskCode(projectId: string) {
  const count = await prisma.risk.count({ where: { project_id: projectId } });
  return `RK-${String(count + 1).padStart(3, "0")}`;
}

export async function createRisk(input: {
  projectId: string;
  committeeId: string;
  taskId?: string | null;
  title: string;
  likelihood: number;
  impact: number;
  mitigation_plan: string;
  contingency_plan: string;
  owner_name: string;
  owner_initials: string;
  status?: RiskStatus;
  createdById: string;
}) {
  const title = input.title.trim();
  if (!title) throw new Error(errors.riskTitleRequired);
  const likelihood = Math.max(1, Math.min(5, Math.round(input.likelihood)));
  const impact = Math.max(1, Math.min(5, Math.round(input.impact)));
  const { score, level } = computeRisk(likelihood, impact);
  const status = input.status && riskStatuses.has(input.status) ? input.status : "OPEN";

  return prisma.risk.create({
    data: {
      project_id: input.projectId,
      committee_id: input.committeeId,
      task_id: input.taskId || null,
      code: await nextRiskCode(input.projectId),
      title,
      likelihood,
      impact,
      score,
      level,
      mitigation_plan: input.mitigation_plan.trim(),
      contingency_plan: input.contingency_plan.trim(),
      owner_name: input.owner_name.trim(),
      owner_initials: input.owner_initials.trim(),
      status,
      created_by: input.createdById,
      updated_by: input.createdById
    },
    include: { committee: true, task: { select: { id: true, code: true, title: true } } }
  });
}

export async function updateRisk(
  riskId: string,
  projectId: string,
  data: {
    title?: string;
    committee_id?: string;
    task_id?: string | null;
    likelihood?: number;
    impact?: number;
    mitigation_plan?: string;
    contingency_plan?: string;
    owner_name?: string;
    owner_initials?: string;
    status?: RiskStatus;
  },
  updatedById: string
) {
  const existing = await prisma.risk.findFirst({ where: { id: riskId, project_id: projectId, deleted_at: null } });
  if (!existing) throw new Error(errors.riskNotFound);

  const likelihood = data.likelihood !== undefined ? Math.max(1, Math.min(5, Math.round(data.likelihood))) : existing.likelihood;
  const impact = data.impact !== undefined ? Math.max(1, Math.min(5, Math.round(data.impact))) : existing.impact;
  const { score, level } = computeRisk(likelihood, impact);

  return prisma.risk.update({
    where: { id: riskId },
    data: {
      title: data.title !== undefined ? data.title.trim() : existing.title,
      committee_id: data.committee_id ?? existing.committee_id,
      task_id: data.task_id !== undefined ? data.task_id : existing.task_id,
      likelihood,
      impact,
      score,
      level,
      mitigation_plan: data.mitigation_plan !== undefined ? data.mitigation_plan.trim() : existing.mitigation_plan,
      contingency_plan: data.contingency_plan !== undefined ? data.contingency_plan.trim() : existing.contingency_plan,
      owner_name: data.owner_name !== undefined ? data.owner_name.trim() : existing.owner_name,
      owner_initials: data.owner_initials !== undefined ? data.owner_initials.trim() : existing.owner_initials,
      status: data.status && riskStatuses.has(data.status) ? data.status : existing.status,
      updated_by: updatedById
    },
    include: { committee: true, task: { select: { id: true, code: true, title: true } } }
  });
}

export async function softDeleteRisk(riskId: string, projectId: string, updatedById: string) {
  const existing = await prisma.risk.findFirst({ where: { id: riskId, project_id: projectId, deleted_at: null } });
  if (!existing) throw new Error(errors.riskNotFound);
  return prisma.risk.update({
    where: { id: riskId },
    data: { deleted_at: new Date(), updated_by: updatedById }
  });
}
