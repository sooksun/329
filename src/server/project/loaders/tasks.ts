import { getActiveProjectContext } from "@/server/project/active-project";
import { listCommittees } from "@/server/project/queries/committees";
import { listTasks } from "@/server/project/queries/tasks";

export async function getTasksPageData() {
  const project = await getActiveProjectContext();
  if (!project) return null;

  const [committees, tasks] = await Promise.all([listCommittees(project.id), listTasks(project.id)]);
  return { project: { id: project.id }, committees, tasks, summary: { totalTasks: tasks.length } };
}
