import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiSession } from "@/server/auth/session";
import { canDownloadFile, forbiddenResponse } from "@/server/permissions/assert";
import { userCanAccessProject } from "@/server/tenant/project-access";
import { openObjectStream } from "@/server/storage/object-store";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireApiSession();
  if ("error" in auth) return auth.error;
  if (!canDownloadFile(auth.user)) return forbiddenResponse();

  const { id } = await context.params;
  const fileAsset = await prisma.fileAsset.findFirst({
    where: { id, deleted_at: null }
  });
  // คืน 404 (ไม่ใช่ 403) เมื่อไฟล์อยู่นอกโปรเจกต์ที่ผู้ใช้เข้าถึงได้ — กัน IDOR ข้ามคณะ/โปรเจกต์
  if (!fileAsset || !(await userCanAccessProject(auth.user, fileAsset.project_id))) {
    return NextResponse.json({ error: "ไม่พบไฟล์" }, { status: 404 });
  }

  try {
    const webStream = await openObjectStream(fileAsset);
    const safeName = fileAsset.original_filename.replace(/[^\w.\-()\u0E00-\u0E7F ]+/g, "_");
    return new NextResponse(webStream, {
      headers: {
        "Content-Type": fileAsset.mime_type || "application/octet-stream",
        "Content-Length": String(fileAsset.byte_size),
        // attachment + nosniff: กันไฟล์อัปโหลด (เช่น .html/.svg) รันเป็นสคริปต์ใน origin เดียวกัน
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(safeName)}`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store"
      }
    });
  } catch {
    return NextResponse.json({ error: "ไม่พบไฟล์บนที่เก็บข้อมูล" }, { status: 404 });
  }
}
