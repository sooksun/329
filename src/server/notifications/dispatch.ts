import { prisma } from "@/lib/prisma";
import { notificationService } from "@/server/services/notification-service";

type DelayedTask = { id: string; code: string; title: string; owner_id: string | null; due_date: Date };

export async function notifyEvidenceUploaded(input: {
  projectId: string;
  taskCode: string;
  caption: string;
}) {
  await notificationService.create({
    projectId: input.projectId,
    title: "หลักฐานใหม่รอตรวจ",
    body: `${input.taskCode}: ${input.caption}`
  });
}

export async function notifyEvidenceRejected(input: {
  projectId: string;
  userId: string | null | undefined;
  taskCode: string;
  caption: string;
  reason?: string | null;
}) {
  if (!input.userId) return;
  const reasonText = input.reason?.trim() ? ` — เหตุผล: ${input.reason.trim()}` : "";
  await notificationService.create({
    projectId: input.projectId,
    userId: input.userId,
    title: "หลักฐานไม่ผ่านการตรวจ",
    body: `${input.taskCode}: ${input.caption}${reasonText}`
  });
}

export const DELAYED_TASK_TITLE = "ภารกิจเลยกำหนด";

/** ข้ามงานที่เคยแจ้ง "เลยกำหนด" ไปแล้วหลังวันครบกำหนดปัจจุบัน — แจ้งครั้งเดียวต่อกำหนดส่ง */
export function tasksNeedingDelayNotice(
  tasks: DelayedTask[],
  previous: { body: string; created_at: Date }[]
) {
  return tasks.filter(
    (task) => !previous.some((n) => n.body.startsWith(`${task.code}:`) && n.created_at >= task.due_date)
  );
}

export async function notifyDelayedTasks(projectId: string, tasks: DelayedTask[]) {
  if (tasks.length === 0) return;
  const previous = await prisma.notification.findMany({
    where: {
      project_id: projectId,
      title: DELAYED_TASK_TITLE,
      OR: tasks.map((task) => ({ body: { startsWith: `${task.code}:` } }))
    },
    select: { body: true, created_at: true }
  });

  await Promise.all(
    tasksNeedingDelayNotice(tasks, previous).map((task) =>
      notificationService.create({
        projectId,
        userId: task.owner_id ?? undefined,
        title: DELAYED_TASK_TITLE,
        body: `${task.code}: ${task.title}`
      })
    )
  );
}
