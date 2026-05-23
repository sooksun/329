import { errors } from "@/lib/messages";
import { prisma } from "@/lib/prisma";
import { hasDependencyLoop } from "@/lib/rules";

export async function listProjectDependencyEdges(projectId: string) {
  return prisma.taskDependency.findMany({
    where: {
      task: { project_id: projectId, deleted_at: null },
      dependsOn: { deleted_at: null }
    },
    select: { task_id: true, depends_on_id: true }
  });
}

export async function addTaskDependency(taskId: string, dependsOnId: string, projectId: string) {
  if (taskId === dependsOnId) throw new Error("ภารกิจไม่สามารถพึ่งพาตนเองได้");

  const [task, dependsOn] = await Promise.all([
    prisma.task.findFirst({ where: { id: taskId, project_id: projectId, deleted_at: null } }),
    prisma.task.findFirst({ where: { id: dependsOnId, project_id: projectId, deleted_at: null } })
  ]);
  if (!task || !dependsOn) throw new Error(errors.taskNotFound);

  const existing = await prisma.taskDependency.findUnique({
    where: { task_id_depends_on_id: { task_id: taskId, depends_on_id: dependsOnId } }
  });
  if (existing) throw new Error("มีความสัมพันธ์นี้อยู่แล้ว");

  const edges = await listProjectDependencyEdges(projectId);
  if (hasDependencyLoop(edges, { task_id: taskId, depends_on_id: dependsOnId })) {
    throw new Error("ไม่สามารถเพิ่มได้ — จะเกิดการพึ่งพาวน cyclic");
  }

  return prisma.taskDependency.create({
    data: { task_id: taskId, depends_on_id: dependsOnId },
    include: {
      dependsOn: { select: { id: true, code: true, title: true, status: true, due_date: true } }
    }
  });
}

export async function removeTaskDependency(dependencyId: string, taskId: string) {
  const row = await prisma.taskDependency.findFirst({
    where: { id: dependencyId, task_id: taskId }
  });
  if (!row) throw new Error("ไม่พบความสัมพันธ์งาน");
  await prisma.taskDependency.delete({ where: { id: dependencyId } });
}
