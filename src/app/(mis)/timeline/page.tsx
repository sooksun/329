import { Badge } from "@/components/ui";
import { TimelineMobileList } from "@/components/timeline-mobile-list";
import { EVENT_329, GANTT_MONTH_LABELS, GANTT_WINDOW, formatThaiEventPeriod, ganttBarStyle } from "@/lib/event-calendar";
import Link from "next/link";
import { CardGrid, PageHeader, PageLink, PageStack, SectionCard } from "@/components/page/page-layout";
import { getTimelinePageData } from "@/server/project/loaders/timeline";

type TimelinePageProps = {
  searchParams?: Promise<{ view?: string }>;
};

export default async function TimelinePage({ searchParams }: TimelinePageProps) {
  const data = await getTimelinePageData();
  if (!data) return null;
  const params = (await searchParams) ?? {};
  const view = params.view === "calendar" ? "calendar" : "gantt";
  const tasks = [...data.tasks].sort((a, b) => a.start_date.getTime() - b.start_date.getTime());

  return (
    <PageStack>
      <PageHeader
        title="กำหนดการและไทม์ไลน์"
        subtitle={`${tasks.length} ภารกิจ · ${formatThaiEventPeriod()} · ${EVENT_329.meaningShort}`}
        actions={
          <>
            <PageLink href="/timeline?view=calendar" active={view === "calendar"}>
              ปฏิทิน
            </PageLink>
            <PageLink href="/timeline?view=gantt" active={view === "gantt"}>
              Gantt
            </PageLink>
            <PageLink href="/reports">รายงาน</PageLink>
          </>
        }
      />

      <SectionCard className="border-l-4 border-l-[#b68a2e] !p-3 sm:!p-4">
        <p className="text-sm font-bold text-[#123f76]">ปฏิทินงาน 329</p>
        <p className="mt-1 text-xs leading-relaxed text-[#667085] sm:text-sm">{EVENT_329.meaningLong}</p>
      </SectionCard>

      <SectionCard>
        <div className="mb-4 flex flex-wrap gap-2">
          <Badge tone="blue">กำลังดำเนินการ</Badge>
          <Badge tone="green">เสร็จสิ้น</Badge>
          <Badge tone="red">ล่าช้า</Badge>
          <Badge tone="gold">งานสำคัญ</Badge>
        </div>

        {view === "calendar" ? (
          <CardGrid cols={3}>
            {tasks.slice(0, 36).map((task) => (
              <Link
                href={`/tasks/detail?id=${task.id}`}
                key={task.id}
                className="rounded-md border p-3 active:bg-[#fbfaf5] hover:border-[#b68a2e] sm:p-4"
              >
                <div className="mb-2 flex justify-between gap-2">
                  <Badge tone={task.status === "DELAYED" ? "red" : task.is_critical ? "gold" : "blue"}>{task.code}</Badge>
                  <span className="text-xs text-[#667085]">{task.due_date.toLocaleDateString("th-TH")}</span>
                </div>
                <h2 className="text-sm font-black leading-snug sm:text-base">{task.title}</h2>
                <p className="text-xs text-[#667085] sm:text-sm">{task.committee.name}</p>
              </Link>
            ))}
          </CardGrid>
        ) : (
          <>
            <TimelineMobileList tasks={tasks} />
            <div className="hidden md:block">
              <div className="gantt-row bg-[#f5f2ea] font-black">
                <span className="p-3">ภารกิจ</span>
                <div className="grid grid-cols-5 text-center text-sm">
                  {GANTT_MONTH_LABELS.map((label) => (
                    <span key={label}>{label}</span>
                  ))}
                </div>
              </div>
              {tasks.slice(0, 32).map((task) => {
                const bar = ganttBarStyle(task.start_date, task.due_date, GANTT_WINDOW.start, GANTT_WINDOW.end);
                return (
                  <Link href={`/tasks/detail?id=${task.id}`} className="gantt-row hover:bg-[#fbfaf5]" key={task.id}>
                    <div className="p-3">
                      <b className="text-sm">{task.title}</b>
                      <p className="text-xs text-[#667085] sm:text-sm">
                        {task.committee.name} · {task.start_date.toLocaleDateString("th-TH")} – {task.due_date.toLocaleDateString("th-TH")}
                      </p>
                    </div>
                    <div className="relative m-2 h-8 rounded bg-[#eeeae0]">
                      <div
                        className="absolute top-1 h-6 rounded"
                        style={{
                          left: bar.left,
                          width: bar.width,
                          background: task.status === "DELAYED" ? "#b91528" : task.is_critical ? "#b68a2e" : "#123f76"
                        }}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </SectionCard>
    </PageStack>
  );
}
