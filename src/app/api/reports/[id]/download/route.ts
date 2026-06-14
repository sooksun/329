import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/prisma";
import { requireApiSession } from "@/server/auth/session";
import { canDownloadFile, forbiddenResponse } from "@/server/permissions/assert";
import { userCanAccessProject } from "@/server/tenant/project-access";
import { isS3Storage, s3Config } from "@/server/storage/config";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireApiSession();
  if ("error" in auth) return auth.error;
  if (!canDownloadFile(auth.user)) return forbiddenResponse();

  const { id } = await context.params;
  const report = await prisma.powerPointReport.findUnique({ where: { id } });
  // กัน IDOR: ดาวน์โหลดได้เฉพาะรายงานของโปรเจกต์ที่ผู้ใช้เข้าถึงได้
  if (!report || !(await userCanAccessProject(auth.user, report.project_id))) {
    return NextResponse.json({ error: "ไม่พบรายงาน" }, { status: 404 });
  }

  let bytes: Buffer;
  if (isS3Storage() && !report.file_path.includes("\\") && !path.isAbsolute(report.file_path)) {
    const cfg = s3Config();
    const s3 = new S3Client({
      region: cfg.region,
      endpoint: cfg.endpoint,
      forcePathStyle: cfg.forcePathStyle,
      credentials: { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey }
    });
    const response = await s3.send(new GetObjectCommand({ Bucket: cfg.bucket, Key: report.file_path }));
    const body = await response.Body?.transformToByteArray();
    if (!body) return NextResponse.json({ error: "ไฟล์รายงานว่าง" }, { status: 404 });
    bytes = Buffer.from(body);
  } else {
    const absolute = path.isAbsolute(report.file_path) ? report.file_path : path.resolve(process.cwd(), report.file_path);
    bytes = await readFile(absolute);
  }

  const safeName = `${report.title.replace(/[^\w.\-()\u0E00-\u0E7F ]+/g, "_")}.pptx`;
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(safeName)}`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store"
    }
  });
}
