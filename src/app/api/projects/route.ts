import { NextResponse } from "next/server";
import { requireApiSession } from "@/server/auth/session";
import { getActiveProjectForUser, listAccessibleProjects } from "@/server/tenant/project-access";

export async function GET() {
  const auth = await requireApiSession();
  if ("error" in auth) return auth.error;

  const [projects, active] = await Promise.all([
    listAccessibleProjects(auth.user),
    getActiveProjectForUser(auth.user)
  ]);

  return NextResponse.json({
    projects,
    activeProjectId: active?.id ?? projects[0]?.id ?? null
  });
}
