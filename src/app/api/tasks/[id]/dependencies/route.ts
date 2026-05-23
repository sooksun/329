import { NextResponse } from "next/server";
import { errors } from "@/lib/messages";
import { prisma } from "@/lib/prisma";
import { filterTasksByCommitteeAccess } from "@/server/auth/committee-access";
import { requireApiSession } from "@/server/auth/session";
import { addTaskDependency } from "@/server/tasks/dependencies";
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

  const { task } = access;
  const candidates = await prisma.task.findMany({
    where: { project_id: task.project_id, deleted_at: null, id: { not: taskId } },
    select: { id: true, code: true, title: true, committee_id: true, status: true },
    orderBy: { code: "asc" }
  });
  const pickerTasks = filterTasksByCommitteeAccess(candidates, access.access);

  return NextResponse.json({
    dependsOn: task.dependencies.map((d) => ({
      id: d.id,
      dependsOn: d.dependsOn
    })),
    blockedByThis: task.dependents.map((d) => ({
      id: d.id,
      task: d.task
    })),
    pickerTasks
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
  const dependsOnId = String(body.depends_on_id ?? "");
  if (!dependsOnId) return NextResponse.json({ error: "กรุณาเลือกภารกิจที่ต้องทำก่อน" }, { status: 400 });

  try {
    const dep = await addTaskDependency(taskId, dependsOnId, access.task.project_id);
    await prisma.auditLog.create({
      data: {
        user_id: auth.user.id,
        action: "Add task dependency",
        entity_type: "TaskDependency",
        entity_id: dep.id,
        new_value: JSON.stringify({ task_id: taskId, depends_on_id: dependsOnId })
      }
    });
    return NextResponse.json(dep, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : errors.dataInvalid },
      { status: 400 }
    );
  }
}
