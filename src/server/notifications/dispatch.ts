import { notificationService } from "@/server/services/notification-service";

type DelayedTask = { id: string; code: string; title: string; owner_id: string | null };

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

export async function notifyDelayedTasks(projectId: string, tasks: DelayedTask[]) {
  await Promise.all(
    tasks.map((task) =>
      notificationService.create({
        projectId,
        userId: task.owner_id ?? undefined,
        title: "ภารกิจเลยกำหนด",
        body: `${task.code}: ${task.title}`
      })
    )
  );
}
