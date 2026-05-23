import { NextResponse } from "next/server";
import { errors } from "@/lib/messages";
import { prisma } from "@/lib/prisma";
import { requireApiSession } from "@/server/auth/session";
import { softDeleteTaskComment } from "@/server/tasks/comments";
import { requireTaskAccess } from "@/server/tasks/task-access";

function idsFromUrl(request: Request) {
  const parts = new URL(request.url).pathname.split("/").filter(Boolean);
  const taskIdx = parts.indexOf("tasks");
  const commentIdx = parts.indexOf("comments");
  return {
    taskId: taskIdx >= 0 ? parts[taskIdx + 1] : "",
    commentId: commentIdx >= 0 ? parts[commentIdx + 1] : ""
  };
}

export async function DELETE(request: Request) {
  const auth = await requireApiSession();
  if ("error" in auth) return auth.error;

  const { taskId, commentId } = idsFromUrl(request);
  const access = await requireTaskAccess(taskId, auth.user, "view");
  if ("error" in access) {
    if ("response" in access && access.response) return access.response;
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  try {
    await softDeleteTaskComment(commentId, taskId, auth.user);
    await prisma.auditLog.create({
      data: {
        user_id: auth.user.id,
        action: "Delete task comment",
        entity_type: "Comment",
        entity_id: commentId
      }
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : errors.dataInvalid;
    const status = message === errors.forbidden ? 403 : message === "ไม่พบความคิดเห็น" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
