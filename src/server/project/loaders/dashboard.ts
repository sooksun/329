import { projectDashboardKey } from "@/server/cache/keys";
import { withCache } from "@/server/cache/with-cache";
import { getActiveProjectContext } from "@/server/project/active-project";
import { computeCommitteeStats, computeProjectSummary } from "@/server/project/compute";
import { listBudgetItems } from "@/server/project/queries/budget";
import { listCommittees } from "@/server/project/queries/committees";
import { listEvidence } from "@/server/project/queries/evidence";
import { listRisks } from "@/server/project/queries/risks";
import { listSnapshots, listReports } from "@/server/project/queries/snapshots";
import { listTasks } from "@/server/project/queries/tasks";

async function loadDashboardPageData(project: NonNullable<Awaited<ReturnType<typeof getActiveProjectContext>>>) {
  const [committees, tasks, evidence, budgetItems, risks, snapshots, reports] = await Promise.all([
    listCommittees(project.id),
    listTasks(project.id),
    listEvidence(project.id),
    listBudgetItems(project.id),
    listRisks(project.id),
    listSnapshots(project.id),
    listReports(project.id)
  ]);

  const summary = computeProjectSummary({ project, tasks, evidence, risks, budgetItems });
  const committeeStats = computeCommitteeStats({ committees, tasks, budgetItems, risks });

  return { project, committees, committeeStats, tasks, evidence, risks, snapshots, reports, summary };
}

export async function getDashboardPageData() {
  const project = await getActiveProjectContext();
  if (!project) return null;
  return withCache(projectDashboardKey(project.id), () => loadDashboardPageData(project));
}
