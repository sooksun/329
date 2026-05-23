import { prisma } from "@/lib/prisma";

export async function listMeetings(projectId: string) {
  return prisma.meeting.findMany({
    where: { project_id: projectId, deleted_at: null },
    include: { agendas: true, actionItems: true },
    orderBy: { meeting_at: "desc" }
  });
}
