import { getActiveProjectContext } from "@/server/project/active-project";
import { computeCommitteeStats, computeProjectSummary } from "@/server/project/compute";
import { listBudgetItems } from "@/server/project/queries/budget";
import { listCommittees } from "@/server/project/queries/committees";
import { listEvidence } from "@/server/project/queries/evidence";
import { listRisks } from "@/server/project/queries/risks";
import { listTasks } from "@/server/project/queries/tasks";

export async function getCommitteesPageData() {
  const project = await getActiveProjectContext();
  if (!project) return null;

  const [committees, tasks, evidence, budgetItems, risks] = await Promise.all([
    listCommittees(project.id),
    listTasks(project.id),
    listEvidence(project.id),
    listBudgetItems(project.id),
    listRisks(project.id)
  ]);

  const summary = computeProjectSummary({ project, tasks, evidence, risks, budgetItems });
  const committeeStats = computeCommitteeStats({ committees, tasks, budgetItems, risks });

  return { project, committees, committeeStats, summary };
}
