import { getActiveProjectContext } from "@/server/project/active-project";
import { listCommittees } from "@/server/project/queries/committees";
import { listRisks } from "@/server/project/queries/risks";
import { listTasksForEvidenceForm } from "@/server/project/queries/tasks";
import { getSummaryMetrics } from "@/server/project/queries/summary-metrics";

export async function getRisksPageData() {
  const project = await getActiveProjectContext();
  if (!project) return null;

  const [risks, metrics, committees, tasks] = await Promise.all([
    listRisks(project.id),
    getSummaryMetrics(project.id),
    listCommittees(project.id),
    listTasksForEvidenceForm(project.id)
  ]);
  if (!metrics) return null;

  return {
    project: { id: project.id },
    risks,
    committees,
    tasks,
    summary: { criticalRisks: metrics.criticalRisks }
  };
}
