import { NextResponse } from "next/server";
import { errors } from "@/lib/messages";
import { permissions } from "@/lib/rbac";
import { requireApiSession } from "@/server/auth/session";
import { assertPermission } from "@/server/permissions/assert";
import { resetProjectOperationalData } from "@/server/admin/reset";
import { getActiveProjectForUser } from "@/server/tenant/project-access";

export async function POST(request: Request) {
  const auth = await requireApiSession();
  if ("error" in auth) return auth.error;

  // เฉพาะผู้ดูแลระบบสูงสุด (admin:*)
  const denied = assertPermission(auth.user, permissions.admin);
  if (denied) return denied;

  const project = await getActiveProjectForUser(auth.user);
  if (!project) return NextResponse.json({ error: errors.noActiveProject }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  if (String(body.confirm ?? "") !== "RESET") {
    return NextResponse.json({ error: 'ต้องพิมพ์ "RESET" เพื่อยืนยันการรีเซ็ต' }, { status: 400 });
  }
  if (String(body.projectId ?? "") !== project.id) {
    return NextResponse.json({ error: "โปรเจกต์ที่ยืนยันไม่ตรงกับโปรเจกต์ที่กำลังใช้งาน" }, { status: 400 });
  }

  try {
    const summary = await resetProjectOperationalData(project.id, auth.user.id);
    return NextResponse.json({
      ok: true,
      project: { id: project.id, name: project.name, edition: project.edition },
      summary
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "รีเซ็ตข้อมูลไม่สำเร็จ" },
      { status: 500 }
    );
  }
}
