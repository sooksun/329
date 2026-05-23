import { can, permissions } from "@/lib/rbac";
import { isGlobalTaskAdmin } from "@/server/auth/committee-access";
import type { SessionUser } from "@/server/auth/session";
import type { CommitteeAccessContext } from "@/server/auth/committee-access";

export function canManageRisksGlobally(user: SessionUser) {
  return can(user.roles, permissions.admin) || can(user.roles, permissions.riskManage) || isGlobalTaskAdmin(user);
}

export function canManageRisk(
  user: SessionUser,
  risk: { committee_id: string },
  access: CommitteeAccessContext
) {
  if (canManageRisksGlobally(user)) return true;
  if (!user.roles.includes("Committee Lead")) return false;
  return access.committeeIds.includes(risk.committee_id);
}
