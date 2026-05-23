import { getActiveProjectContext } from "@/server/project/active-project";
import { computeCommitteeStats, computeProjectSummary } from "@/server/project/compute";
import { listBudgetItems } from "@/server/project/queries/budget";
import { listCommittees } from "@/server/project/queries/committees";
import { listEvidence } from "@/server/project/queries/evidence";
import { listRisks } from "@/server/project/queries/risks";
import { listMeetings } from "@/server/project/queries/meetings";
import { listTasks } from "@/server/project/queries/tasks";

export async function buildSnapshotPayload() {
  const project = await getActiveProjectContext();
  if (!project) return null;

  const [committees, tasks, evidence, budgetItems, risks, meetings] = await Promise.all([
    listCommittees(project.id),
    listTasks(project.id),
    listEvidence(project.id),
    listBudgetItems(project.id),
    listRisks(project.id),
    listMeetings(project.id)
  ]);

  const summary = computeProjectSummary({ project, tasks, evidence, risks, budgetItems });
  const committeeStats = computeCommitteeStats({ committees, tasks, budgetItems, risks });

  return {
    project,
    summary,
    committeeStats,
    tasks,
    risks,
    meetings,
    frozen: {
      projectSummary: project,
      overallProgress: summary.overall,
      committeeProgress: committeeStats,
      budgetSummary: summary.budget,
      delayedTasks: tasks.filter((task) => task.status === "DELAYED").map((task) => task.title),
      criticalRisks: risks.filter((risk) => ["Critical", "High"].includes(risk.level)),
      evidenceSummary: summary.evidenceCoverage,
      next7DaysTasks: summary.next7DaysTasks.map((task) => task.title),
      decisionsNeeded: meetings
        .flatMap((meeting) => meeting.actionItems)
        .filter((item) => item.status !== "DONE")
        .map((item) => item.decision_title)
    }
  };
}
