import { NextResponse } from "next/server";
import { permissions } from "@/lib/rbac";
import { errors } from "@/lib/messages";
import { prisma } from "@/lib/prisma";
import { invalidateProjectCache } from "@/server/cache/invalidate";
import { getCommitteeAccessContext } from "@/server/auth/committee-access";
import { requireApiSession } from "@/server/auth/session";
import { notifyEvidenceRejected } from "@/server/notifications/dispatch";
import { assertPermission, canReviewEvidence, forbiddenResponse } from "@/server/permissions/assert";

export async function POST(request: Request) {
  const auth = await requireApiSession();
  if ("error" in auth) return auth.error;
  const denied = assertPermission(auth.user, permissions.evidenceReview);
  if (denied) return denied;

  const userId = auth.user.id;
  const body = await request.json();
  if (!["APPROVED", "REJECTED"].includes(body.status)) return NextResponse.json({ error: errors.evidenceStatusInvalid }, { status: 400 });
  const old = await prisma.evidence.findUnique({
    where: { id: body.id },
    include: { task: { select: { code: true } } }
  });
  if (!old || old.deleted_at) return NextResponse.json({ error: errors.evidenceNotFound }, { status: 404 });

  const access = await getCommitteeAccessContext(auth.user, old.project_id);
  if (!canReviewEvidence(auth.user, old, access)) {
    return forbiddenResponse(errors.evidenceReviewCommitteeOnly);
  }

  const evidence = await prisma.evidence.update({
    where: { id: body.id },
    data: {
      status: body.status,
      rejection_reason: body.rejection_reason,
      reviewed_at: new Date(),
      reviewed_by: userId,
      updated_by: userId
    }
  });
  await prisma.auditLog.create({
    data: {
      user_id: userId,
      action: body.status === "APPROVED" ? "Approve evidence" : "Reject evidence",
      entity_type: "Evidence",
      entity_id: evidence.id,
      old_value: JSON.stringify(old),
      new_value: JSON.stringify(evidence)
    }
  });
  if (body.status === "REJECTED") {
    await notifyEvidenceRejected({
      projectId: old.project_id,
      userId: old.created_by,
      taskCode: old.task?.code ?? old.code,
      caption: old.caption,
      reason: body.rejection_reason
    });
  }

  await invalidateProjectCache(old.project_id);
  return NextResponse.json(evidence);
}
