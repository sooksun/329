import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { AuditLogViewer } from "@/components/audit-log-viewer";
import { Card } from "@/components/ui";
import { PageHeader, PageStack } from "@/components/page/page-layout";
import { authOptions } from "@/lib/auth";
import { can, permissions } from "@/lib/rbac";
import { getSessionUser } from "@/server/auth/session";
import { listAuditLogs } from "@/server/audit/list";
import { prisma } from "@/lib/prisma";

export default async function AuditLogPage() {
  const session = await getServerSession(authOptions);
  const user = getSessionUser(session);
  if (!user) redirect("/login");
  if (!can(user.roles, permissions.auditView) && !can(user.roles, permissions.admin)) {
    redirect("/dashboard");
  }

  const logs = await listAuditLogs({ limit: 100 });
  const userIds = [...new Set(logs.map((l) => l.user_id).filter(Boolean) as string[])];
  const users = userIds.length
    ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, username: true } })
    : [];
  const userMap = new Map(users.map((u) => [u.id, u]));

  const initialItems = logs.map((log) => ({
    id: log.id,
    action: log.action,
    entity_type: log.entity_type,
    entity_id: log.entity_id,
    created_at: log.created_at.toISOString(),
    user: log.user_id ? (userMap.get(log.user_id) ?? { id: log.user_id, name: "ผู้ใช้", username: "" }) : null
  }));

  return (
    <PageStack>
      <PageHeader
        title="บันทึกการตรวจสอบ (Audit Log)"
        subtitle="ประวัติการเปลี่ยนแปลงในระบบ — 100 รายการล่าสุด"
      />
      <Card className="p-4 sm:p-6">
        <AuditLogViewer initialItems={initialItems} />
      </Card>
    </PageStack>
  );
}
