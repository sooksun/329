import { NextResponse } from "next/server";
import type { TaskStatus } from "@prisma/client";
import { can, permissions } from "@/lib/rbac";
import { errors } from "@/lib/messages";
import { prisma } from "@/lib/prisma";
import { validateSubtaskInput, weightedProgress } from "@/lib/rules";
import { invalidateProjectCache } from "@/server/cache/invalidate";
import { getCommitteeAccessContext, isGlobalTaskAdmin } from "@/server/auth/committee-access";
import { requireApiSession } from "@/server/auth/session";
import { canUpdateTask, forbiddenResponse } from "@/server/permissions/assert";

const taskStatuses = new Set<TaskStatus>(["NOT_STARTED", "IN_PROGRESS", "SUBMITTED", "REVISION_REQUIRED", "VERIFIED", "DONE", "DELAYED"]);

async function rollupTaskProgressFromSubtasks(taskId: string, userId: string) {
  const subtasks = await prisma.subtask.findMany({ where: { task_id: taskId, deleted_at: null } });
  if (!subtasks.length) return;

  const reported = weightedProgress(subtasks.map((s) => ({ weight: s.weight, verified_progress: s.reported_progress })));
  const verified = weightedProgress(subtasks.map((s) => ({ weight: s.weight, verified_progress: s.verified_progress })));

  await prisma.task.update({
    where: { id: taskId },
    data: { reported_progress: reported, verified_progress: verified, updated_by: userId }
  });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireApiSession();
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  const subtask = await prisma.subtask.findFirst({
    where: { id, deleted_at: null },
    include: { task: true }
  });
  if (!subtask || subtask.task.deleted_at) {
    return NextResponse.json({ error: errors.subtaskNotFound }, { status: 404 });
  }
  const access = await getCommitteeAccessContext(auth.user, subtask.task.project_id);
  if (!canUpdateTask(auth.user, subtask.task, access)) {
    return forbiddenResponse(errors.subtaskEditCommitteeOnly);
  }

  const body = await request.json();
  const title = String(body.title ?? subtask.title).trim();
  const notes = body.notes === undefined ? subtask.notes : String(body.notes ?? "").trim() || null;
  const nextStatus = String(body.status ?? subtask.status) as TaskStatus;
  const reportedProgress = Number(body.reported_progress ?? subtask.reported_progress);
  const verifiedProgress = Number(body.verified_progress ?? subtask.verified_progress);

  if (!taskStatuses.has(nextStatus)) {
    return NextResponse.json({ error: errors.statusInvalid }, { status: 400 });
  }

  try {
    validateSubtaskInput({ title, reported_progress: reportedProgress, verified_progress: verifiedProgress });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : errors.dataInvalid }, { status: 400 });
  }

  const updateData: {
    title: string;
    notes: string | null;
    status: TaskStatus;
    reported_progress: number;
    verified_progress: number;
    updated_by: string;
    owner_id?: string | null;
  } = {
    title,
    notes,
    status: nextStatus,
    reported_progress: reportedProgress,
    verified_progress: verifiedProgress,
    updated_by: auth.user.id
  };

  if (body.owner_id !== undefined) {
    const canAssign =
      isGlobalTaskAdmin(auth.user) ||
      can(auth.user.roles, permissions.taskManage) ||
      can(auth.user.roles, permissions.admin);
    if (!canAssign) {
      return forbiddenResponse("ไม่มีสิทธิ์กำหนดผู้รับผิดชอบงานย่อย");
    }
    const nextOwner =
      body.owner_id === null || body.owner_id === "" ? null : String(body.owner_id);
    if (nextOwner) {
      const member = await prisma.committeeMember.findFirst({
        where: { committee_id: subtask.task.committee_id, user_id: nextOwner }
      });
      if (!member && !isGlobalTaskAdmin(auth.user)) {
        return NextResponse.json({ error: "ผู้รับผิดชอบต้องอยู่ในคณะกรรมการของงานนี้" }, { status: 400 });
      }
    }
    updateData.owner_id = nextOwner;
  }

  const updated = await prisma.subtask.update({
    where: { id },
    data: updateData
  });

  await rollupTaskProgressFromSubtasks(subtask.task_id, auth.user.id);

  await prisma.auditLog.create({
    data: {
      user_id: auth.user.id,
      action: "Update subtask",
      entity_type: "Subtask",
      entity_id: id,
      old_value: JSON.stringify(subtask),
      new_value: JSON.stringify(updated)
    }
  });

  await invalidateProjectCache(subtask.task.project_id);
  return NextResponse.json(updated);
}
