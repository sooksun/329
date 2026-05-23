import { errors } from "@/lib/messages";
import { prisma } from "@/lib/prisma";
import { getCommitteeAccessContext } from "@/server/auth/committee-access";
import type { SessionUser } from "@/server/auth/session";
import { canUpdateTask, canViewTask, forbiddenResponse } from "@/server/permissions/assert";

const taskDetailInclude = {
  committee: true,
  owner: true,
  reviewer: { select: { id: true, name: true } },
  evidence: { where: { deleted_at: null } },
  budgetItems: { where: { deleted_at: null } },
  risks: { where: { deleted_at: null } },
  comments: { where: { deleted_at: null }, orderBy: { created_at: "desc" as const } },
  dependencies: {
    include: {
      dependsOn: {
        select: { id: true, code: true, title: true, status: true, due_date: true, committee_id: true }
      }
    }
  },
  dependents: {
    include: {
      task: {
        select: { id: true, code: true, title: true, status: true, due_date: true, committee_id: true }
      }
    }
  },
  subtasks: {
    where: { deleted_at: null },
    orderBy: { created_at: "asc" as const },
    include: {
      owner: { select: { id: true, name: true, username: true } },
      evidence: {
        where: { deleted_at: null },
        include: { fileAsset: true },
        orderBy: { created_at: "desc" as const }
      }
    }
  }
} as const;

export async function requireTaskAccess(taskId: string, user: SessionUser, mode: "view" | "edit") {
  const task = await prisma.task.findFirst({
    where: { id: taskId, deleted_at: null },
    include: taskDetailInclude
  });
  if (!task) return { error: errors.taskNotFound, status: 404 as const };

  const access = await getCommitteeAccessContext(user, task.project_id);
  const allowed = mode === "edit" ? canUpdateTask(user, task, access) : canViewTask(user, task, access);
  if (!allowed) {
    const message = mode === "edit" ? errors.taskEditCommitteeOnly : errors.forbidden;
    return { error: message, status: 403 as const, response: forbiddenResponse(message) };
  }

  return { task, access };
}

export { taskDetailInclude };
