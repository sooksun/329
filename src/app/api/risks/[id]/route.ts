import { NextResponse } from "next/server";
import type { RiskStatus } from "@prisma/client";
import { errors } from "@/lib/messages";
import { prisma } from "@/lib/prisma";
import { invalidateProjectCache } from "@/server/cache/invalidate";
import { getCommitteeAccessContext } from "@/server/auth/committee-access";
import { requireApiSession } from "@/server/auth/session";
import { forbiddenResponse } from "@/server/permissions/assert";
import { canManageRisk } from "@/server/risks/access";
import { softDeleteRisk, updateRisk } from "@/server/risks/manage";
import { getActiveProjectForUser } from "@/server/tenant/project-access";

function riskIdFromUrl(request: Request) {
  return new URL(request.url).pathname.split("/").pop() ?? "";
}

export async function PATCH(request: Request) {
  const auth = await requireApiSession();
  if ("error" in auth) return auth.error;

  const project = await getActiveProjectForUser(auth.user);
  if (!project) return NextResponse.json({ error: errors.noActiveProject }, { status: 404 });

  const id = riskIdFromUrl(request);
  const existing = await prisma.risk.findFirst({ where: { id, project_id: project.id, deleted_at: null } });
  if (!existing) return NextResponse.json({ error: errors.riskNotFound }, { status: 404 });

  const access = await getCommitteeAccessContext(auth.user, project.id);
  if (!canManageRisk(auth.user, existing, access)) {
    return forbiddenResponse(errors.riskManageForbidden);
  }

  const body = await request.json().catch(() => ({}));
  try {
    const risk = await updateRisk(
      id,
      project.id,
      {
        title: body.title !== undefined ? String(body.title) : undefined,
        committee_id: body.committee_id ? String(body.committee_id) : undefined,
        task_id: body.task_id !== undefined ? (body.task_id ? String(body.task_id) : null) : undefined,
        likelihood: body.likelihood !== undefined ? Number(body.likelihood) : undefined,
        impact: body.impact !== undefined ? Number(body.impact) : undefined,
        mitigation_plan: body.mitigation_plan !== undefined ? String(body.mitigation_plan) : undefined,
        contingency_plan: body.contingency_plan !== undefined ? String(body.contingency_plan) : undefined,
        owner_name: body.owner_name !== undefined ? String(body.owner_name) : undefined,
        owner_initials: body.owner_initials !== undefined ? String(body.owner_initials) : undefined,
        status: body.status as RiskStatus | undefined
      },
      auth.user.id
    );
    await prisma.auditLog.create({
      data: {
        user_id: auth.user.id,
        action: "Update risk",
        entity_type: "Risk",
        entity_id: id,
        old_value: JSON.stringify(existing),
        new_value: JSON.stringify(risk)
      }
    });
    await invalidateProjectCache(project.id);
    return NextResponse.json(risk);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : errors.dataInvalid },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  const auth = await requireApiSession();
  if ("error" in auth) return auth.error;

  const project = await getActiveProjectForUser(auth.user);
  if (!project) return NextResponse.json({ error: errors.noActiveProject }, { status: 404 });

  const id = riskIdFromUrl(request);
  const existing = await prisma.risk.findFirst({ where: { id, project_id: project.id, deleted_at: null } });
  if (!existing) return NextResponse.json({ error: errors.riskNotFound }, { status: 404 });

  const access = await getCommitteeAccessContext(auth.user, project.id);
  if (!canManageRisk(auth.user, existing, access)) {
    return forbiddenResponse(errors.riskManageForbidden);
  }

  await softDeleteRisk(id, project.id, auth.user.id);
  await prisma.auditLog.create({
    data: { user_id: auth.user.id, action: "Delete risk", entity_type: "Risk", entity_id: id }
  });
  await invalidateProjectCache(project.id);
  return NextResponse.json({ ok: true });
}
