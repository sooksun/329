import { NextResponse } from "next/server";
import { errors } from "@/lib/messages";
import { prisma } from "@/lib/prisma";
import { invalidateProjectCache } from "@/server/cache/invalidate";
import { canManageCommitteeMembers } from "@/server/committees/access";
import { removeCommitteeMember, updateCommitteeMember } from "@/server/committees/manage";
import { requireApiSession } from "@/server/auth/session";
import { forbiddenResponse } from "@/server/permissions/assert";
import { getActiveProjectForUser } from "@/server/tenant/project-access";

function idsFromUrl(request: Request) {
  const parts = new URL(request.url).pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("committees");
  return {
    committeeId: idx >= 0 ? parts[idx + 1] : "",
    memberId: parts[parts.length - 1] ?? ""
  };
}

export async function PATCH(request: Request) {
  const auth = await requireApiSession();
  if ("error" in auth) return auth.error;

  const project = await getActiveProjectForUser(auth.user);
  if (!project) return NextResponse.json({ error: errors.noActiveProject }, { status: 404 });

  const { committeeId, memberId } = idsFromUrl(request);
  if (!(await canManageCommitteeMembers(auth.user, committeeId))) {
    return forbiddenResponse(errors.committeeManageForbidden);
  }

  const body = await request.json().catch(() => ({}));
  try {
    const member = await updateCommitteeMember(memberId, committeeId, String(body.position ?? ""));
    await invalidateProjectCache(project.id);
    return NextResponse.json(member);
  } catch (error) {
    const message = error instanceof Error ? error.message : errors.dataInvalid;
    const status = message === errors.committeeMemberNotFound ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireApiSession();
  if ("error" in auth) return auth.error;

  const project = await getActiveProjectForUser(auth.user);
  if (!project) return NextResponse.json({ error: errors.noActiveProject }, { status: 404 });

  const { committeeId, memberId } = idsFromUrl(request);
  if (!(await canManageCommitteeMembers(auth.user, committeeId))) {
    return forbiddenResponse(errors.committeeManageForbidden);
  }

  try {
    await removeCommitteeMember(memberId, committeeId);
    await prisma.auditLog.create({
      data: {
        user_id: auth.user.id,
        action: "Remove committee member",
        entity_type: "CommitteeMember",
        entity_id: memberId
      }
    });
    await invalidateProjectCache(project.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : errors.dataInvalid;
    const status = message === errors.committeeMemberNotFound ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
