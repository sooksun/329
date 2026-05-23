import { prisma } from "@/lib/prisma";
import { taskDetailInclude } from "@/server/tasks/task-access";

const taskListInclude = {
  committee: true,
  owner: true,
  reviewer: { select: { id: true, name: true } },
  evidence: { where: { deleted_at: null } },
  budgetItems: { where: { deleted_at: null } },
  risks: { where: { deleted_at: null } },
  subtasks: {
    where: { deleted_at: null },
    orderBy: { created_at: "asc" },
    include: {
      owner: { select: { id: true, name: true, username: true } },
      evidence: {
        where: { deleted_at: null },
        include: { fileAsset: true },
        orderBy: { created_at: "desc" }
      }
    }
  }
} as const;

export async function listTasks(projectId: string) {
  return prisma.task.findMany({
    where: { project_id: projectId, deleted_at: null },
    include: taskListInclude,
    orderBy: [{ committee_id: "asc" }, { due_date: "asc" }]
  });
}

export async function listTasksForEvidenceForm(projectId: string) {
  return prisma.task.findMany({
    where: { project_id: projectId, deleted_at: null },
    select: {
      id: true,
      code: true,
      title: true,
      committee_id: true,
      committee: { select: { name: true } }
    },
    orderBy: { code: "asc" }
  });
}

export async function getTaskById(taskId: string) {
  return prisma.task.findFirst({
    where: { id: taskId, deleted_at: null },
    include: taskDetailInclude
  });
}

export async function countTasks(projectId: string) {
  return prisma.task.count({ where: { project_id: projectId, deleted_at: null } });
}
