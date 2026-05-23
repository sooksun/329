import { getActiveProjectContext } from "@/server/project/active-project";
import { listEvidence } from "@/server/project/queries/evidence";
import { listTasksForEvidenceForm } from "@/server/project/queries/tasks";
import { countTasks } from "@/server/project/queries/tasks";

export async function getEvidencePageData() {
  const project = await getActiveProjectContext();
  if (!project) return null;

  const [evidence, tasks, totalTasks] = await Promise.all([
    listEvidence(project.id),
    listTasksForEvidenceForm(project.id),
    countTasks(project.id)
  ]);

  return { project: { id: project.id }, evidence, tasks, summary: { totalTasks } };
}
