import { NextResponse } from "next/server";
import { errors } from "@/lib/messages";
import { prisma } from "@/lib/prisma";
import { invalidateProjectCache } from "@/server/cache/invalidate";
import { requireApiSession } from "@/server/auth/session";
import { forbiddenResponse } from "@/server/permissions/assert";
import { canManageMeetings } from "@/server/meetings/access";
import { createMeeting } from "@/server/meetings/manage";
import { getActiveProjectForUser } from "@/server/tenant/project-access";

export async function POST(request: Request) {
  const auth = await requireApiSession();
  if ("error" in auth) return auth.error;
  if (!canManageMeetings(auth.user)) return forbiddenResponse(errors.meetingManageForbidden);

  const project = await getActiveProjectForUser(auth.user);
  if (!project) return NextResponse.json({ error: errors.noActiveProject }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const agendas = Array.isArray(body.agendas)
    ? body.agendas.map((a: { title?: string }, index: number) => ({ title: String(a.title ?? ""), order: index }))
    : String(body.agenda_text ?? "")
        .split("\n")
        .map((line: string) => line.trim())
        .filter(Boolean)
        .map((title: string, order: number) => ({ title, order }));

  try {
    const meeting = await createMeeting({
      projectId: project.id,
      title: String(body.title ?? ""),
      meeting_at: new Date(String(body.meeting_at ?? "")),
      notes: String(body.notes ?? ""),
      decisions: String(body.decisions ?? ""),
      agendas,
      actionItems: body.action_title
        ? [
            {
              decision_title: String(body.action_title),
              description: String(body.action_description ?? ""),
              owner_name: String(body.action_owner ?? ""),
              due_date: String(body.action_due ?? new Date().toISOString()),
              linked_task_id: body.action_task_id ? String(body.action_task_id) : null
            }
          ]
        : undefined,
      createdById: auth.user.id
    });
    await prisma.auditLog.create({
      data: {
        user_id: auth.user.id,
        action: "Create meeting",
        entity_type: "Meeting",
        entity_id: meeting.id,
        new_value: JSON.stringify({ title: meeting.title })
      }
    });
    await invalidateProjectCache(project.id);
    return NextResponse.json(meeting, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : errors.dataInvalid },
      { status: 400 }
    );
  }
}
