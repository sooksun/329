import { TasksExportActions, TaskExportDownloadButton } from "@/components/tasks-export-actions";
import { MetricGrid, MetricTile, PageHeader, PageLink, PageStack, SectionCard } from "@/components/page/page-layout";
import { TASK_EXPORT_HEADERS } from "@/lib/task-export";
import { getTaskExportPageData } from "@/server/project/loaders/task-export";

type TaskExportPageProps = {
  searchParams?: Promise<{ committee?: string }>;
};

export default async function TaskExportPage({ searchParams }: TaskExportPageProps) {
  const params = (await searchParams) ?? {};
  const committeeId = params.committee?.trim() || undefined;
  const data = await getTaskExportPageData(committeeId);
  if (!data) return null;

  const previewRows = data.rows.slice(0, 40);

  return (
    <PageStack>
      <PageHeader
        title="ส่งออกภารกิจและงานย่อย"
        subtitle={`${data.project.name} · ${data.summary.taskCount} ภารกิจ · ${data.summary.subtaskCount} งานย่อย · ${data.summary.rowCount} แถวในไฟล์`}
        actions={
          <>
            <PageLink href="/tasks">กลับบอร์ดภารกิจ</PageLink>
            <TasksExportActions committeeId={data.selectedCommitteeId} />
          </>
        }
      />

      <MetricGrid columns="responsive">
        <MetricTile label="ภารกิจ" value={data.summary.taskCount} note="ตามสิทธิ์ที่เห็น" />
        <MetricTile label="งานย่อย" value={data.summary.subtaskCount} note="รวมทุกภารกิจ" />
        <MetricTile label="แถวส่งออก" value={data.summary.rowCount} note="1 แถวต่อ 1 งานย่อย" />
      </MetricGrid>

      <SectionCard title="ตัวกรองคณะ">
        <div className="flex flex-wrap gap-2">
          <PageLink href="/tasks/export" active={!committeeId}>
            ทุกคณะ
          </PageLink>
          {data.committees.map((committee) => (
            <PageLink key={committee.id} href={`/tasks/export?committee=${committee.id}`} active={committeeId === committee.id}>
              {committee.name}
            </PageLink>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="คอลัมน์ในไฟล์ส่งออก">
        <ul className="grid gap-2 text-sm text-[#475467] sm:grid-cols-2">
          {TASK_EXPORT_HEADERS.map((header) => (
            <li key={header.key}>
              <b className="text-[#101827]">{header.label}</b>
              <span className="text-[#667085]"> ({header.key})</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs leading-relaxed text-[#667085]">
          งานย่อยใช้ฟิลด์ <b>notes</b> เป็นรายละเอียด (description) — เกณฑ์ความสำเร็จของงานย่อยยังว่างในระบบ จึงส่งออกเป็นค่าว่าง
          ภารกิจที่ไม่มีงานย่อยจะมี 1 แถวโดยคอลัมน์งานย่อยว่าง
        </p>
      </SectionCard>

      <SectionCard
        title="ตัวอย่างข้อมูล (40 แถวแรก)"
        action={
          <TaskExportDownloadButton
            format="csv"
            committeeId={data.selectedCommitteeId}
            variant="ghost"
            label="ดาวน์โหลด CSV ทั้งหมด"
            className="w-full sm:w-auto"
          />
        }
      >
        <div className="mis-table-scroll -mx-1 px-1">
          <table className="w-full min-w-[960px] text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b text-[#667085]">
                {TASK_EXPORT_HEADERS.map((header) => (
                  <th key={header.key} className="px-2 py-2 font-bold">
                    {header.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row, index) => (
                <tr key={`${row.task_code}-${index}`} className="border-b border-[#f0ebe0] align-top">
                  {TASK_EXPORT_HEADERS.map((header) => (
                    <td key={header.key} className="max-w-[220px] px-2 py-2 whitespace-pre-wrap break-words">
                      {row[header.key] || "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!previewRows.length ? <p className="text-sm text-[#667085]">ไม่มีข้อมูลตามตัวกรองนี้</p> : null}
        {data.rows.length > previewRows.length ? (
          <p className="mt-3 text-xs text-[#667085]">แสดง {previewRows.length} จาก {data.rows.length} แถว — ดาวน์โหลดไฟล์เพื่อดูทั้งหมด</p>
        ) : null}
      </SectionCard>
    </PageStack>
  );
}
