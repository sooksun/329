import { cache } from "react";
import { can, permissions } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { isGlobalTaskAdmin } from "@/server/auth/committee-access";
import type { SessionUser } from "@/server/auth/session";

export const FINANCE_COMMITTEE_NAME = "อำนวยการและการเงิน";

export const isFinanceCommitteeMember = cache(async (userId: string, projectId: string) => {
  const link = await prisma.committeeMember.findFirst({
    where: {
      user_id: userId,
      committee: {
        project_id: projectId,
        name: FINANCE_COMMITTEE_NAME,
        deleted_at: null
      }
    },
    select: { id: true }
  });
  return Boolean(link);
});

export async function canManageBudget(user: SessionUser, projectId: string) {
  if (can(user.roles, permissions.admin) || can(user.roles, permissions.budgetManage)) return true;
  if (isGlobalTaskAdmin(user)) return true;
  return isFinanceCommitteeMember(user.id, projectId);
}
