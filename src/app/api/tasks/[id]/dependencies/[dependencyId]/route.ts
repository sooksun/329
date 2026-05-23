import { NextResponse } from "next/server";
import { errors } from "@/lib/messages";
import { prisma } from "@/lib/prisma";
import { requireApiSession } from "@/server/auth/session";
import { removeTaskDependency } from "@/server/tasks/dependencies";
import { requireTaskAccess } from "@/server/tasks/task-access";

function idsFromUrl(request: Request) {
  const parts = new URL(request.url).pathname.split("/").filter(Boolean);
  const taskIdx = parts.indexOf("tasks");
  const depIdx = parts.indexOf("dependencies");
  return {
    taskId: taskIdx >= 0 ? parts[taskIdx + 1] : "",
    dependencyId: depIdx >= 0 ? parts[depIdx + 1] : ""
  };
}

export async function DELETE(request: Request) {
  const auth = await requireApiSession();
  if ("error" in auth) return auth.error;

  const { taskId, dependencyId } = idsFromUrl(request);
  const access = await requireTaskAccess(taskId, auth.user, "edit");
  if ("error" in access) {
    if ("response" in access && access.response) return access.response;
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  try {
    await removeTaskDependency(dependencyId, taskId);
    await prisma.auditLog.create({
      data: {
        user_id: auth.user.id,
        action: "Remove task dependency",
        entity_type: "TaskDependency",
        entity_id: dependencyId
      }
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : errors.dataInvalid;
    return NextResponse.json({ error: message }, { status: message === "ไม่พบความสัมพันธ์งาน" ? 404 : 400 });
  }
}
