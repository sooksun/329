import { getActiveProjectContext } from "@/server/project/active-project";
import { listReports, listSnapshots } from "@/server/project/queries/snapshots";

export async function getReportsPageData() {
  const project = await getActiveProjectContext();
  if (!project) return null;

  const [snapshots, reports] = await Promise.all([listSnapshots(project.id), listReports(project.id)]);
  return { snapshots, reports };
}
