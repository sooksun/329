import { projectShellKey } from "@/server/cache/keys";
import { withCache } from "@/server/cache/with-cache";
import { getOptionalSessionUser } from "@/server/auth/session";
import { getActiveProjectContext } from "@/server/project/active-project";
import { getSummaryMetrics } from "@/server/project/queries/summary-metrics";
import { listAccessibleProjects } from "@/server/tenant/project-access";

export async function getShellData() {
  const user = await getOptionalSessionUser();
  const project = await getActiveProjectContext();
  if (!project || !user) return null;

  const accessibleProjects = await listAccessibleProjects(user);

  const summary = await getSummaryMetrics(project.id);
  if (!summary) return null;

  return withCache(projectShellKey(project.id), async () => ({
    project,
    summary,
    accessibleProjects,
    activeProjectId: project.id
  }));
}
