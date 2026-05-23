import { cache } from "react";
import type { Project } from "@prisma/client";
import { can, permissions } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { isGlobalTaskAdmin } from "@/server/auth/committee-access";
import type { SessionUser } from "@/server/auth/session";

export type AccessibleProject = {
  id: string;
  name: string;
  edition: string;
  slug: string | null;
  organization: { id: string; slug: string; name: string };
};

const projectListSelect = {
  id: true,
  name: true,
  edition: true,
  slug: true,
  organization: { select: { id: true, slug: true, name: true } }
} as const;

const PRIMARY_PROJECT_SLUG = "edition-2570";

/** โปรเจกต์หลักขึ้นก่อน — ไม่ให้รอบ demo ว่างๆ เป็นค่าเริ่มต้น */
export function sortAccessibleProjects(projects: AccessibleProject[]) {
  return [...projects].sort((a, b) => {
    if (a.slug === PRIMARY_PROJECT_SLUG) return -1;
    if (b.slug === PRIMARY_PROJECT_SLUG) return 1;
    if (a.slug?.includes("demo")) return 1;
    if (b.slug?.includes("demo")) return -1;
    return a.name.localeCompare(b.name, "th");
  });
}

export function pickDefaultProjectId(projects: AccessibleProject[]) {
  if (projects.length === 0) return null;
  const sorted = sortAccessibleProjects(projects);
  return sorted[0]!.id;
}

export const listAccessibleProjects = cache(async (user: SessionUser): Promise<AccessibleProject[]> => {
  if (can(user.roles, permissions.admin)) {
    const rows = await prisma.project.findMany({
      where: { deleted_at: null },
      select: projectListSelect,
      orderBy: [{ organization: { name: "asc" } }, { created_at: "asc" }]
    });
    return sortAccessibleProjects(rows);
  }

  let orgIds = (
    await prisma.organizationMember.findMany({
      where: { user_id: user.id, organization: { deleted_at: null } },
      select: { organization_id: true }
    })
  ).map((row) => row.organization_id);

  if (orgIds.length === 0) {
    const fromCommittees = await prisma.committeeMember.findMany({
      where: { user_id: user.id, committee: { project: { deleted_at: null } } },
      select: { committee: { select: { project: { select: { organization_id: true } } } } }
    });
    orgIds = [...new Set(fromCommittees.map((row) => row.committee.project.organization_id))];
  }

  if (isGlobalTaskAdmin(user)) {
    const rows = await prisma.project.findMany({
      where: {
        deleted_at: null,
        ...(orgIds.length > 0 ? { organization_id: { in: orgIds } } : {})
      },
      select: projectListSelect,
      orderBy: [{ created_at: "asc" }]
    });
    return sortAccessibleProjects(rows);
  }

  if (orgIds.length === 0) return [];

  const committeeProjectIds = (
    await prisma.committeeMember.findMany({
      where: {
        user_id: user.id,
        committee: { project: { deleted_at: null, organization_id: { in: orgIds } } }
      },
      select: { committee: { select: { project_id: true } } }
    })
  ).map((row) => row.committee.project_id);

  const uniqueIds = [...new Set(committeeProjectIds)];
  if (uniqueIds.length === 0) return [];

  const rows = await prisma.project.findMany({
    where: { id: { in: uniqueIds }, deleted_at: null },
    select: projectListSelect,
    orderBy: [{ created_at: "asc" }]
  });
  return sortAccessibleProjects(rows);
});

export async function userCanAccessProject(user: SessionUser, projectId: string) {
  const accessible = await listAccessibleProjects(user);
  return accessible.some((project) => project.id === projectId);
}

export async function resolveActiveProjectId(user: SessionUser, requestedProjectId?: string | null) {
  const accessible = await listAccessibleProjects(user);
  if (accessible.length === 0) return null;
  if (requestedProjectId && accessible.some((project) => project.id === requestedProjectId)) {
    return requestedProjectId;
  }
  return pickDefaultProjectId(accessible);
}

export async function getActiveProjectForUser(user: SessionUser): Promise<Project | null> {
  const projectId = await resolveActiveProjectId(user);
  if (!projectId) return null;
  return prisma.project.findFirst({ where: { id: projectId, deleted_at: null } });
}
