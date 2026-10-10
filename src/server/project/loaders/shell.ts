import { projectShellKey } from "@/server/cache/keys";
import { withCache } from "@/server/cache/with-cache";
import { getOptionalSessionUser } from "@/server/auth/session";
import { getActiveProjectContext } from "@/server/project/active-project";
import { getSummaryMetrics } from "@/server/project/queries/summary-metrics";
import { listAccessibleProjects } from "@/server/tenant/project-access";

export async function getShellData() {
  const user = await getOptionalSessionUser();
  if (!user) return null;
  const project = await getActiveProjectContext();
  if (!project) return null;

  // cache เฉพาะ summary (ระดับโปรเจกต์) — รายการโปรเจกต์เป็นข้อมูลต่อผู้ใช้ ห้ามอยู่ใน key ระดับโปรเจกต์
  const [summary, accessibleProjects] = await Promise.all([
    withCache(projectShellKey(project.id), () => getSummaryMetrics(project.id)),
    listAccessibleProjects(user)
  ]);
  if (!summary) return null;

  return { project, summary, accessibleProjects, activeProjectId: project.id };
}
