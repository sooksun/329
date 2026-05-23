import { getServerSession } from "next-auth";
import { Card } from "@/components/ui";
import { PageHeader, PageLink, PageStack } from "@/components/page/page-layout";
import { SwitchPrimaryProjectButton } from "@/components/switch-primary-project";
import { TasksBoard } from "@/components/tasks/tasks-board";
import { TasksFilters } from "@/components/tasks/tasks-filters";
import { authOptions } from "@/lib/auth";
import { filterCommitteesByAccess, filterTasksByCommitteeAccess, getCommitteeAccessContext } from "@/server/auth/committee-access";
import { getSessionUser } from "@/server/auth/session";
import { getTasksPageData } from "@/server/project/loaders/tasks";
import { listTasks } from "@/server/project/queries/tasks";
import { listAccessibleProjects } from "@/server/tenant/project-access";
import type { TaskBoardFilters, TaskBoardItem } from "@/types/task-board";

type TaskRow = Awaited<ReturnType<typeof listTasks>>[number];

type TasksPageProps = {
  searchParams?: Promise<{
    committee?: string;
    priority?: string;
    status?: string;
    search?: string;
  }>;
};

function toBoardItem(task: TaskRow): TaskBoardItem {
  return {
    id: task.id,
    code: task.code,
    title: task.title,
    description: task.description ?? "",
    status: task.status,
    priority: task.priority,
    committee_id: task.committee_id,
    committeeName: task.committee.name,
    ownerName: task.owner?.name ?? null,
    dueDateIso: task.due_date.toISOString(),
    reported_progress: task.reported_progress,
    verified_progress: task.verified_progress,
    evidenceCount: task.evidence.length,
    hasBudget: task.budgetItems.length > 0,
    hasRisk: task.risks.length > 0
  };
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const data = await getTasksPageData();
  if (!data) return null;

  const session = await getServerSession(authOptions);
  const user = getSessionUser(session);
  const accessible = user ? await listAccessibleProjects(user) : [];
  const primaryProject = accessible.find((project) => project.slug === "edition-2570");
  const access = user ? await getCommitteeAccessContext(user, data.project.id) : null;
  const scopedTasks = access ? filterTasksByCommitteeAccess(data.tasks, access) : data.tasks;
  const scopedCommittees = access ? filterCommitteesByAccess(data.committees, access) : data.committees;
  const onEmptyDemo =
    scopedTasks.length === 0 &&
    data.tasks.length === 0 &&
    primaryProject &&
    primaryProject.id !== data.project.id;

  const params = (await searchParams) ?? {};
  const filters: TaskBoardFilters = {
    committee: params.committee,
    priority: params.priority,
    status: params.status,
    search: params.search
  };

  const keyword = params.search?.trim().toLocaleLowerCase("th-TH");
  const filteredTasks = scopedTasks.filter((task) => {
    if (params.committee && task.committee_id !== params.committee) return false;
    if (params.priority && task.priority !== params.priority) return false;
    if (params.status && task.status !== params.status) return false;
    if (keyword) {
      const searchable = [
        task.code,
        task.title,
        task.description,
        task.committee.name,
        task.owner?.name,
        ...task.subtasks.map((subtask) => subtask.title),
        ...task.evidence.map((evidence) => evidence.caption)
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("th-TH");
      if (!searchable.includes(keyword)) return false;
    }
    return true;
  });

  const boardTasks = filteredTasks.map((task) => toBoardItem(task));

  return (
    <PageStack>
      {onEmptyDemo ? (
        <Card className="border-[#fecdca] bg-[#fff5f5] p-4 sm:p-5">
          <h2 className="text-base font-black text-[#b42318] sm:text-lg">โปรเจกต์นี้ยังไม่มีภารกิจ</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#667085]">
            คุณกำลังดู <b>รอบซ้อม 2571 (ตัวอย่าง)</b> — ข้อมูลจริงปี 2570 อยู่ที่ <b>{primaryProject.edition}</b>
          </p>
          <div className="mt-4">
            <SwitchPrimaryProjectButton projectId={primaryProject.id} label={`สลับไป ${primaryProject.name}`} />
          </div>
        </Card>
      ) : null}

      <PageHeader
        title="บอร์ดภารกิจ"
        subtitle={`${filteredTasks.length} / ${scopedTasks.length} ภารกิจ${access && !access.isGlobalAdmin ? " · เฉพาะคณะของคุณ" : ""}`}
        actions={
          <>
            <PageLink href="/tasks">ล้างตัวกรอง</PageLink>
            <PageLink href="/tasks/export">ส่งออก CSV/JSON</PageLink>
            <PageLink href="/tasks?status=DELAYED">งานล่าช้า</PageLink>
            {scopedTasks[0] ? <PageLink href={`/tasks/detail?id=${scopedTasks[0].id}`} variant="gold">รายละเอียดงานแรก</PageLink> : null}
          </>
        }
      />

      <TasksFilters committees={scopedCommittees.map((c) => ({ id: c.id, name: c.name }))} filters={filters} />

      <TasksBoard tasks={boardTasks} filters={filters} firstTaskId={scopedTasks[0]?.id} />
    </PageStack>
  );
}
