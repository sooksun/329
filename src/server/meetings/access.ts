import { can, permissions } from "@/lib/rbac";
import type { SessionUser } from "@/server/auth/session";

export function canManageMeetings(user: SessionUser) {
  return can(user.roles, permissions.admin) || can(user.roles, permissions.meetingManage);
}
