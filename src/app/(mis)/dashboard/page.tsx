import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Badge, Card, ProgressBar } from "@/components/ui";
import { BudgetChart } from "@/components/budget-chart";
import { DashboardActions } from "@/components/dashboard-actions";
import {
  ChartBox,
  MetricGrid,
  MetricTile,
  PageHeader,
  PageStack,
  SectionCard,
  SplitLayout
} from "@/components/page/page-layout";
import { linkButtonClasses } from "@/lib/button-styles";
import { getDashboardPageData } from "@/server/project/loaders/dashboard";
import { formatThaiEventPeriod, EVENT_329 } from "@/lib/event-calendar";
import { formatBaht, formatThaiDate } from "@/lib/utils";

export default async function DashboardPage() {
  const data = await getDashboardPageData();
  if (!data) return null;

  const kpis = [
    ["ภารกิจทั้งหมด", data.summary.totalTasks, "จำนวนงานในโปรเจกต์"],
    ["งานเสร็จสิ้น", data.summary.completedTasks, "สถานะ DONE"],
    ["งานล่าช้า", data.summary.delayedTasks, "ต้องเร่งรัด"],
    ["ความเสี่ยงวิกฤต/สูง", data.summary.criticalRisks, "ระดับวิกฤตและสูง"],
    ["แผนงบประมาณ", formatBaht(data.summary.budget.planned), "ตามแผน"],
    ["ใช้จริง", formatBaht(data.summary.budget.actual), "ยอดจ่าย/ผูกพัน"],
    ["งบคงเหลือ", formatBaht(data.summary.budget.planned - data.summary.budget.actual), "ตามแผน"],
    ["หลักฐานอนุมัติ", `${data.summary.evidenceCoverage}%`, "ครอบคลุมงาน"],
    ["งาน 7 วันข้างหน้า", data.summary.next7DaysTasks.length, "ใกล้ถึงกำหนด"]
  ] as const;

  const chartData = data.committeeStats.slice(2, 9).map((committee) => ({
    name: committee.name.replace("และ", ""),
    planned: Math.round(committee.budgetPlanned / 1000),
    actual: Math.round(committee.budgetUsed / 1000)
  }));

  return (
    <PageStack>
      <PageHeader
        title="ภาพรวมโครงการ"
        subtitle={
          <>
            {data.project.edition} · {formatThaiEventPeriod(data.project.event_date, data.project.event_end_date ?? EVENT_329.end)} · อัปเดต{" "}
            {new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} น.
          </>
        }
        actions={<DashboardActions latestSnapshotId={data.snapshots[0]?.id} />}
      />

      <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <Card className="grid gap-4 p-4 sm:gap-6 sm:p-6 md:grid-cols-[minmax(120px,200px)_1fr]">
          <div className="mx-auto grid aspect-square w-full max-w-[200px] place-items-center rounded-full border-[12px] border-[#e8e7df] sm:border-[16px]" style={{ borderTopColor: "#123f76", borderRightColor: "#123f76" }}>
            <div className="text-center">
              <div className="text-3xl font-black sm:text-4xl">{data.summary.overall}%</div>
              <div className="text-xs text-[#667085] sm:text-sm">ตรวจแล้ว</div>
            </div>
          </div>
          <div className="min-w-0 self-center">
            <div className="mb-2 flex flex-wrap gap-2">
              <Badge tone="blue">Verified</Badge>
              <Badge>Reported</Badge>
            </div>
            <p className="text-sm text-[#667085]">ความก้าวหน้าโดยรวมของโครงการ</p>
            <div className="mt-2 flex flex-wrap items-end gap-2 sm:gap-3">
              <span className="text-4xl font-black text-[#123f76] sm:text-5xl">{data.summary.overall}%</span>
              <span className="text-sm">
                รายงาน <b>{data.summary.reported}%</b>
              </span>
            </div>
            <div className="mt-3 max-w-lg">
              <ProgressBar value={data.summary.overall} />
            </div>
            <p className="mt-2 text-xs text-[#667085] sm:text-sm">
              รอตรวจ <b>{data.summary.reported - data.summary.overall}%</b> · ล่าช้า{" "}
              <b className="text-[#b68a2e]">{data.summary.delayedTasks} งาน</b>
            </p>
          </div>
        </Card>

        <div className="grid gap-3">
          <Card className="bg-[#123f76] p-4 text-white sm:p-5">
            <p className="text-sm text-blue-100">นับถอยหลังถึงวันเปิดงาน (29 มี.ค.)</p>
            <div className="mt-1 text-3xl font-black sm:text-4xl">{data.summary.daysRemaining} วัน</div>
            <p className="text-xs text-blue-100 sm:text-sm">
              {formatThaiEventPeriod(data.project.event_date, data.project.event_end_date ?? EVENT_329.end)}
            </p>
          </Card>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <Card className="border-l-4 border-l-[#b91528] p-3 sm:p-4">
              <p className="text-xs text-[#667085] sm:text-sm">งานล่าช้า</p>
              <b className="text-3xl sm:text-4xl">{data.summary.delayedTasks}</b>
            </Card>
            <Card className="p-3 sm:p-4">
              <p className="text-xs text-[#667085] sm:text-sm">ความเสี่ยงสูง</p>
              <b className="text-3xl sm:text-4xl">{data.summary.criticalRisks}</b>
            </Card>
          </div>
        </div>
      </section>

      <MetricGrid columns="responsive">
        {kpis.map(([label, value, note]) => (
          <MetricTile key={label} label={label} value={value} note={note} />
        ))}
      </MetricGrid>

      <SplitLayout
        main={
          <SectionCard
            title="ความก้าวหน้าตามคณะอนุกรรมการ"
            action={
              <Link href="/committees" className={linkButtonClasses("ghost", "w-full justify-center sm:w-auto")}>
                ดูทั้งหมด
              </Link>
            }
          >
            <div className="space-y-4">
              {data.committeeStats.slice(2).map((committee) => (
                <div key={committee.id} className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="min-w-0">
                    <div className="flex justify-between gap-2 text-sm font-bold">
                      <span className="truncate">{committee.name}</span>
                      <span className="shrink-0">{committee.progress}%</span>
                    </div>
                    <ProgressBar value={committee.progress} color={committee.delayedTasks ? "#b91528" : "#123f76"} />
                  </div>
                  <div className="flex gap-1 sm:flex-col sm:items-end">
                    <Badge tone={committee.delayedTasks ? "red" : "green"}>ล่าช้า {committee.delayedTasks}</Badge>
                    <Badge tone="gold">หลักฐานขาด {committee.missingEvidence}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        }
        aside={
          <SectionCard title="ภารกิจ 7 วันข้างหน้า">
            <div className="space-y-3">
              {data.summary.next7DaysTasks.map((task) => (
                <Link
                  href={`/tasks/detail?id=${task.id}`}
                  key={task.id}
                  className="block rounded-md border border-[#e7e2d7] p-3 active:bg-[#fbfaf5] hover:border-[#b68a2e]"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <b className="text-sm leading-snug sm:text-base">{task.title}</b>
                    <Badge tone={task.priority === "CRITICAL" ? "red" : "gold"}>
                      {task.priority === "CRITICAL" ? "สำคัญ" : "ปกติ"}
                    </Badge>
                  </div>
                  <p className="text-xs text-[#667085] sm:text-sm">
                    {task.owner?.name} · {formatThaiDate(task.due_date)}
                  </p>
                </Link>
              ))}
            </div>
          </SectionCard>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-5">
        <SectionCard title="งบประมาณรายฝ่าย">
          <ChartBox>
            <BudgetChart data={chartData} />
          </ChartBox>
        </SectionCard>
        <SectionCard title="ความเสี่ยงต้องตัดสินใจ">
          <div className="space-y-3">
            {data.risks.slice(0, 4).map((risk) => (
              <div className="flex gap-3 rounded-md border p-3" key={risk.id}>
                <AlertTriangle className="shrink-0 text-[#b91528]" size={20} />
                <div className="min-w-0 flex-1">
                  <b className="text-sm sm:text-base">{risk.title}</b>
                  <p className="text-xs text-[#667085] sm:text-sm">
                    {risk.code} · {risk.owner_initials}
                  </p>
                </div>
                <Badge tone="red">{risk.score}</Badge>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </PageStack>
  );
}
