import { NextResponse } from "next/server";
import { MIS_PROJECT_COOKIE, MIS_PROJECT_COOKIE_MAX_AGE } from "@/lib/tenant-cookies";
import { errors } from "@/lib/messages";
import { requireApiSession } from "@/server/auth/session";
import { invalidateProjectCache } from "@/server/cache/invalidate";
import { userCanAccessProject } from "@/server/tenant/project-access";

export async function POST(request: Request) {
  const auth = await requireApiSession();
  if ("error" in auth) return auth.error;

  const body = await request.json().catch(() => ({}));
  const projectId = typeof body.project_id === "string" ? body.project_id : "";
  if (!projectId) {
    return NextResponse.json({ error: errors.projectIdRequired }, { status: 400 });
  }

  const allowed = await userCanAccessProject(auth.user, projectId);
  if (!allowed) {
    return NextResponse.json({ error: errors.projectAccessDenied }, { status: 403 });
  }

  const response = NextResponse.json({ ok: true, projectId });
  response.cookies.set(MIS_PROJECT_COOKIE, projectId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MIS_PROJECT_COOKIE_MAX_AGE
  });

  await invalidateProjectCache(projectId);
  return response;
}
