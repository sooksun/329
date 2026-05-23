import { NextResponse } from "next/server";
import { requireApiSession } from "@/server/auth/session";
import { getActiveProjectForUser } from "@/server/tenant/project-access";
import { notificationService } from "@/server/services/notification-service";

export async function GET() {
  const auth = await requireApiSession();
  if ("error" in auth) return auth.error;

  const project = await getActiveProjectForUser(auth.user);
  if (!project) return NextResponse.json({ error: "ไม่พบโปรเจกต์ที่ใช้งาน" }, { status: 404 });

  const [items, unread] = await Promise.all([
    notificationService.listForProject(project.id, auth.user.id),
    notificationService.unreadCount(project.id, auth.user.id)
  ]);

  return NextResponse.json({ items, unread });
}

export async function PATCH(request: Request) {
  const auth = await requireApiSession();
  if ("error" in auth) return auth.error;

  const project = await getActiveProjectForUser(auth.user);
  if (!project) return NextResponse.json({ error: "ไม่พบโปรเจกต์ที่ใช้งาน" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const notificationId = typeof body.id === "string" ? body.id : "";
  if (!notificationId) {
    return NextResponse.json({ error: "ต้องระบุ id" }, { status: 400 });
  }

  await notificationService.markRead(notificationId, project.id);
  const unread = await notificationService.unreadCount(project.id, auth.user.id);
  return NextResponse.json({ ok: true, unread });
}
