import { FileSliders } from "lucide-react";
import Link from "next/link";
import { ReportGenerateButton } from "@/components/report-actions";
import { Badge } from "@/components/ui";
import { PageHeader, PageStack, SectionCard, SplitLayout } from "@/components/page/page-layout";
import { linkButtonClasses } from "@/lib/button-styles";
import { formatThaiDateTime, thaiReportType } from "@/lib/utils";
import { getReportsPageData } from "@/server/project/loaders/reports";

export default async function ReportsPage() {
  const data = await getReportsPageData();
  if (!data) return null;
  const snapshot = data.snapshots[0];

  return (
    <PageStack>
      <PageHeader
        title="รายงาน PowerPoint"
        subtitle="สร้างจาก Dashboard Snapshot เท่านั้น"
        actions={<ReportGenerateButton snapshotId={snapshot?.id} />}
      />

      <SplitLayout
        asideFirstOnMobile
        main={
          <div className="space-y-4">
            <SectionCard className="aspect-[16/10] bg-[#123f76] p-5 text-white sm:aspect-[16/9] sm:p-8">
              <div className="flex h-full min-h-[200px] flex-col justify-between">
                <div>
                  <Badge tone="gold">ตัวอย่างสไลด์</Badge>
                  <h2 className="mt-4 text-2xl font-black sm:mt-8 sm:text-4xl">329 Yunnan Sports MIS</h2>
                  <p className="mt-2 text-base sm:text-xl">รายงานผู้บริหารจาก Snapshot</p>
                </div>
                <p className="text-sm text-blue-100">{snapshot?.title ?? "ยังไม่มี Snapshot"}</p>
              </div>
            </SectionCard>

            <SectionCard
              title={
                <span className="flex items-center gap-2">
                  <FileSliders size={18} /> ประวัติรายงาน
                </span>
              }
            >
              <div className="space-y-3">
                {data.reports.map((report) => (
                  <div className="rounded-md border p-3" key={report.id}>
                    <b className="text-sm sm:text-base">{report.title}</b>
                    <p className="text-xs text-[#667085] sm:text-sm">
                      {thaiReportType(report.type)} · {formatThaiDateTime(report.created_at)}
                    </p>
                    <Link
                      href={`/api/reports/${report.id}/download`}
                      className={linkButtonClasses("ghost", "mt-2 w-full justify-center sm:w-auto")}
                    >
                      ดาวน์โหลด PowerPoint
                    </Link>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        }
        aside={
          <SectionCard title="ตัวเลือกรายงาน">
            <label className="block text-sm font-bold">ประเภท</label>
            <select className="mb-4 mt-1 h-11 w-full rounded-md border px-3" defaultValue="EXECUTIVE_SUMMARY">
              <option value="EXECUTIVE_SUMMARY">สรุปผู้บริหาร</option>
              <option value="COMMITTEE_PROGRESS">ความก้าวหน้าคณะกรรมการ</option>
              <option value="BUDGET_REPORT">รายงานงบประมาณ</option>
              <option value="FINAL_EVENT_REPORT">รายงานหลังจัดงาน</option>
            </select>
            <label className="block text-sm font-bold">Snapshot</label>
            <select className="mb-4 mt-1 h-11 w-full rounded-md border px-3" defaultValue={snapshot?.id}>
              {data.snapshots.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
            <div className="max-h-48 space-y-2 overflow-y-auto text-sm">
              {[
                "หน้าปก",
                "ภาพรวมโครงการ",
                "แดชบอร์ดภาพรวม",
                "ความก้าวหน้าตามคณะ",
                "งานล่าช้า",
                "ไทม์ไลน์",
                "สรุปงบประมาณ",
                "เมทริกซ์ความเสี่ยง",
                "แกลเลอรีหลักฐาน",
                "ประเด็นที่ต้องตัดสินใจ",
                "7 วันข้างหน้า",
                "สรุปท้ายรายงาน"
              ].map((section) => (
                <label key={section} className="flex min-h-[36px] items-center gap-2">
                  <input type="checkbox" defaultChecked className="h-4 w-4" />
                  {section}
                </label>
              ))}
            </div>
          </SectionCard>
        }
      />
    </PageStack>
  );
}
