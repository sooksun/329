import { NextResponse } from "next/server";
import { errors } from "@/lib/messages";
import { prisma } from "@/lib/prisma";
import { invalidateProjectCache } from "@/server/cache/invalidate";
import { canManageCommitteesGlobally } from "@/server/committees/access";
import { softDeleteCommittee, updateCommittee } from "@/server/committees/manage";
import { requireApiSession } from "@/server/auth/session";
import { forbiddenResponse } from "@/server/permissions/assert";
import { getActiveProjectForUser } from "@/server/tenant/project-access";

function committeeIdFromUrl(request: Request) {
  return new URL(request.url).pathname.split("/").filter(Boolean).pop() ?? "";
}

export async function PATCH(request: Request) {
  const auth = await requireApiSession();
  if ("error" in auth) return auth.error;
  if (!canManageCommitteesGlobally(auth.user)) {
    return forbiddenResponse(errors.committeeManageForbidden);
  }

  const project = await getActiveProjectForUser(auth.user);
  if (!project) return NextResponse.json({ error: errors.noActiveProject }, { status: 404 });

  const id = committeeIdFromUrl(request);
  const body = await request.json().catch(() => ({}));

  try {
    const old = await prisma.committee.findFirst({ where: { id, project_id: project.id, deleted_at: null } });
    const committee = await updateCommittee(
      id,
      project.id,
      {
        name: body.name !== undefined ? String(body.name) : undefined,
        owner_name: body.owner_name !== undefined ? String(body.owner_name) : undefined,
        owner_initials: body.owner_initials !== undefined ? String(body.owner_initials) : undefined,
        sort_order: body.sort_order !== undefined ? Number(body.sort_order) : undefined,
        risk_level: body.risk_level !== undefined ? String(body.risk_level) : undefined,
        planned_budget: body.planned_budget !== undefined ? Number(body.planned_budget) : undefined
      },
      auth.user.id
    );
    await prisma.auditLog.create({
      data: {
        user_id: auth.user.id,
        action: "Update committee",
        entity_type: "Committee",
        entity_id: id,
        old_value: old ? JSON.stringify(old) : null,
        new_value: JSON.stringify(committee)
      }
    });
    await invalidateProjectCache(project.id);
    return NextResponse.json(committee);
  } catch (error) {
    const message = error instanceof Error ? error.message : errors.dataInvalid;
    const status = message === errors.committeeNotFound ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireApiSession();
  if ("error" in auth) return auth.error;
  if (!canManageCommitteesGlobally(auth.user)) {
    return forbiddenResponse(errors.committeeManageForbidden);
  }

  const project = await getActiveProjectForUser(auth.user);
  if (!project) return NextResponse.json({ error: errors.noActiveProject }, { status: 404 });

  const id = committeeIdFromUrl(request);
  try {
    await softDeleteCommittee(id, project.id, auth.user.id);
    await prisma.auditLog.create({
      data: {
        user_id: auth.user.id,
        action: "Delete committee",
        entity_type: "Committee",
        entity_id: id
      }
    });
    await invalidateProjectCache(project.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : errors.dataInvalid;
    const status =
      message === errors.committeeNotFound ? 404 : message === errors.committeeHasTasks ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
