import { projectDashboardKey } from "@/server/cache/keys";
import { withCache } from "@/server/cache/with-cache";
import { getActiveProjectContext } from "@/server/project/active-project";
import { computeCommitteeStats, computeProjectSummary } from "@/server/project/compute";
import { listBudgetItems } from "@/server/project/queries/budget";
import { listCommittees } from "@/server/project/queries/committees";
import { listEvidence } from "@/server/project/queries/evidence";
import { listRisks } from "@/server/project/queries/risks";
import { listSnapshots } from "@/server/project/queries/snapshots";
import { listTaskSummaries } from "@/server/project/queries/tasks";

const DASHBOARD_TOP_RISKS = 4;

async function loadDashboardPageData(project: NonNullable<Awaited<ReturnType<typeof getActiveProjectContext>>>) {
  // ใช้ query แบบเบา (ไม่ดึง subtasks/comments/fileAsset) — ผลทั้งหมดถูก cache ลง Redis
  const [committees, tasks, evidence, budgetItems, risks, snapshots] = await Promise.all([
    listCommittees(project.id),
    listTaskSummaries(project.id),
    listEvidence(project.id),
    listBudgetItems(project.id),
    listRisks(project.id),
    listSnapshots(project.id)
  ]);

  const summary = computeProjectSummary({ project, tasks, evidence, risks, budgetItems });
  const committeeStats = computeCommitteeStats({ committees, tasks, budgetItems, risks });

  // คืน/cache เฉพาะสิ่งที่หน้า dashboard ใช้จริง
  return {
    project,
    committeeStats,
    summary,
    risks: risks.slice(0, DASHBOARD_TOP_RISKS),
    latestSnapshotId: snapshots[0]?.id ?? null
  };
}

export async function getDashboardPageData() {
  const project = await getActiveProjectContext();
  if (!project) return null;
  return withCache(projectDashboardKey(project.id), () => loadDashboardPageData(project));
}
