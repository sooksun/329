import { can, permissions } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/server/auth/session";

export function canManageCommitteesGlobally(user: SessionUser) {
  return (
    can(user.roles, permissions.admin) ||
    can(user.roles, permissions.committeeManage) ||
    can(user.roles, permissions.userManage)
  );
}

export async function canManageCommitteeMembers(user: SessionUser, committeeId: string) {
  if (canManageCommitteesGlobally(user)) return true;
  if (!user.roles.includes("Committee Lead")) return false;
  const link = await prisma.committeeMember.findFirst({
    where: { user_id: user.id, committee_id: committeeId },
    select: { id: true }
  });
  return Boolean(link);
}
