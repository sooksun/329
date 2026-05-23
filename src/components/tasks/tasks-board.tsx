"use client";

import Link from "next/link";
import { useMemo } from "react";
import { TaskCard } from "@/components/tasks/task-card";
import { linkButtonClasses } from "@/lib/button-styles";
import { thaiStatus } from "@/lib/utils";
import { TASK_BOARD_STATUSES, type TaskBoardFilters, type TaskBoardItem } from "@/types/task-board";

function filterHref(key: string, value?: string, current?: TaskBoardFilters) {
  const params = new URLSearchParams();
  if (current?.search) params.set("search", current.search);
  if (current?.committee) params.set("committee", current.committee);
  if (current?.priority) params.set("priority", current.priority);
  if (key !== "status" && current?.status) params.set("status", current.status);
  if (value) params.set(key, value);
  return `/tasks${params.toString() ? `?${params.toString()}` : ""}`;
}

function statusTone(status: string) {
  if (status === "DELAYED") return "text-[#b91528]";
  if (status === "DONE" || status === "VERIFIED") return "text-[#107c41]";
  return "text-[#101827]";
}

export function TasksBoard({
  tasks,
  filters,
  firstTaskId
}: {
  tasks: TaskBoardItem[];
  filters: TaskBoardFilters;
  firstTaskId?: string;
}) {
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const status of TASK_BOARD_STATUSES) map.set(status, 0);
    for (const task of tasks) map.set(task.status, (map.get(task.status) ?? 0) + 1);
    return map;
  }, [tasks]);

  const mobileStatus =
    filters.status && (TASK_BOARD_STATUSES as readonly string[]).includes(filters.status) ? filters.status : null;

  const mobileTasks = mobileStatus ? tasks.filter((task) => task.status === mobileStatus) : tasks;

  return (
    <>
      {/* Mobile / tablet: status tabs + list */}
      <div className="lg:hidden">
        <div className="sticky top-0 z-10 -mx-1 border-b border-[#e7e2d7] bg-[#fbfaf5]/95 px-1 pb-2 pt-1 backdrop-blur">
          <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto [scrollbar-width:thin]">
            <Link
              href={filterHref("status", undefined, { ...filters, status: undefined })}
              className={`shrink-0 snap-start rounded-full px-3 py-2 text-xs font-black transition ${
                !mobileStatus ? "bg-[#123f76] text-white" : "bg-[#f0eee7] text-[#475467]"
              }`}
            >
              ทั้งหมด ({tasks.length})
            </Link>
            {TASK_BOARD_STATUSES.map((status) => {
              const count = counts.get(status) ?? 0;
              if (!count && mobileStatus !== status) return null;
              const active = mobileStatus === status;
              return (
                <Link
                  key={status}
                  href={filterHref("status", status, filters)}
                  className={`shrink-0 snap-start rounded-full px-3 py-2 text-xs font-black transition ${
                    active ? "bg-[#123f76] text-white" : "bg-[#f0eee7] text-[#475467]"
                  }`}
                >
                  {thaiStatus(status)} ({count})
                </Link>
              );
            })}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {mobileTasks.length === 0 ? (
            <p className="rounded-md border border-dashed border-[#e7e2d7] bg-white px-4 py-8 text-center text-sm text-[#667085]">
              ไม่มีภารกิจในตัวกรองนี้
            </p>
          ) : (
            mobileTasks.map((task) => <TaskCard key={task.id} task={task} />)
          )}
        </div>
      </div>

      {/* Desktop: Kanban */}
      <div className="hidden gap-3 lg:grid lg:grid-cols-4 xl:grid-cols-7">
        {TASK_BOARD_STATUSES.map((status) => {
          const columnTasks = tasks.filter((task) => task.status === status).slice(0, 12);
          return (
            <section key={status} className="min-w-0">
              <Link
                href={filterHref("status", status, filters)}
                className="mb-3 flex min-h-[44px] items-center justify-between rounded-md bg-[#f0eee7] px-3 py-2 font-black hover:bg-[#e7e2d7]"
              >
                <span className={statusTone(status)}>{thaiStatus(status)}</span>
                <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs">{columnTasks.length}</span>
              </Link>
              <div className="space-y-3">
                {columnTasks.map((task) => (
                  <TaskCard key={task.id} task={task} compact />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {firstTaskId ? (
        <p className="text-center text-xs text-[#98a2b3] lg:hidden">
          <Link href={`/tasks/detail?id=${firstTaskId}`} className="font-bold text-[#123f76] underline-offset-2 hover:underline">
            เปิดรายละเอียดงานแรก
          </Link>
        </p>
      ) : null}
    </>
  );
}
