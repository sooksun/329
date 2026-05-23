import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { MisShell } from "@/components/mis-shell";
import { authOptions } from "@/lib/auth";
import { can, permissions } from "@/lib/rbac";
import { canViewDashboard } from "@/server/permissions/assert";
import { getSessionUser } from "@/server/auth/session";
import { getShellData } from "@/server/project/loaders/shell";

export default async function MisLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const user = getSessionUser(session);
  if (!user) redirect("/login");
  if (!canViewDashboard(user)) redirect("/login");

  const data = await getShellData();
  if (!data) redirect("/login?error=no_project");

  const displayName = user.name ?? "ผู้ใช้งานระบบ";

  return (
    <MisShell
      data={{
        project: {
          id: data.project.id,
          name: data.project.name,
          edition: data.project.edition,
          organizationName: data.project.organization.name
        },
        activeProjectId: data.activeProjectId,
        accessibleProjects: data.accessibleProjects.map((item) => ({
          id: item.id,
          name: item.name,
          edition: item.edition,
          organizationName: item.organization.name
        })),
        summary: data.summary,
        user: {
          name: displayName,
          initials:
            displayName
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 2)
              .map((part) => part[0])
              .join("") || "MIS",
          role: user.roles[0] ?? "ผู้ใช้งานระบบ",
          isAdmin: can(user.roles, permissions.admin) || can(user.roles, permissions.userManage),
          canViewAudit: can(user.roles, permissions.auditView) || can(user.roles, permissions.admin)
        }
      }}
    >
      {children}
    </MisShell>
  );
}
