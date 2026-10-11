import { getActiveProjectContext } from "@/server/project/active-project";
import { computeCommitteeStats, computeProjectSummary } from "@/server/project/compute";
import { listBudgetItems } from "@/server/project/queries/budget";
import { listCommittees } from "@/server/project/queries/committees";
import { listEvidence } from "@/server/project/queries/evidence";
import { listRisks } from "@/server/project/queries/risks";
import { listMeetings } from "@/server/project/queries/meetings";
import { listTaskSummaries } from "@/server/project/queries/tasks";
import { buildRiskMatrix, type SnapshotData } from "@/server/reports/snapshot-data";

const TIMELINE_ITEMS = 40;

export async function buildSnapshotPayload() {
  const project = await getActiveProjectContext();
  if (!project) return null;

  // snapshot ใช้แค่ตัวเลขสรุป — ใช้ query แบบเบา (ไม่ดึง subtasks/comments/fileAsset)
  const [committees, tasks, evidence, budgetItems, risks, meetings] = await Promise.all([
    listCommittees(project.id),
    listTaskSummaries(project.id),
    listEvidence(project.id),
    listBudgetItems(project.id),
    listRisks(project.id),
    listMeetings(project.id)
  ]);

  const summary = computeProjectSummary({ project, tasks, evidence, risks, budgetItems });
  const committeeStats = computeCommitteeStats({ committees, tasks, budgetItems, risks });

  const frozen: SnapshotData = {
    projectSummary: {
      name: project.name,
      edition: project.edition,
      event_date: project.event_date.toISOString(),
      event_end_date: project.event_end_date?.toISOString() ?? null
    },
    overallProgress: summary.overall,
    metrics: {
      reported: summary.reported,
      totalTasks: summary.totalTasks,
      completedTasks: summary.completedTasks,
      delayedTasks: summary.delayedTasks,
      criticalRisks: summary.criticalRisks,
      evidencePending: summary.evidencePending,
      daysRemaining: summary.daysRemaining
    },
    committeeProgress: committeeStats.map((committee) => ({
      name: committee.name,
      progress: committee.progress,
      totalTasks: committee.totalTasks,
      completedTasks: committee.completedTasks,
      delayedTasks: committee.delayedTasks,
      budgetPlanned: committee.budgetPlanned,
      budgetUsed: committee.budgetUsed
    })),
    budgetSummary: summary.budget,
    delayedTasks: tasks.filter((task) => task.status === "DELAYED").map((task) => `${task.code} ${task.title}`),
    criticalRisks: risks
      .filter((risk) => ["Critical", "High"].includes(risk.level))
      .map((risk) => ({
        code: risk.code,
        title: risk.title,
        likelihood: risk.likelihood,
        impact: risk.impact,
        score: risk.score,
        level: risk.level,
        committee: { name: risk.committee.name }
      })),
    riskMatrix: buildRiskMatrix(risks),
    evidenceSummary: summary.evidenceCoverage,
    next7DaysTasks: summary.next7DaysTasks.map((task) => `${task.code} ${task.title}`),
    decisionsNeeded: meetings
      .flatMap((meeting) => meeting.actionItems)
      .filter((item) => item.status !== "DONE")
      .map((item) => item.decision_title),
    timeline: [...tasks]
      .filter((task) => !["DONE", "VERIFIED"].includes(task.status))
      .sort((a, b) => a.due_date.getTime() - b.due_date.getTime())
      .slice(0, TIMELINE_ITEMS)
      .map((task) => ({
        code: task.code,
        title: task.title,
        start: task.start_date.toISOString(),
        due: task.due_date.toISOString(),
        status: task.status
      }))
  };

  return { project, summary, committeeStats, frozen };
}
