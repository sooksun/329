import { can, permissions } from "@/lib/rbac";
import { errors } from "@/lib/messages";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/server/auth/session";

export async function listTaskComments(taskId: string) {
  return prisma.comment.findMany({
    where: { task_id: taskId, deleted_at: null },
    orderBy: { created_at: "desc" }
  });
}

export async function createTaskComment(taskId: string, userId: string, body: string) {
  const text = body.trim();
  if (!text) throw new Error("กรุณาระบุข้อความความคิดเห็น");
  if (text.length > 4000) throw new Error("ความคิดเห็นยาวเกินไป (สูงสุด 4,000 ตัวอักษร)");

  return prisma.comment.create({
    data: { task_id: taskId, user_id: userId, body: text }
  });
}

export async function softDeleteTaskComment(commentId: string, taskId: string, user: SessionUser) {
  const comment = await prisma.comment.findFirst({
    where: { id: commentId, task_id: taskId, deleted_at: null }
  });
  if (!comment) throw new Error("ไม่พบความคิดเห็น");

  const isAuthor = comment.user_id === user.id;
  const isAdmin = can(user.roles, permissions.admin);
  if (!isAuthor && !isAdmin) throw new Error(errors.forbidden);

  return prisma.comment.update({
    where: { id: commentId },
    data: { deleted_at: new Date() }
  });
}
