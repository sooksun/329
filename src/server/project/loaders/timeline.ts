import { getActiveProjectContext } from "@/server/project/active-project";
import { listTasks } from "@/server/project/queries/tasks";

export async function getTimelinePageData() {
  const project = await getActiveProjectContext();
  if (!project) return null;

  const tasks = await listTasks(project.id);
  return { tasks };
}
