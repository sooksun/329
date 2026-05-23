import { NextResponse } from "next/server";
import { errors } from "@/lib/messages";
import { prisma } from "@/lib/prisma";
import { requireApiSession } from "@/server/auth/session";
import { createTaskComment, listTaskComments } from "@/server/tasks/comments";
import { requireTaskAccess } from "@/server/tasks/task-access";

function taskIdFromUrl(request: Request) {
  const parts = new URL(request.url).pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("tasks");
  return idx >= 0 ? parts[idx + 1] : "";
}

export async function GET(request: Request) {
  const auth = await requireApiSession();
  if ("error" in auth) return auth.error;

  const taskId = taskIdFromUrl(request);
  const access = await requireTaskAccess(taskId, auth.user, "view");
  if ("error" in access) {
    if ("response" in access && access.response) return access.response;
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const comments = await listTaskComments(taskId);
  const userIds = [...new Set(comments.map((c) => c.user_id).filter(Boolean) as string[])];
  const users = userIds.length
    ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } })
    : [];
  const names = new Map(users.map((u) => [u.id, u.name]));

  return NextResponse.json({
    items: comments.map((c) => ({
      id: c.id,
      body: c.body,
      created_at: c.created_at,
      user_id: c.user_id,
      author_name: c.user_id ? (names.get(c.user_id) ?? "ผู้ใช้") : "ระบบ"
    }))
  });
}

export async function POST(request: Request) {
  const auth = await requireApiSession();
  if ("error" in auth) return auth.error;

  const taskId = taskIdFromUrl(request);
  const access = await requireTaskAccess(taskId, auth.user, "edit");
  if ("error" in access) {
    if ("response" in access && access.response) return access.response;
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const body = await request.json().catch(() => ({}));
  try {
    const comment = await createTaskComment(taskId, auth.user.id, String(body.body ?? ""));
    await prisma.auditLog.create({
      data: {
        user_id: auth.user.id,
        action: "Create task comment",
        entity_type: "Comment",
        entity_id: comment.id,
        new_value: JSON.stringify({ task_id: taskId, body: comment.body })
      }
    });
    return NextResponse.json(
      {
        id: comment.id,
        body: comment.body,
        created_at: comment.created_at,
        user_id: comment.user_id,
        author_name: auth.user.name
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : errors.dataInvalid },
      { status: 400 }
    );
  }
}
