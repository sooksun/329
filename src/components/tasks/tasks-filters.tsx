import Link from "next/link";
import { linkButtonClasses } from "@/lib/button-styles";
import type { TaskBoardFilters } from "@/types/task-board";

function filterHref(key: string, value?: string, current?: TaskBoardFilters) {
  const params = new URLSearchParams();
  if (current?.search) params.set("search", current.search);
  if (current?.committee && key !== "committee") params.set("committee", current.committee);
  if (current?.priority && key !== "priority") params.set("priority", current.priority);
  if (current?.status && key !== "status") params.set("status", current.status);
  if (value) params.set(key, value);
  return `/tasks${params.toString() ? `?${params.toString()}` : ""}`;
}

export function TasksFilters({
  committees,
  filters
}: {
  committees: Array<{ id: string; name: string }>;
  filters: TaskBoardFilters;
}) {
  const allActive = !filters.committee && !filters.priority && !filters.status;

  return (
    <div className="space-y-3">
      <div className="-mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
        <Link
          href={filters.search ? `/tasks?search=${encodeURIComponent(filters.search)}` : "/tasks"}
          className={linkButtonClasses(allActive ? "gold" : "default", "shrink-0 snap-start whitespace-nowrap")}
        >
          ทั้งหมด
        </Link>
        {committees.slice(0, 10).map((committee) => (
          <Link
            key={committee.id}
            href={filterHref("committee", committee.id, filters)}
            className={linkButtonClasses(
              filters.committee === committee.id ? "gold" : "default",
              "max-w-[11rem] shrink-0 snap-start truncate whitespace-nowrap"
            )}
            title={committee.name}
          >
            {committee.name}
          </Link>
        ))}
        {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map((priority) => (
          <Link
            key={priority}
            href={filterHref("priority", priority, filters)}
            className={linkButtonClasses(
              filters.priority === priority ? "gold" : "default",
              "shrink-0 snap-start whitespace-nowrap"
            )}
          >
            {priority}
          </Link>
        ))}
      </div>
    </div>
  );
}
