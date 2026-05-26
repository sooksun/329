import Link from "next/link";
import { Badge, Card, ProgressBar } from "@/components/ui";
import type { TaskBoardItem } from "@/types/task-board";
import { formatThaiDateShort } from "@/lib/utils";

function priorityTone(priority: string): "red" | "gold" {
  return priority === "CRITICAL" || priority === "HIGH" ? "red" : "gold";
}

export function TaskCard({ task, compact = false }: { task: TaskBoardItem; compact?: boolean }) {
  const due = new Date(task.dueDateIso);

  return (
    <Link href={`/tasks/detail?id=${task.id}`} className="block min-h-[44px] active:opacity-90">
      <Card
        className={`transition hover:border-[#b68a2e] hover:shadow-sm ${compact ? "p-3" : "p-4 sm:p-3"}`}
      >
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className="max-w-[65%] truncate">
            <Badge tone="blue">{task.committeeName}</Badge>
          </span>
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wide text-[#98a2b3]">{task.code}</span>
            <Badge tone={priorityTone(task.priority)}>{task.priority}</Badge>
          </div>
        </div>
        <h3 className={`font-black leading-snug text-[#101827] ${compact ? "text-sm" : "text-base"}`}>{task.title}</h3>
        <p className="mt-1.5 text-xs text-[#667085]">
          {task.ownerName ?? "ยังไม่ระบุ"} · กำหนด {formatThaiDateShort(due)}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[#475467]">
          <span>รายงาน {task.reported_progress}%</span>
          <span>ตรวจ {task.verified_progress}%</span>
        </div>
        <ProgressBar value={task.verified_progress} />
        <div className="mt-3 flex flex-wrap gap-1">
          <Badge tone={task.evidenceCount ? "green" : "red"}>{task.evidenceCount ? "มีหลักฐาน" : "ไม่มีหลักฐาน"}</Badge>
          {task.hasBudget ? <Badge tone="gold">งบ</Badge> : null}
          {task.hasRisk ? <Badge tone="red">เสี่ยง</Badge> : null}
        </div>
      </Card>
    </Link>
  );
}
