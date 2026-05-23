import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { filterTasksByCommitteeAccess, getCommitteeAccessContext } from "@/server/auth/committee-access";
import { getSessionUser } from "@/server/auth/session";
import { getActiveProjectContext } from "@/server/project/active-project";
import { listTasks } from "@/server/project/queries/tasks";
import { buildTaskExportRows } from "@/lib/task-export";

export async function getTaskExportPageData(committeeId?: string) {
  const project = await getActiveProjectContext();
  if (!project) return null;

  const session = await getServerSession(authOptions);
  const user = getSessionUser(session);
  if (!user) return null;

  const access = await getCommitteeAccessContext(user, project.id);
  let tasks = await listTasks(project.id);
  tasks = filterTasksByCommitteeAccess(tasks, access);

  if (committeeId) {
    tasks = tasks.filter((task) => task.committee_id === committeeId);
  }

  const rows = buildTaskExportRows(
    tasks.map((task) => ({
      code: task.code,
      title: task.title,
      description: task.description,
      success_criteria: task.success_criteria,
      committee: { name: task.committee.name },
      subtasks: task.subtasks.map((subtask) => ({
        title: subtask.title,
        notes: subtask.notes
      }))
    }))
  );

  const committees = [...new Map(tasks.map((t) => [t.committee_id, { id: t.committee_id, name: t.committee.name }])).values()].sort(
    (a, b) => a.name.localeCompare(b.name, "th")
  );

  return {
    project: { id: project.id, name: project.name, edition: project.edition },
    committees,
    rows,
    summary: {
      taskCount: tasks.length,
      subtaskCount: tasks.reduce((sum, t) => sum + t.subtasks.length, 0),
      rowCount: rows.length
    },
    selectedCommitteeId: committeeId ?? null
  };
}
