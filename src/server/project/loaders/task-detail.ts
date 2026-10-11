import { prisma } from "@/lib/prisma";
import { getActiveProjectContext } from "@/server/project/active-project";
import { getTaskById } from "@/server/project/queries/tasks";

export async function getTaskDetailPageData(taskId?: string) {
  const project = await getActiveProjectContext();
  if (!project) return null;

  if (taskId) {
    const task = await getTaskById(taskId);
    // id ไม่พบ/อยู่โปรเจกต์อื่น → null (หน้า 404) — เดิมแสดงภารกิจแรกแทนแบบเงียบๆ ทำให้เข้าใจผิดว่าเปิดถูกงาน
    if (!task || task.project_id !== project.id) return null;
    return { project: { id: project.id }, task };
  }

  // ไม่มี id → ภารกิจแรกตามลำดับเดียวกับ listTasks — ดึงแค่ id ไม่โหลดทั้งตาราง
  const first = await prisma.task.findFirst({
    where: { project_id: project.id, deleted_at: null },
    orderBy: [{ committee_id: "asc" }, { due_date: "asc" }],
    select: { id: true }
  });
  if (!first) return null;
  const task = await getTaskById(first.id);
  if (!task) return null;
  return { project: { id: project.id }, task };
}
