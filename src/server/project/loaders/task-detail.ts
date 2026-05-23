import { getActiveProjectContext } from "@/server/project/active-project";
import { getTaskById, listTasks } from "@/server/project/queries/tasks";

export async function getTaskDetailPageData(taskId?: string) {
  const project = await getActiveProjectContext();
  if (!project) return null;

  if (taskId) {
    const task = await getTaskById(taskId);
    if (task && task.project_id === project.id) return { project: { id: project.id }, task };
  }

  const tasks = await listTasks(project.id);
  const first = tasks[0];
  if (!first) return null;
  const task = await getTaskById(first.id);
  if (!task) return null;
  return { project: { id: project.id }, task };
}
