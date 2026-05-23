export const permissions = {
  dashboardView: "dashboard:view",
  taskManage: "task:manage",
  taskUpdateOwn: "task:update-own",
  evidenceReview: "evidence:review",
  budgetManage: "budget:manage",
  meetingManage: "meeting:manage",
  snapshotManage: "snapshot:manage",
  reportGenerate: "report:generate",
  userManage: "user:manage",
  committeeManage: "committee:manage",
  riskManage: "risk:manage",
  auditView: "audit:view",
  admin: "admin:*"
} as const;

export const rolePermissions: Record<string, string[]> = {
  "Super Admin": [permissions.admin, permissions.userManage, permissions.committeeManage, permissions.riskManage, permissions.auditView],
  "Project Director": [
    permissions.dashboardView,
    permissions.evidenceReview,
    permissions.reportGenerate,
    permissions.committeeManage,
    permissions.riskManage,
    permissions.meetingManage,
    permissions.auditView
  ],
  "Project Secretary": [
    permissions.dashboardView,
    permissions.taskManage,
    permissions.meetingManage,
    permissions.snapshotManage,
    permissions.reportGenerate,
    permissions.committeeManage,
    permissions.riskManage,
    permissions.auditView
  ],
  "Committee Lead": [permissions.dashboardView, permissions.taskManage],
  "Data Recorder": [permissions.dashboardView, permissions.taskManage, permissions.taskUpdateOwn, permissions.evidenceReview],
  "Task Owner": [permissions.dashboardView, permissions.taskUpdateOwn],
  "Finance Officer": [permissions.dashboardView, permissions.budgetManage],
  "Evidence Reviewer": [permissions.dashboardView, permissions.evidenceReview],
  Viewer: [permissions.dashboardView]
};

export function can(roleNames: string[], permission: string) {
  return roleNames.some((role) => {
    const granted = rolePermissions[role] ?? [];
    return granted.includes(permissions.admin) || granted.includes(permission);
  });
}
