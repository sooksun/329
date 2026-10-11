import { getActiveProjectContext } from "@/server/project/active-project";
import { listTaskSummaries } from "@/server/project/queries/tasks";

export async function getTimelinePageData() {
  const project = await getActiveProjectContext();
  if (!project) return null;

  const tasks = await listTaskSummaries(project.id);
  return { project, tasks };
}
