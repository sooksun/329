import { NextResponse } from "next/server";
import { errors } from "@/lib/messages";
import { prisma } from "@/lib/prisma";
import { invalidateProjectCache } from "@/server/cache/invalidate";
import { getCommitteeAccessContext } from "@/server/auth/committee-access";
import { requireApiSession } from "@/server/auth/session";
import { forbiddenResponse } from "@/server/permissions/assert";
import { canManageRisk, canManageRisksGlobally } from "@/server/risks/access";
import { createRisk } from "@/server/risks/manage";
import { getActiveProjectForUser } from "@/server/tenant/project-access";

export async function POST(request: Request) {
  const auth = await requireApiSession();
  if ("error" in auth) return auth.error;

  const project = await getActiveProjectForUser(auth.user);
  if (!project) return NextResponse.json({ error: errors.noActiveProject }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const committeeId = String(body.committee_id ?? "");
  const access = await getCommitteeAccessContext(auth.user, project.id);
  if (!canManageRisksGlobally(auth.user) && !access.committeeIds.includes(committeeId)) {
    return forbiddenResponse(errors.riskManageForbidden);
  }

  try {
    const risk = await createRisk({
      projectId: project.id,
      committeeId,
      taskId: body.task_id ? String(body.task_id) : null,
      title: String(body.title ?? ""),
      likelihood: Number(body.likelihood ?? 3),
      impact: Number(body.impact ?? 3),
      mitigation_plan: String(body.mitigation_plan ?? ""),
      contingency_plan: String(body.contingency_plan ?? ""),
      owner_name: String(body.owner_name ?? ""),
      owner_initials: String(body.owner_initials ?? ""),
      status: body.status,
      createdById: auth.user.id
    });
    await prisma.auditLog.create({
      data: {
        user_id: auth.user.id,
        action: "Create risk",
        entity_type: "Risk",
        entity_id: risk.id,
        new_value: JSON.stringify(risk)
      }
    });
    await invalidateProjectCache(project.id);
    return NextResponse.json(risk, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : errors.dataInvalid },
      { status: 400 }
    );
  }
}
