import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { AdminUserManager } from "@/components/admin-user-manager";
import { Card } from "@/components/ui";
import { PageHeader, PageStack } from "@/components/page/page-layout";
import { authOptions } from "@/lib/auth";
import { can, permissions } from "@/lib/rbac";
import { getSessionUser } from "@/server/auth/session";
import { getActiveProjectContext } from "@/server/project/active-project";
import { prisma } from "@/lib/prisma";
import { listUsersForAdmin } from "@/server/users/admin";

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  const user = getSessionUser(session);
  if (!user) redirect("/login");
  if (!can(user.roles, permissions.userManage) && !can(user.roles, permissions.admin)) {
    redirect("/dashboard");
  }

  const project = await getActiveProjectContext();
  const users = await listUsersForAdmin();
  const committees = project
    ? await prisma.committee.findMany({
        where: { project_id: project.id, deleted_at: null },
        orderBy: { sort_order: "asc" },
        select: { id: true, name: true }
      })
    : [];

  return (
    <PageStack>
      <PageHeader
        title="จัดการผู้ใช้"
        subtitle="ผู้ดูแลระบบสามารถเพิ่มผู้ใช้ใหม่และกำหนดคณะกรรมการได้"
      />
      <Card className="p-4 sm:p-6">
        <AdminUserManager users={users} committees={committees} />
      </Card>
    </PageStack>
  );
}
