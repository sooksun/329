import { cache } from "react";
import { unstable_noStore as noStore } from "next/cache";
import type { Project } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getOptionalSessionUser } from "@/server/auth/session";
import { getActiveProjectForUser } from "@/server/tenant/project-access";

export const getActiveProject = cache(async (): Promise<Project | null> => {
  noStore();
  const user = await getOptionalSessionUser();
  if (user) return getActiveProjectForUser(user);

  return prisma.project.findFirst({ where: { deleted_at: null }, orderBy: { created_at: "asc" } });
});

/** ตรวจงานเลยกำหนดได้ไม่เกิน 1 ครั้ง/นาที/โปรเจกต์ ต่อ process — เดิมเขียน DB + แจ้งเตือนทุกครั้งที่ render หน้า */
const DELAY_SYNC_INTERVAL_MS = 60 * 1000;
const lastDelaySync = new Map<string, number>();

export const syncDelayedTasks = cache(async (projectId: string) => {
  noStore();
  const now = new Date();
  const last = lastDelaySync.get(projectId) ?? 0;
  if (now.getTime() - last < DELAY_SYNC_INTERVAL_MS) return;
  // ตั้งเวลาก่อน await — request ที่เข้ามาพร้อมกันจะไม่แจ้งเตือนซ้ำ
  lastDelaySync.set(projectId, now.getTime());

  const toDelay = await prisma.task.findMany({
    where: {
      project_id: projectId,
      deleted_at: null,
      status: { notIn: ["DONE", "VERIFIED", "DELAYED"] },
      due_date: { lt: now }
    },
    select: { id: true, code: true, title: true, owner_id: true, due_date: true }
  });
  if (toDelay.length === 0) return;

  await prisma.task.updateMany({
    where: { id: { in: toDelay.map((task) => task.id) } },
    data: { status: "DELAYED" }
  });

  const { notifyDelayedTasks } = await import("@/server/notifications/dispatch");
  await notifyDelayedTasks(projectId, toDelay);
  // สถานะงานเปลี่ยน → cache dashboard/summary เก่าต้องทิ้ง
  const { invalidateProjectCache } = await import("@/server/cache/invalidate");
  await invalidateProjectCache(projectId);
});

export async function getActiveProjectContext() {
  const project = await getActiveProject();
  if (!project) return null;
  const [, context] = await Promise.all([
    syncDelayedTasks(project.id),
    prisma.project.findUnique({
      where: { id: project.id },
      include: { organization: { select: { id: true, slug: true, name: true } } }
    })
  ]);
  return context;
}

export async function requireActiveProjectContext() {
  const project = await getActiveProjectContext();
  if (!project) throw new Error("NO_ACTIVE_PROJECT");
  return project;
}
