import type { TaskStatus } from "@prisma/client";
import { errors } from "@/lib/messages";
import { prisma } from "@/lib/prisma";

const actionStatuses = new Set<TaskStatus>([
  "NOT_STARTED",
  "IN_PROGRESS",
  "SUBMITTED",
  "REVISION_REQUIRED",
  "VERIFIED",
  "DONE",
  "DELAYED"
]);

export type AgendaInput = { title: string; order?: number };
export type ActionItemInput = {
  decision_title: string;
  description: string;
  owner_name: string;
  due_date: string | Date;
  linked_committee_id?: string | null;
  linked_task_id?: string | null;
  status?: TaskStatus;
};

export async function createMeeting(input: {
  projectId: string;
  title: string;
  meeting_at: Date;
  notes: string;
  decisions: string;
  agendas?: AgendaInput[];
  actionItems?: ActionItemInput[];
  createdById: string;
}) {
  const title = input.title.trim();
  if (!title) throw new Error(errors.meetingTitleRequired);

  const meeting = await prisma.meeting.create({
    data: {
      project_id: input.projectId,
      title,
      meeting_at: input.meeting_at,
      notes: input.notes.trim(),
      decisions: input.decisions.trim(),
      created_by: input.createdById,
      updated_by: input.createdById,
      agendas: {
        create: (input.agendas ?? []).map((a, index) => ({
          title: a.title.trim(),
          order: a.order ?? index
        }))
      }
    },
    include: { agendas: true, actionItems: true }
  });

  if (input.actionItems?.length) {
    for (const item of input.actionItems) {
      await prisma.meetingActionItem.create({
        data: {
          meeting_id: meeting.id,
          decision_title: item.decision_title.trim(),
          description: item.description.trim(),
          owner_name: item.owner_name.trim(),
          due_date: new Date(item.due_date),
          linked_committee_id: item.linked_committee_id || null,
          linked_task_id: item.linked_task_id || null,
          status: item.status && actionStatuses.has(item.status) ? item.status : "NOT_STARTED"
        }
      });
    }
  }

  return prisma.meeting.findUniqueOrThrow({
    where: { id: meeting.id },
    include: { agendas: { orderBy: { order: "asc" } }, actionItems: true }
  });
}

export async function updateMeeting(
  meetingId: string,
  projectId: string,
  data: {
    title?: string;
    meeting_at?: Date;
    notes?: string;
    decisions?: string;
    agendas?: AgendaInput[];
  },
  updatedById: string
) {
  const existing = await prisma.meeting.findFirst({
    where: { id: meetingId, project_id: projectId, deleted_at: null }
  });
  if (!existing) throw new Error(errors.meetingNotFound);

  if (data.agendas) {
    await prisma.meetingAgenda.deleteMany({ where: { meeting_id: meetingId } });
    await prisma.meetingAgenda.createMany({
      data: data.agendas.map((a, index) => ({
        meeting_id: meetingId,
        title: a.title.trim(),
        order: a.order ?? index
      }))
    });
  }

  await prisma.meeting.update({
    where: { id: meetingId },
    data: {
      title: data.title !== undefined ? data.title.trim() : existing.title,
      meeting_at: data.meeting_at ?? existing.meeting_at,
      notes: data.notes !== undefined ? data.notes.trim() : existing.notes,
      decisions: data.decisions !== undefined ? data.decisions.trim() : existing.decisions,
      updated_by: updatedById
    }
  });

  return prisma.meeting.findUniqueOrThrow({
    where: { id: meetingId },
    include: { agendas: { orderBy: { order: "asc" } }, actionItems: true }
  });
}

export async function softDeleteMeeting(meetingId: string, projectId: string, updatedById: string) {
  const existing = await prisma.meeting.findFirst({ where: { id: meetingId, project_id: projectId, deleted_at: null } });
  if (!existing) throw new Error(errors.meetingNotFound);
  return prisma.meeting.update({
    where: { id: meetingId },
    data: { deleted_at: new Date(), updated_by: updatedById }
  });
}

export async function addMeetingActionItem(meetingId: string, projectId: string, item: ActionItemInput) {
  const meeting = await prisma.meeting.findFirst({ where: { id: meetingId, project_id: projectId, deleted_at: null } });
  if (!meeting) throw new Error(errors.meetingNotFound);
  return prisma.meetingActionItem.create({
    data: {
      meeting_id: meetingId,
      decision_title: item.decision_title.trim(),
      description: item.description.trim(),
      owner_name: item.owner_name.trim(),
      due_date: new Date(item.due_date),
      linked_committee_id: item.linked_committee_id || null,
      linked_task_id: item.linked_task_id || null,
      status: item.status && actionStatuses.has(item.status) ? item.status : "NOT_STARTED"
    }
  });
}

export async function deleteMeetingActionItem(itemId: string, meetingId: string) {
  const row = await prisma.meetingActionItem.findFirst({ where: { id: itemId, meeting_id: meetingId } });
  if (!row) throw new Error("ไม่พบ Action item");
  await prisma.meetingActionItem.delete({ where: { id: itemId } });
}
