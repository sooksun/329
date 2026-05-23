import dynamic from "next/dynamic";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { Badge, Card } from "@/components/ui";
import { TaskDetailLayout } from "@/components/tasks/task-detail-layout";
import type { SubtaskItem } from "@/types/subtask";
import { authOptions } from "@/lib/auth";
import { PageLink } from "@/components/page/page-layout";
import { linkButtonClasses } from "@/lib/button-styles";
import { filterTasksByCommitteeAccess, getCommitteeAccessContext } from "@/server/auth/committee-access";
import { canUpdateTask, canViewTask } from "@/server/permissions/assert";
import { getSessionUser } from "@/server/auth/session";
import { getTaskDetailPageData } from "@/server/project/loaders/task-detail";
import { prisma } from "@/lib/prisma";
import { can, permissions } from "@/lib/rbac";
import { TaskCommentsPanel } from "@/components/task-comments-panel";
import { TaskDependenciesPanel } from "@/components/task-dependencies-panel";
import { TaskDoneChecklist } from "@/components/task-done-checklist";
import { canMarkDone, taskDoneBlockers } from "@/lib/rules";
import { thaiStatus } from "@/lib/utils";

const SubtaskEditor = dynamic(() => import("@/components/subtask-editor").then((mod) => mod.SubtaskEditor), {
  loading: () => <p className="text-sm text-[#667085]">กำลังโหลดงานย่อย...</p>
});

type TaskDetailPageProps = {
  searchParams?: Promise<{ id?: string }>;
};

