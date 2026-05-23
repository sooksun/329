import { cache } from "react";
import { cookies } from "next/headers";
import { unstable_noStore as noStore } from "next/cache";
import type { Project } from "@prisma/client";
import { MIS_PROJECT_COOKIE } from "@/lib/tenant-cookies";
import { prisma } from "@/lib/prisma";
import { getOptionalSessionUser } from "@/server/auth/session";
import { getActiveProjectForUser, resolveActiveProjectId } from "@/server/tenant/project-access";

async function resolveProjectIdFromSession(): Promise<string | null> {
  const user = await getOptionalSessionUser();
  if (!user) {
    const fallback = await prisma.project.findFirst({
      where: { deleted_at: null },
      orderBy: { created_at: "asc" },
      select: { id: true }
    });
    return fallback?.id ?? null;
  }

  const cookieStore = await cookies();
  const requested = cookieStore.get(MIS_PROJECT_COOKIE)?.value ?? null;
  return resolveActiveProjectId(user, requested);
}

export const getActiveProject = cache(async (): Promise<Project | null> => {
  noStore();
  const user = await getOptionalSessionUser();
  if (user) return getActiveProjectForUser(user);

  const projectId = await resolveProjectIdFromSession();
  if (!projectId) return null;
  return prisma.project.findFirst({ where: { id: projectId, deleted_at: null } });
});

export const syncDelayedTasks = cache(async (projectId: string) => {
  noStore();
  const now = new Date();
  const toDelay = await prisma.task.findMany({
    where: {
      project_id: projectId,
      deleted_at: null,
      status: { notIn: ["DONE", "VERIFIED", "DELAYED"] },
      due_date: { lt: now }
    },
    select: { id: true, code: true, title: true, owner_id: true }
  });
  if (toDelay.length === 0) return;

  await prisma.task.updateMany({
    where: { id: { in: toDelay.map((task) => task.id) } },
    data: { status: "DELAYED" }
  });

  const { notifyDelayedTasks } = await import("@/server/notifications/dispatch");
  await notifyDelayedTasks(projectId, toDelay);
});

export async function getActiveProjectContext() {
  const project = await getActiveProject();
  if (!project) return null;
  await syncDelayedTasks(project.id);
  return prisma.project.findUnique({
    where: { id: project.id },
    include: { organization: { select: { id: true, slug: true, name: true } } }
  });
}

export async function requireActiveProjectContext() {
  const project = await getActiveProjectContext();
  if (!project) throw new Error("NO_ACTIVE_PROJECT");
  return project;
}
