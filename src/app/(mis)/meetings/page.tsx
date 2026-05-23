import Link from "next/link";
import { getServerSession } from "next-auth";
import { DashboardActions } from "@/components/dashboard-actions";
import { MeetingManager } from "@/components/meeting-manager";
import { Badge, Card } from "@/components/ui";
import { authOptions } from "@/lib/auth";
import { PageHeader, PageStack, SectionCard, SplitLayout } from "@/components/page/page-layout";
import { getSessionUser } from "@/server/auth/session";
import { getMeetingsPageData } from "@/server/project/loaders/meetings";
import { canManageMeetings } from "@/server/meetings/access";
import { thaiStatus } from "@/lib/utils";
import { linkButtonClasses } from "@/lib/button-styles";

export default async function MeetingsPage() {
  const data = await getMeetingsPageData();
  if (!data) return null;

  const session = await getServerSession(authOptions);
  const user = getSessionUser(session);
  const canManage = user ? canManageMeetings(user) : false;

  const actionItems = data.meetings.flatMap((meeting) => meeting.actionItems);

  return (
    <PageStack>
      <PageHeader
        title="การประชุม"
        subtitle="วาระ มติ Action items และ Snapshot"
        actions={<DashboardActions latestSnapshotId={data.snapshots[0]?.id} />}
      />

      <MeetingManager
        canManage={canManage}
        tasks={data.tasks.map((t) => ({ id: t.id, code: t.code, title: t.title }))}
        meetings={data.meetings.map((meeting) => ({
          id: meeting.id,
          title: meeting.title,
          meeting_at: meeting.meeting_at.toISOString(),
          notes: meeting.notes,
          decisions: meeting.decisions,
          agendas: meeting.agendas.map((a) => ({ id: a.id, title: a.title, order: a.order })),
          actionItems: meeting.actionItems.map((item) => ({
            id: item.id,
            decision_title: item.decision_title,
            description: item.description,
            owner_name: item.owner_name,
            due_date: item.due_date.toISOString(),
            status: item.status,
            linked_task_id: item.linked_task_id
          }))
        }))}
      />

      <SplitLayout
        main={
          <div className="space-y-4">
            {data.meetings.map((meeting) => (
              <Card className="p-4 sm:p-5" key={meeting.id}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="text-lg font-black leading-snug sm:text-xl">{meeting.title}</h2>
                    <p className="mt-2 text-sm text-[#667085]">{meeting.notes}</p>
                  </div>
                  <span className="shrink-0 self-start">
                    <Badge tone="gold">{meeting.meeting_at.toLocaleDateString("th-TH")}</Badge>
                  </span>
                </div>
                <h3 className="mt-4 text-sm font-black">วาระ</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {meeting.agendas.map((agenda) => (
                    <Badge tone="blue" key={agenda.id}>
                      {agenda.title}
                    </Badge>
                  ))}
                </div>
                <h3 className="mt-4 text-sm font-black">มติ</h3>
                <p className="text-sm leading-relaxed">{meeting.decisions}</p>
              </Card>
            ))}
          </div>
        }
        aside={
          <SectionCard title="Action Items">
            <div className="space-y-3">
              {actionItems.map((item) => (
                <div className="rounded-md border p-3" key={item.id}>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <b className="text-sm leading-snug">{item.decision_title}</b>
                    <Badge>{thaiStatus(item.status)}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-[#667085]">
                    {item.owner_name} · {item.due_date.toLocaleDateString("th-TH")}
                  </p>
                  <p className="mt-2 text-sm">{item.description}</p>
                  <Link
                    href={item.linked_task_id ? `/tasks/detail?id=${item.linked_task_id}` : "/tasks"}
                    className={linkButtonClasses("gold", "mt-3 w-full justify-center")}
                  >
                    {item.linked_task_id ? "เปิดงานที่เกี่ยวข้อง" : "เปิดบอร์ดภารกิจ"}
                  </Link>
                </div>
              ))}
            </div>
          </SectionCard>
        }
      />
    </PageStack>
  );
}
