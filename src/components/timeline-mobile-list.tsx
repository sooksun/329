import Link from "next/link";
import { Badge } from "@/components/ui";
import { ganttBarStyle, GANTT_WINDOW } from "@/lib/event-calendar";

type TimelineTask = {
  id: string;
  code: string;
  title: string;
  status: string;
  is_critical: boolean;
  committee: { name: string };
  start_date: Date;
  due_date: Date;
};

export function TimelineMobileList({ tasks }: { tasks: TimelineTask[] }) {
  return (
    <div className="space-y-3 md:hidden">
      {tasks.slice(0, 32).map((task) => {
        const bar = ganttBarStyle(task.start_date, task.due_date, GANTT_WINDOW.start, GANTT_WINDOW.end);
        return (
          <Link
            href={`/tasks/detail?id=${task.id}`}
            key={task.id}
            className="block rounded-md border border-[#e7e2d7] p-3 active:bg-[#fbfaf5]"
          >
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <Badge tone={task.status === "DELAYED" ? "red" : task.is_critical ? "gold" : "blue"}>{task.code}</Badge>
              <span className="text-xs text-[#667085]">{task.committee.name}</span>
            </div>
            <h3 className="text-sm font-black leading-snug">{task.title}</h3>
            <p className="mt-1 text-xs text-[#667085]">
              {task.start_date.toLocaleDateString("th-TH")} – {task.due_date.toLocaleDateString("th-TH")}
            </p>
            <div className="relative mt-3 h-2 overflow-hidden rounded-full bg-[#eeeae0]">
              <div
                className="absolute top-0 h-full rounded-full"
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
  );
}
