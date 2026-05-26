import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ResetPanel } from "@/components/admin/reset-panel";
import { PageHeader, PageStack } from "@/components/page/page-layout";
import { Card } from "@/components/ui";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can, permissions } from "@/lib/rbac";
import { getSessionUser } from "@/server/auth/session";
import { getActiveProjectContext } from "@/server/project/active-project";

export const metadata: Metadata = {
  title: "รีเซ็ตข้อมูลเริ่มงานจริง"
};

export default async function AdminResetPage() {
  const session = await getServerSession(authOptions);
  const user = getSessionUser(session);
  if (!user) redirect("/login");
  if (!can(user.roles, permissions.admin)) redirect("/dashboard");

  const project = await getActiveProjectContext();
  if (!project) redirect("/dashboard");

  const [tasks, subtasks, evidence, risks, meetings, budgetTx, snapshots, notifications, comments] = await Promise.all([
    prisma.task.count({ where: { project_id: project.id } }),
    prisma.subtask.count({ where: { task: { project_id: project.id } } }),
    prisma.evidence.count({ where: { project_id: project.id } }),
    prisma.risk.count({ where: { project_id: project.id } }),
    prisma.meeting.count({ where: { project_id: project.id } }),
    prisma.budgetTransaction.count({ where: { budgetItem: { project_id: project.id } } }),
    prisma.dashboardSnapshot.count({ where: { project_id: project.id } }),
    prisma.notification.count({ where: { project_id: project.id } }),
    prisma.comment.count({ where: { task: { project_id: project.id } } })
  ]);

  return (
    <PageStack>
      <PageHeader
        title="รีเซ็ตข้อมูลเริ่มงานจริง"
        subtitle={`ล้างข้อมูลทดสอบของ "${project.name}" (ครั้งที่ ${project.edition}) เพื่อเริ่มใช้งานจริง โดยคงโครงสร้างภารกิจทั้งหมดไว้`}
      />
      <Card className="p-4 sm:p-6">
        <ResetPanel
          project={{ id: project.id, name: project.name, edition: project.edition }}
          counts={{ tasks, subtasks, evidence, risks, meetings, budgetTx, snapshots, notifications, comments }}
        />
      </Card>
    </PageStack>
  );
}
