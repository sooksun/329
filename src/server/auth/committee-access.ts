import { cache } from "react";
import { can, permissions } from "@/lib/rbac";
import type { SessionUser } from "@/server/auth/session";
import { prisma } from "@/lib/prisma";

export type CommitteeAccessContext = {
  committeeIds: string[];
  isGlobalAdmin: boolean;
};

export const getUserCommitteeIds = cache(async (userId: string, projectId?: string) => {
  const links = await prisma.committeeMember.findMany({
    where: {
      user_id: userId,
      ...(projectId ? { committee: { project_id: projectId } } : {})
    },
    select: { committee_id: true }
  });
  return links.map((link) => link.committee_id);
});

export async function getCommitteeAccessContext(user: SessionUser, projectId: string): Promise<CommitteeAccessContext> {
  const committeeIds = await getUserCommitteeIds(user.id, projectId);
  return {
    committeeIds,
    isGlobalAdmin: isGlobalTaskAdmin(user)
  };
}

/** Super Admin, ประธานโครงการ, เลขานุการ — เห็นและแก้ไขได้ทุกคณะ */
export function isGlobalTaskAdmin(user: SessionUser) {
  return (
    can(user.roles, permissions.admin) ||
    user.roles.includes("Project Director") ||
    user.roles.includes("Project Secretary")
  );
}

export function canViewCommitteeTask(
  user: SessionUser,
  task: { committee_id: string },
  access: CommitteeAccessContext
) {
  if (access.isGlobalAdmin) return true;
  return access.committeeIds.includes(task.committee_id);
}

/** สมาชิกคณะกรรมการแก้ไขได้เฉพาะงาน/งานย่อยในคณะของตนเอง */
export function canEditCommitteeTask(
  user: SessionUser,
  task: { committee_id: string; owner_id?: string | null },
  access: CommitteeAccessContext
) {
  if (access.isGlobalAdmin) return true;
  if (!access.committeeIds.includes(task.committee_id)) return false;
  // อยู่ในคณะของงานแล้ว — แต่ต้องมีสิทธิ์แก้งานจริง (หัวหน้าคณะ=task:manage หรือเจ้าหน้าที่=task:update-own)
  // ไม่ใช่แค่เป็นสมาชิกคณะก็แก้ได้ (เดิมมี clause committeeIds.includes(...) ซ้ำทำให้ตรวจสิทธิ์เป็นโมฆะ)
  return can(user.roles, permissions.taskManage) || can(user.roles, permissions.taskUpdateOwn);
}

export function filterTasksByCommitteeAccess<T extends { committee_id: string }>(
  tasks: T[],
  access: CommitteeAccessContext
) {
  if (access.isGlobalAdmin) return tasks;
  return tasks.filter((task) => access.committeeIds.includes(task.committee_id));
}

export function filterCommitteesByAccess<T extends { id: string }>(committees: T[], access: CommitteeAccessContext) {
  if (access.isGlobalAdmin) return committees;
  return committees.filter((committee) => access.committeeIds.includes(committee.id));
}
