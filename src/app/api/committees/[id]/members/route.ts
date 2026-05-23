import { NextResponse } from "next/server";
import { errors } from "@/lib/messages";
import { prisma } from "@/lib/prisma";
import { invalidateProjectCache } from "@/server/cache/invalidate";
import { canManageCommitteeMembers } from "@/server/committees/access";
import { addCommitteeMember } from "@/server/committees/manage";
import { requireApiSession } from "@/server/auth/session";
import { forbiddenResponse } from "@/server/permissions/assert";
import { getActiveProjectForUser } from "@/server/tenant/project-access";

function committeeIdFromMembersUrl(request: Request) {
  const parts = new URL(request.url).pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("committees");
  return idx >= 0 ? parts[idx + 1] : "";
}

export async function POST(request: Request) {
  const auth = await requireApiSession();
  if ("error" in auth) return auth.error;

  const project = await getActiveProjectForUser(auth.user);
  if (!project) return NextResponse.json({ error: errors.noActiveProject }, { status: 404 });

  const committeeId = committeeIdFromMembersUrl(request);
  if (!(await canManageCommitteeMembers(auth.user, committeeId))) {
    return forbiddenResponse(errors.committeeManageForbidden);
  }

  const body = await request.json().catch(() => ({}));
  const userId = String(body.user_id ?? "");
  if (!userId) return NextResponse.json({ error: errors.committeeMemberUserRequired }, { status: 400 });

  try {
    const member = await addCommitteeMember({
      committeeId,
      projectId: project.id,
      userId,
      position: String(body.position ?? "")
    });
    await prisma.auditLog.create({
      data: {
        user_id: auth.user.id,
        action: "Add committee member",
        entity_type: "CommitteeMember",
        entity_id: member.id,
        new_value: JSON.stringify(member)
      }
    });
    await invalidateProjectCache(project.id);
    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : errors.dataInvalid },
      { status: 400 }
    );
  }
}
