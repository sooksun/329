import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge, Card, ProgressBar } from "@/components/ui";
import { TaskDetailActions } from "@/components/task-detail-actions";
import { linkButtonClasses } from "@/lib/button-styles";
import { thaiStatus } from "@/lib/utils";

type TaskDetailLayoutProps = {
  task: {
    id: string;
    code: string;
    title: string;
    status: string;
    priority: string;
    committeeName: string;
    ownerName: string | null;
    reviewerName: string | null;
    dueLabel: string;
    createdByLabel: string;
    updatedByLabel: string;
    reported_progress: number;
    verified_progress: number;
    evidence_progress: number;
    success_criteria: string;
    budgetCount: number;
    riskCount: number;
  };
  canEdit: boolean;
  canClose: boolean;
  doneBlockers?: string[];
  children: React.ReactNode;
};

export function TaskDetailLayout({ task, canEdit, canClose, doneBlockers = [], children }: TaskDetailLayoutProps) {
  return (
    <div className="pb-24 md:pb-0">
      <Link
        href="/tasks"
        className={`${linkButtonClasses("ghost")} mb-1 inline-flex min-h-[44px] items-center gap-2 px-2 md:hidden`}
      >
        <ArrowLeft size={18} />
        กลับบอร์ดภารกิจ
      </Link>

      <Card className="overflow-hidden p-4 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap gap-1.5">
              <Badge tone="blue">{task.committeeName}</Badge>
              <Badge tone="red">ความสำคัญ {task.priority}</Badge>
              <Badge>{task.code}</Badge>
              <Badge tone="gold">{thaiStatus(task.status)}</Badge>
            </div>
            <h1 className="text-xl font-black leading-tight text-[#101827] sm:text-2xl lg:text-3xl">{task.title}</h1>
            <p className="mt-2 text-sm text-[#667085]">
              ผู้รับผิดชอบ: <b className="text-[#101827]">{task.ownerName ?? "ยังไม่ระบุ"}</b>
              <span className="mx-2 text-[#d0d5dd]">·</span>
              ผู้ตรวจ: <b className="text-[#101827]">{task.reviewerName ?? "ยังไม่ระบุ"}</b>
              <span className="mx-2 text-[#d0d5dd]">·</span>
              กำหนดส่ง: <b className="text-[#101827]">{task.dueLabel}</b>
            </p>
            <p className="mt-2 text-xs leading-relaxed text-[#667085] sm:text-sm">
              สร้างโดย: {task.createdByLabel} · แก้ไขล่าสุด: {task.updatedByLabel}
            </p>
          </div>
          <div className="hidden shrink-0 md:block">
            <TaskDetailActions
              canClose={canClose}
              canEdit={canEdit}
              doneBlockers={doneBlockers}
              task={{
                id: task.id,
                title: task.title,
                status: task.status,
                reported_progress: task.reported_progress,
                verified_progress: task.verified_progress
              }}
            />
          </div>
        </div>

        {/* Mobile workflow strip */}
        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[#e7e2d7] pt-4 md:hidden">
          <div className="rounded-md bg-[#fbfaf5] p-2 text-center">
            <div className="text-[10px] font-bold text-[#667085]">รายงาน</div>
            <div className="text-lg font-black text-[#8a641e]">{task.reported_progress}%</div>
          </div>
          <div className="rounded-md bg-[#fbfaf5] p-2 text-center">
            <div className="text-[10px] font-bold text-[#667085]">หลักฐาน</div>
            <div className="text-lg font-black text-[#123f76]">{task.evidence_progress}%</div>
          </div>
          <div className="rounded-md bg-[#fbfaf5] p-2 text-center">
            <div className="text-[10px] font-bold text-[#667085]">ตรวจแล้ว</div>
            <div className="text-lg font-black text-[#107c41]">{task.verified_progress}%</div>
          </div>
        </div>
      </Card>

      <div className="mt-4 grid gap-4 lg:mt-5 lg:grid-cols-[minmax(0,1fr)_min(100%,320px)] xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-4 lg:space-y-5">{children}</div>

        <aside className="space-y-4 lg:space-y-5">
          <Card className="p-4 sm:p-5">
            <h2 className="font-black">สถานะ Workflow</h2>
            <div className="mt-3 space-y-3">
              <div>
                <div className="mb-1 flex justify-between text-sm">
                  <span>Reported</span>
                  <b>{task.reported_progress}%</b>
                </div>
                <ProgressBar value={task.reported_progress} color="#b68a2e" />
              </div>
              <div>
                <div className="mb-1 flex justify-between text-sm">
                  <span>Evidence</span>
                  <b>{task.evidence_progress}%</b>
                </div>
                <ProgressBar value={task.evidence_progress} />
              </div>
              <div>
                <div className="mb-1 flex justify-between text-sm">
                  <span>Verified</span>
                  <b>{task.verified_progress}%</b>
                </div>
                <ProgressBar value={task.verified_progress} />
              </div>
            </div>
          </Card>
          <Card className="p-4 sm:p-5">
            <h2 className="mb-2 font-black">กฎการปิดงาน</h2>
            <p className="text-sm leading-relaxed text-[#667085]">
              ปิดเป็น Done ได้เมื่อหลักฐานที่บังคับอนุมัติแล้ว มีผู้ตรวจสอบ และ Verified progress = 100%
            </p>
          </Card>
          <Card className="p-4 sm:p-5">
            <h2 className="mb-2 font-black">งบ / ความเสี่ยง</h2>
            <p className="text-sm text-[#667085]">
              งบ {task.budgetCount} รายการ · ความเสี่ยง {task.riskCount} รายการ
            </p>
          </Card>
        </aside>
      </div>

      <TaskDetailActions
        canClose={canClose}
        canEdit={canEdit}
        doneBlockers={doneBlockers}
        mobileSticky
        task={{
          id: task.id,
          title: task.title,
          status: task.status,
          reported_progress: task.reported_progress,
          verified_progress: task.verified_progress
        }}
      />
    </div>
  );
}