export default async function TaskDetailPage({ searchParams }: TaskDetailPageProps) {
  const params = (await searchParams) ?? {};
  const data = await getTaskDetailPageData(params.id);
  if (!data) return null;
  const { task } = data;

  const session = await getServerSession(authOptions);
  const user = getSessionUser(session);
  const access = user ? await getCommitteeAccessContext(user, data.project.id) : null;
  const canView = user && access ? canViewTask(user, task, access) : false;
  const canEdit = user && access ? canUpdateTask(user, task, access) : false;

  if (!canView || !user) {
    return (
      <Card className="p-6 text-center sm:p-8">
        <h1 className="text-xl font-black sm:text-2xl">ไม่มีสิทธิ์เข้าถึงภารกิจนี้</h1>
        <p className="mt-2 text-sm text-[#667085]">
          ภารกิจอยู่ในคณะ <b>{task.committee.name}</b> — แก้ไขได้เฉพาะงานในคณะของตนเอง
        </p>
        <PageLink href="/tasks" variant="gold" className="mt-4">
          กลับบอร์ดภารกิจ
        </PageLink>
      </Card>
    );
  }

  const userIds = [
    task.created_by,
    task.updated_by,
    ...task.comments.map((c) => c.user_id)
  ].filter(Boolean) as string[];
  const users = userIds.length ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } }) : [];
  const userName = new Map(users.map((u) => [u.id, u.name]));

  const initialComments = task.comments.map((comment) => ({
    id: comment.id,
    body: comment.body,
    created_at: comment.created_at.toISOString(),
    user_id: comment.user_id,
    author_name: comment.user_id ? (userName.get(comment.user_id) ?? "ผู้ใช้") : "ระบบ"
  }));

  const allPicker = await prisma.task.findMany({
    where: { project_id: data.project.id, deleted_at: null, id: { not: task.id } },
    select: { id: true, code: true, title: true, status: true, committee_id: true },
    orderBy: { code: "asc" }
  });
  const scopedPicker = access ? filterTasksByCommitteeAccess(allPicker, access) : allPicker;
  const dependencyPicker = scopedPicker.map((t) => ({
    id: t.id,
    code: t.code,
    title: t.title,
    status: t.status
  }));
  const doneInput = {
    hasApprovedEvidence: task.evidence.some((evidence) => evidence.status === "APPROVED"),
    hasReviewer: Boolean(task.reviewer_id),
    verified_progress: task.verified_progress
  };
  const doneAllowed = canMarkDone(doneInput);

  const subtasks: SubtaskItem[] = task.subtasks.map((subtask) => ({
    id: subtask.id,
    title: subtask.title,
    notes: subtask.notes ?? null,
    status: subtask.status,
    reported_progress: subtask.reported_progress,
    verified_progress: subtask.verified_progress,
    owner: subtask.owner
      ? { id: subtask.owner.id, name: subtask.owner.name, username: subtask.owner.username }
      : null,
    evidence: (subtask.evidence ?? []).map((evidence) => ({
      id: evidence.id,
      caption: evidence.caption,
      status: evidence.status,
      fileAssetId: evidence.file_asset_id,
      filename: evidence.fileAsset.original_filename,
      mimeType: evidence.fileAsset.mime_type
    }))
  }));

  const taskLevelEvidence = task.evidence.filter((evidence) => !evidence.subtask_id);

  const canAssignOwner =
    canEdit &&
    (can(user.roles, permissions.admin) ||
      can(user.roles, permissions.taskManage) ||
      user.roles.includes("Project Director") ||
      user.roles.includes("Project Secretary") ||
      user.roles.includes("Committee Lead"));

  const committeeMembers = canAssignOwner
    ? await prisma.committeeMember.findMany({
        where: { committee_id: task.committee_id },
        include: { user: { select: { id: true, name: true, username: true } } },
        orderBy: { position: "asc" }
      })
    : [];
  const assignableUsers = committeeMembers.map((m) => m.user);

  return (
    <TaskDetailLayout
      task={{
        id: task.id,
        code: task.code,
        title: task.title,
        status: task.status,
        priority: task.priority,
        committeeName: task.committee.name,
        ownerName: task.owner?.name ?? null,
        reviewerName: task.reviewer?.name ?? null,
        dueLabel: task.due_date.toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" }),
        createdByLabel: task.created_by ? (userName.get(task.created_by) ?? task.created_by) : "ไม่ระบุ",
        updatedByLabel: task.updated_by ? (userName.get(task.updated_by) ?? task.updated_by) : "ยังไม่มี",
        reported_progress: task.reported_progress,
        verified_progress: task.verified_progress,
        evidence_progress: task.evidence_progress,
        success_criteria: task.success_criteria,
        budgetCount: task.budgetItems.length,
        riskCount: task.risks.length
      }}
      canEdit={canEdit}
      canClose={doneAllowed}
      doneBlockers={taskDoneBlockers(doneInput)}
    >
      {canEdit ? <TaskDoneChecklist input={doneInput} /> : null}

      <Card className="p-4 sm:p-5">
        <h2 className="mb-3 text-base font-black sm:text-lg">เกณฑ์ความสำเร็จ</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-[#475467]">
          <li>{task.success_criteria}</li>
          <li>มีหลักฐานเป็นไฟล์ PDF หรือภาพถ่ายพร้อมคำบรรยาย</li>
          <li>ผู้ตรวจสอบยืนยันความก้าวหน้า 100%</li>
        </ul>
      </Card>

      <Card className="p-4 sm:p-5">
        <h2 className="mb-3 text-base font-black sm:text-lg">ความสัมพันธ์งาน</h2>
        <TaskDependenciesPanel
          taskId={task.id}
          canEdit={canEdit}
          pickerTasks={dependencyPicker}
          initialDependsOn={task.dependencies.map((row) => ({
            id: row.id,
            dependsOn: {
              id: row.dependsOn.id,
              code: row.dependsOn.code,
              title: row.dependsOn.title,
              status: row.dependsOn.status
            }
          }))}
          initialBlocked={task.dependents.map((row) => ({
            id: row.id,
            task: {
              id: row.task.id,
              code: row.task.code,
              title: row.task.title,
              status: row.task.status
            }
          }))}
        />
      </Card>

      <Card className="p-4 sm:p-5">
        <h2 className="mb-3 text-base font-black sm:text-lg">ความคิดเห็น</h2>
        <TaskCommentsPanel
          taskId={task.id}
          initialComments={initialComments}
          canEdit={canEdit}
          currentUserId={user.id}
          isAdmin={can(user.roles, permissions.admin)}
        />
      </Card>

      <Card className="p-4 sm:p-5">
        <h2 className="text-base font-black sm:text-lg">งานย่อย</h2>
        <p className="mb-4 mt-1 text-sm leading-relaxed text-[#667085]">
          แก้ไข บันทึกข้อความ และอัปโหลดรูปแยกรายงานย่อย — สมาชิกคณะแก้ไขได้เฉพาะคณะของตนเอง
        </p>
        <SubtaskEditor
          subtasks={subtasks}
          taskId={task.id}
          canEdit={canEdit}
          canAssignOwner={canAssignOwner}
          assignableUsers={assignableUsers}
        />
      </Card>

      <Card className="p-4 sm:p-5">
        <h2 className="mb-3 text-base font-black sm:text-lg">หลักฐานระดับภารกิจ</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {taskLevelEvidence.length ? (
            taskLevelEvidence.map((evidence) => (
              <div key={evidence.id} className="rounded-md border border-[#e7e2d7] p-3 sm:p-4">
                <Badge tone={evidence.status === "APPROVED" ? "green" : evidence.status === "REJECTED" ? "red" : "gold"}>
                  {thaiStatus(evidence.status)}
                </Badge>
                <p className="mt-2 text-sm font-bold leading-snug">{evidence.caption}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-[#667085]">ไม่มีหลักฐานระดับภารกิจ — ใช้หลักฐานในงานย่อยด้านบน</p>
          )}
        </div>
      </Card>
    </TaskDetailLayout>
  );
}
