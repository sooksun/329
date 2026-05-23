import { prisma } from "@/lib/prisma";

export async function listSnapshots(projectId: string) {
  return prisma.dashboardSnapshot.findMany({
    where: { project_id: projectId },
    orderBy: { created_at: "desc" }
  });
}

export async function listReports(projectId: string) {
  return prisma.powerPointReport.findMany({
    where: { project_id: projectId },
    include: { snapshot: true },
    orderBy: { created_at: "desc" }
  });
}
