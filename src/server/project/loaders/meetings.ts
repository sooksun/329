import { getActiveProjectContext } from "@/server/project/active-project";
import { listCommittees } from "@/server/project/queries/committees";
import { listMeetings } from "@/server/project/queries/meetings";
import { listSnapshots } from "@/server/project/queries/snapshots";
import { listTasksForEvidenceForm } from "@/server/project/queries/tasks";

export async function getMeetingsPageData() {
  const project = await getActiveProjectContext();
  if (!project) return null;

  const [meetings, snapshots, committees, tasks] = await Promise.all([
    listMeetings(project.id),
    listSnapshots(project.id),
    listCommittees(project.id),
    listTasksForEvidenceForm(project.id)
  ]);
  return { project: { id: project.id }, meetings, snapshots, committees, tasks };
}
