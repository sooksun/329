import { createHash, randomUUID } from "node:crypto";
import path from "node:path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { invalidateProjectCache } from "@/server/cache/invalidate";
import { getCommitteeAccessContext } from "@/server/auth/committee-access";
import { requireApiSession } from "@/server/auth/session";
import { canUploadEvidence, forbiddenResponse } from "@/server/permissions/assert";
import { putObject } from "@/server/storage/object-store";
import { notifyEvidenceUploaded } from "@/server/notifications/dispatch";
import { getActiveProjectForUser, userCanAccessProject } from "@/server/tenant/project-access";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp", "text/plain"]);

function extensionFromName(filename: string) {
  const ext = path.extname(filename).toLowerCase();
  return ext || ".bin";
}

export async function POST(request: Request) {
  const auth = await requireApiSession();
  if ("error" in auth) return auth.error;

  const userId = auth.user.id;
  const form = await request.formData();
  const taskId = String(form.get("task_id") ?? "");
  const subtaskId = String(form.get("subtask_id") ?? "").trim() || null;
  const caption = String(form.get("caption") ?? "").trim();
  const file = form.get("file");

  if (!taskId) return NextResponse.json({ error: "กรุณาเลือกภารกิจ" }, { status: 400 });
  if (!caption) return NextResponse.json({ error: "กรุณากรอกคำอธิบายหลักฐาน" }, { status: 400 });
  if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "กรุณาเลือกไฟล์หลักฐาน" }, { status: 400 });
  if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "ไฟล์ต้องมีขนาดไม่เกิน 10 MB" }, { status: 400 });
  if (file.type && !ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json({ error: "รองรับเฉพาะ PDF, รูปภาพ หรือไฟล์ข้อความ" }, { status: 400 });
  }

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task || task.deleted_at) return NextResponse.json({ error: "ไม่พบภารกิจ" }, { status: 404 });

  const active = await getActiveProjectForUser(auth.user);
  if (!active || task.project_id !== active.id) {
    return NextResponse.json({ error: "ภารกิจไม่อยู่ในโปรเจกต์ที่เลือก" }, { status: 403 });
  }
  if (!(await userCanAccessProject(auth.user, task.project_id))) {
    return forbiddenResponse("ไม่มีสิทธิ์เข้าถึงโปรเจกต์นี้");
  }

  const access = await getCommitteeAccessContext(auth.user, task.project_id);
  if (!canUploadEvidence(auth.user, task, access)) {
    return forbiddenResponse("คุณอัปโหลดหลักฐานได้เฉพาะภารกิจในคณะกรรมการของตนเอง");
  }

  if (subtaskId) {
    const subtask = await prisma.subtask.findFirst({ where: { id: subtaskId, task_id: task.id, deleted_at: null } });
    if (!subtask) return NextResponse.json({ error: "ไม่พบงานย่อยของภารกิจนี้" }, { status: 404 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const sha256 = createHash("sha256").update(bytes).digest("hex");

  let fileAsset = await prisma.fileAsset.findUnique({
    where: { project_id_sha256_hash: { project_id: task.project_id, sha256_hash: sha256 } }
  });

  if (!fileAsset) {
    const uuidFilename = `${randomUUID()}${extensionFromName(file.name)}`;
    const stored = await putObject({
      projectId: task.project_id,
      kind: "evidence",
      filename: uuidFilename,
      bytes,
      mimeType: file.type || "application/octet-stream"
    });
    fileAsset = await prisma.fileAsset.create({
      data: {
        project_id: task.project_id,
        uuid_filename: uuidFilename,
        original_filename: file.name,
        mime_type: file.type || "application/octet-stream",
        byte_size: stored.byteSize,
        sha256_hash: sha256,
        storage_key: stored.storageKey,
        storage_provider: stored.storageProvider,
        is_private: true,
        created_by: userId
      }
    });
  }

  const evidence = await prisma.$transaction(async (tx) => {
    const count = await tx.evidence.count({ where: { project_id: task.project_id } });
    return tx.evidence.create({
      data: {
        project_id: task.project_id,
        committee_id: task.committee_id,
        task_id: task.id,
        subtask_id: subtaskId,
        file_asset_id: fileAsset.id,
        code: `EV-${String(count + 1).padStart(3, "0")}-${Date.now().toString(36).toUpperCase()}`,
        caption,
        status: "PENDING",
        created_by: userId
      }
    });
  });

  await prisma.auditLog.create({
    data: {
      user_id: userId,
      action: "Upload evidence",
      entity_type: "Evidence",
      entity_id: evidence.id,
      new_value: JSON.stringify({
        evidence_id: evidence.id,
        task_id: task.id,
        subtask_id: subtaskId,
        file_asset_id: fileAsset.id
      })
    }
  });

  await notifyEvidenceUploaded({
    projectId: task.project_id,
    taskCode: task.code,
    caption
  });

  await invalidateProjectCache(task.project_id);
  return NextResponse.json(evidence);
}
