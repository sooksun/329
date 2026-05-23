import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/messages";
import { canMarkDone, validateTaskInput } from "@/lib/rules";
import type { Priority, TaskStatus } from "@prisma/client";
import { invalidateProjectCache } from "@/server/cache/invalidate";
import { getCommitteeAccessContext } from "@/server/auth/committee-access";
import { requireApiSession } from "@/server/auth/session";
import { canUpdateTask, forbiddenResponse } from "@/server/permissions/assert";

const taskStatuses = new Set<TaskStatus>(["NOT_STARTED", "IN_PROGRESS", "SUBMITTED", "REVISION_REQUIRED", "VERIFIED", "DONE", "DELAYED"]);

export async function PATCH(request: Request) {
  const auth = await requireApiSession();
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const id = new URL(request.url).pathname.split("/").pop();
  if (!id) return NextResponse.json({ error: errors.taskIdRequired }, { status: 400 });
  const body = await request.json();
  const task = await prisma.task.findUnique({ where: { id }, include: { evidence: true } });
  if (!task || task.deleted_at) return NextResponse.json({ error: errors.taskNotFound }, { status: 404 });
  const access = await getCommitteeAccessContext(user, task.project_id);
  if (!canUpdateTask(user, task, access)) {
    return forbiddenResponse(errors.taskEditCommitteeOnly);
  }

  const nextStatus = String(body.status ?? task.status) as TaskStatus;
  const reportedProgress = Number(body.reported_progress ?? task.reported_progress);
  const verifiedProgress = Number(body.verified_progress ?? task.verified_progress);
  const title = String(body.title ?? task.title).trim();

  if (!title) return NextResponse.json({ error: errors.taskTitleRequired }, { status: 400 });
  if (!taskStatuses.has(nextStatus)) return NextResponse.json({ error: errors.taskStatusInvalid }, { status: 400 });
  try {
    validateTaskInput({
      owner_id: task.owner_id,
      priority: task.priority as Priority,
      start_date: task.start_date,
      due_date: task.due_date,
      reported_progress: reportedProgress,
      verified_progress: verifiedProgress,
      is_critical: task.is_critical
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : errors.taskInputInvalid }, { status: 400 });
  }

  if (nextStatus === "DONE") {
    const allowed = canMarkDone({
      hasApprovedEvidence: task.evidence.some((e) => e.status === "APPROVED"),
      hasReviewer: Boolean(task.reviewer_id),
      verified_progress: verifiedProgress
    });
    if (!allowed) {
      return NextResponse.json({ error: errors.taskCannotDone }, { status: 409 });
    }
  }
  const updated = await prisma.task.update({
    where: { id },
    data: {
      title,
      status: nextStatus,
      reported_progress: reportedProgress,
      verified_progress: verifiedProgress,
      updated_by: user.id
    }
  });
  await prisma.auditLog.create({
    data: {
      user_id: user.id,
      action: "Update task",
      entity_type: "Task",
      entity_id: id,
      old_value: JSON.stringify(task),
      new_value: JSON.stringify(updated)
    }
  });
  await invalidateProjectCache(task.project_id);
  return NextResponse.json(updated);
}
