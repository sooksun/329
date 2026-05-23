import { NextResponse } from "next/server";
import { errors } from "@/lib/messages";
import { prisma } from "@/lib/prisma";
import { invalidateProjectCache } from "@/server/cache/invalidate";
import { requireApiSession } from "@/server/auth/session";
import { forbiddenResponse } from "@/server/permissions/assert";
import { canManageMeetings } from "@/server/meetings/access";
import { softDeleteMeeting, updateMeeting } from "@/server/meetings/manage";
import { getActiveProjectForUser } from "@/server/tenant/project-access";

function meetingIdFromUrl(request: Request) {
  return new URL(request.url).pathname.split("/").pop() ?? "";
}

export async function PATCH(request: Request) {
  const auth = await requireApiSession();
  if ("error" in auth) return auth.error;
  if (!canManageMeetings(auth.user)) return forbiddenResponse(errors.meetingManageForbidden);

  const project = await getActiveProjectForUser(auth.user);
  if (!project) return NextResponse.json({ error: errors.noActiveProject }, { status: 404 });

  const id = meetingIdFromUrl(request);
  const body = await request.json().catch(() => ({}));
  const agendas =
    body.agenda_text !== undefined
      ? String(body.agenda_text)
          .split("\n")
          .map((line: string) => line.trim())
          .filter(Boolean)
          .map((title: string, order: number) => ({ title, order }))
      : undefined;

  try {
    const meeting = await updateMeeting(
      id,
      project.id,
      {
        title: body.title !== undefined ? String(body.title) : undefined,
        meeting_at: body.meeting_at ? new Date(String(body.meeting_at)) : undefined,
        notes: body.notes !== undefined ? String(body.notes) : undefined,
        decisions: body.decisions !== undefined ? String(body.decisions) : undefined,
        agendas
      },
      auth.user.id
    );
    await prisma.auditLog.create({
      data: {
        user_id: auth.user.id,
        action: "Update meeting",
        entity_type: "Meeting",
        entity_id: id,
        new_value: JSON.stringify({ title: meeting.title })
      }
    });
    await invalidateProjectCache(project.id);
    return NextResponse.json(meeting);
  } catch (error) {
    const message = error instanceof Error ? error.message : errors.dataInvalid;
    return NextResponse.json({ error: message }, { status: message === errors.meetingNotFound ? 404 : 400 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireApiSession();
  if ("error" in auth) return auth.error;
  if (!canManageMeetings(auth.user)) return forbiddenResponse(errors.meetingManageForbidden);

  const project = await getActiveProjectForUser(auth.user);
  if (!project) return NextResponse.json({ error: errors.noActiveProject }, { status: 404 });

  const id = meetingIdFromUrl(request);
  try {
    await softDeleteMeeting(id, project.id, auth.user.id);
    await prisma.auditLog.create({
      data: { user_id: auth.user.id, action: "Delete meeting", entity_type: "Meeting", entity_id: id }
    });
    await invalidateProjectCache(project.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : errors.dataInvalid;
    return NextResponse.json({ error: message }, { status: message === errors.meetingNotFound ? 404 : 400 });
  }
}
