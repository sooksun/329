import { NextResponse } from "next/server";
import { can, permissions } from "@/lib/rbac";
import type { CommitteeAccessContext } from "@/server/auth/committee-access";
import { canEditCommitteeTask, canViewCommitteeTask, isGlobalTaskAdmin } from "@/server/auth/committee-access";
import type { SessionUser } from "@/server/auth/session";

export function forbiddenResponse(message = "ไม่มีสิทธิ์ดำเนินการนี้") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function assertPermission(user: SessionUser, permission: string) {
  if (!can(user.roles, permission)) {
    return forbiddenResponse();
  }
  return null;
}

export function canUpdateTask(
  user: SessionUser,
  task: { committee_id: string; owner_id: string | null },
  access: CommitteeAccessContext
) {
  return canEditCommitteeTask(user, task, access);
}

export function canViewTask(
  user: SessionUser,
  task: { committee_id: string },
  access: CommitteeAccessContext
) {
  return canViewCommitteeTask(user, task, access);
}

export function canUploadEvidence(
  user: SessionUser,
  task: { committee_id: string; owner_id?: string | null },
  access: CommitteeAccessContext
) {
  return canEditCommitteeTask(user, task, access);
}

/** ตรวจหลักฐานได้เมื่อมี evidence:review และอยู่ในคณะของหลักฐาน (หรือ global admin) */
export function canReviewEvidence(
  user: SessionUser,
  evidence: { committee_id: string },
  access: CommitteeAccessContext
) {
  if (!can(user.roles, permissions.evidenceReview)) return false;
  if (access.isGlobalAdmin) return true;
  return access.committeeIds.includes(evidence.committee_id);
}

export function canViewDashboard(user: SessionUser) {
  return can(user.roles, permissions.admin) || can(user.roles, permissions.dashboardView);
}

export function canDownloadFile(user: SessionUser) {
  return canViewDashboard(user);
}

export { isGlobalTaskAdmin };
