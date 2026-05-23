import { NextResponse } from "next/server";
import { errors } from "@/lib/messages";
import { prisma } from "@/lib/prisma";
import { invalidateProjectCache } from "@/server/cache/invalidate";
import { canManageCommitteesGlobally } from "@/server/committees/access";
import { createCommittee, listCommitteesWithMembers, listUsersForCommitteePicker } from "@/server/committees/manage";
import { requireApiSession } from "@/server/auth/session";
import { forbiddenResponse } from "@/server/permissions/assert";
import { getActiveProjectForUser } from "@/server/tenant/project-access";

export async function GET() {
  const auth = await requireApiSession();
  if ("error" in auth) return auth.error;

  const project = await getActiveProjectForUser(auth.user);
  if (!project) return NextResponse.json({ error: errors.noActiveProject }, { status: 404 });

  const [committees, users] = await Promise.all([
    listCommitteesWithMembers(project.id),
    listUsersForCommitteePicker(project.id)
  ]);

  return NextResponse.json({
    committees,
    users,
    canManageGlobal: canManageCommitteesGlobally(auth.user)
  });
}

export async function POST(request: Request) {
  const auth = await requireApiSession();
  if ("error" in auth) return auth.error;
  if (!canManageCommitteesGlobally(auth.user)) {
    return forbiddenResponse(errors.committeeManageForbidden);
  }

  const project = await getActiveProjectForUser(auth.user);
  if (!project) return NextResponse.json({ error: errors.noActiveProject }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  try {
    const committee = await createCommittee({
      projectId: project.id,
      name: String(body.name ?? ""),
      owner_name: String(body.owner_name ?? ""),
      owner_initials: String(body.owner_initials ?? ""),
      sort_order: body.sort_order !== undefined ? Number(body.sort_order) : undefined,
      risk_level: body.risk_level ? String(body.risk_level) : undefined,
      planned_budget: body.planned_budget !== undefined ? Number(body.planned_budget) : undefined,
      createdById: auth.user.id
    });
    await prisma.auditLog.create({
      data: {
        user_id: auth.user.id,
        action: "Create committee",
        entity_type: "Committee",
        entity_id: committee.id,
        new_value: JSON.stringify(committee)
      }
    });
    await invalidateProjectCache(project.id);
    return NextResponse.json(committee, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : errors.dataInvalid },
      { status: 400 }
    );
  }
}
