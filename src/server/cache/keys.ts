export function projectDashboardKey(projectId: string) {
  return `mis:v1:project:${projectId}:dashboard`;
}

export function projectShellKey(projectId: string) {
  return `mis:v1:project:${projectId}:shell-summary`;
}

export function projectCachePattern(projectId: string) {
  return `mis:v1:project:${projectId}:*`;
}
