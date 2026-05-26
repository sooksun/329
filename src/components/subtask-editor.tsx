"use client";

import { ImagePlus, Pencil, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge, Button, ProgressBar, buttonClasses } from "@/components/ui";
import { toastCreated, toastError, toastSaved } from "@/lib/toast";
import { thaiStatus } from "@/lib/utils";
import type { SubtaskItem } from "@/types/subtask";

const statuses = [
  ["NOT_STARTED", "ยังไม่เริ่ม"],
  ["IN_PROGRESS", "กำลังดำเนินการ"],
  ["SUBMITTED", "ส่งตรวจ"],
  ["REVISION_REQUIRED", "ต้องแก้ไข"],
  ["VERIFIED", "ตรวจแล้ว"],
  ["DONE", "เสร็จสิ้น"],
  ["DELAYED", "ล่าช้า"]
] as const;

function evidenceTone(status: string): "green" | "red" | "gold" {
  if (status === "APPROVED") return "green";
  if (status === "REJECTED") return "red";
  return "gold";
}

function SubtaskCard({
  subtask,
  taskId,
  canEdit,
  canAssignOwner,
  assignableUsers
}: {
  subtask: SubtaskItem;
  taskId: string;
  canEdit: boolean;
  canAssignOwner?: boolean;
  assignableUsers?: Array<{ id: string; name: string; username: string }>;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function saveSubtask(form: HTMLFormElement) {
    setSaving(true);
    try {
      const values = new FormData(form);
      const response = await fetch(`/api/subtasks/${subtask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: String(values.get("title") ?? subtask.title),
          notes: String(values.get("notes") ?? ""),
          status: String(values.get("status") ?? subtask.status),
          reported_progress: Number(values.get("reported_progress") ?? subtask.reported_progress),
          verified_progress: Number(values.get("verified_progress") ?? subtask.verified_progress),
          owner_id: values.get("owner_id") ? String(values.get("owner_id")) : undefined
        })
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "บันทึกไม่สำเร็จ");
      }
      toastSaved("บันทึกงานย่อยแล้ว");
      setEditing(false);
      router.refresh();
    } catch (error) {
      toastError(error instanceof Error ? error.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  async function uploadEvidence(form: HTMLFormElement) {
    setUploading(true);
    try {
      const formData = new FormData(form);
      formData.set("task_id", taskId);
      formData.set("subtask_id", subtask.id);
      const response = await fetch("/api/evidence/upload", { method: "POST", body: formData });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "อัปโหลดไม่สำเร็จ");
      }
      form.reset();
      toastCreated("อัปโหลดรูป/หลักฐานของงานย่อยนี้แล้ว");
      router.refresh();
    } catch (error) {
      toastError(error instanceof Error ? error.message : "อัปโหลดไม่สำเร็จ");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-md border border-[#e7e2d7] bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <b className="text-base">{subtask.title}</b>
          {subtask.owner ? (
            <p className="mt-1 text-xs text-[#667085]">
              ผู้รับผิดชอบ: <span className="font-bold text-[#123f76]">{subtask.owner.name}</span> ({subtask.owner.username})
            </p>
          ) : (
            <p className="mt-1 text-xs text-[#667085]">ยังไม่ระบุผู้รับผิดชอบ</p>
          )}
          {subtask.notes && !editing ? (
            <p className="mt-2 whitespace-pre-wrap text-sm text-[#475467]">{subtask.notes}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Badge>{thaiStatus(subtask.status)}</Badge>
          {canEdit ? (
            <Button type="button" onClick={() => setEditing((value) => !value)}>
              <Pencil size={14} /> {editing ? "ปิด" : "แก้ไข"}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-3 grid gap-2 text-xs text-[#667085] md:grid-cols-2">
        <span>รายงาน {subtask.reported_progress}%</span>
        <span>ตรวจ {subtask.verified_progress}%</span>
      </div>
      <ProgressBar value={subtask.verified_progress} />

      {editing && canEdit ? (
        <form
          className="mt-4 space-y-3 rounded-md border border-dashed border-[#d8bd75] bg-[#fbfaf5] p-3"
          onSubmit={(event) => {
            event.preventDefault();
            saveSubtask(event.currentTarget);
          }}
        >
          <label className="block text-sm font-bold">
            ชื่องานย่อย
            <input name="title" className="mt-1 h-10 w-full rounded-md border px-3" defaultValue={subtask.title} required />
          </label>
          <label className="block text-sm font-bold">
            รายงานความคืบหน้า / ข้อความของงานย่อยนี้
            <textarea
              name="notes"
              rows={4}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              placeholder="บันทึกรายละเอียดการดำเนินงานเฉพาะงานย่อยนี้ (ไม่ใช่รายงานภาพรวมภารกิจ)"
              defaultValue={subtask.notes ?? ""}
            />
          </label>
          {canAssignOwner ? (
            <label className="block text-sm font-bold">
              ผู้รับผิดชอบงานย่อย
              <select name="owner_id" className="mt-1 h-10 w-full rounded-md border px-3" defaultValue={subtask.owner?.id ?? ""}>
                <option value="">— ยังไม่ระบุ —</option>
                {(assignableUsers ?? []).map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.username})
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm font-bold">
              สถานะ
              <select name="status" className="mt-1 h-10 w-full rounded-md border px-3" defaultValue={subtask.status}>
                {statuses.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-bold">
              ความคืบหน้าที่รายงาน (%)
              <input
                name="reported_progress"
                type="number"
                min={0}
                max={100}
                className="mt-1 h-10 w-full rounded-md border px-3"
                defaultValue={subtask.reported_progress}
              />
            </label>
            <label className="text-sm font-bold">
              ความคืบหน้าที่ตรวจ (%)
              <input
                name="verified_progress"
                type="number"
                min={0}
                max={100}
                className="mt-1 h-10 w-full rounded-md border px-3"
                defaultValue={subtask.verified_progress}
              />
            </label>
          </div>
          <Button type="submit" variant="gold" disabled={saving}>
            {saving ? "กำลังบันทึก..." : "บันทึกงานย่อย"}
          </Button>
        </form>
      ) : null}

      {canEdit ? (
        <form
          className="mt-4 grid gap-3 rounded-md border border-[#e7e2d7] p-3"
          onSubmit={(event) => {
            event.preventDefault();
            uploadEvidence(event.currentTarget);
          }}
        >
          <div className="grid gap-3">
            <label className="block text-sm font-bold">
              คำอธิบายรูป/หลักฐาน (งานย่อยนี้)
              <input name="caption" className="mt-1 h-10 w-full rounded-md border px-3" placeholder="เช่น ภาพหน้างานก่อน-หลัง" required />
            </label>
            <label className="block text-sm font-bold">
              อัปโหลดรูปภาพ
              <input
                name="file"
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="mt-1 h-10 w-full rounded-md border px-3 py-2 text-sm"
                required
              />
            </label>
          </div>
          <div>
            <Button type="submit" variant="gold" disabled={uploading} className="min-h-[44px] w-full">
              <Upload size={16} /> {uploading ? "กำลังอัปโหลด..." : "อัปโหลด"}
            </Button>
          </div>
        </form>
      ) : null}

      {subtask.evidence.length ? (
        <div className="mt-4 space-y-2">
          <p className="flex items-center gap-1 text-sm font-bold text-[#123f76]">
            <ImagePlus size={16} /> หลักฐานของงานย่อยนี้ ({subtask.evidence.length})
          </p>
          {subtask.evidence.map((item) => (
            <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-[#fbfaf5] px-3 py-2 text-sm">
              <div>
                <Badge tone={evidenceTone(item.status)}>{thaiStatus(item.status)}</Badge>
                <span className="ml-2 font-bold">{item.caption}</span>
                <span className="ml-2 text-[#667085]">{item.filename}</span>
              </div>
              <Link
                href={`/api/files/${item.fileAssetId}/download`}
                className={buttonClasses("ghost")}
                target="_blank"
                rel="noopener noreferrer"
              >
                เปิดไฟล์
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-[#667085]">ยังไม่มีรูป/หลักฐานสำหรับงานย่อยนี้</p>
      )}
    </div>
  );
}

export function SubtaskEditor({
  subtasks,
  taskId,
  canEdit,
  canAssignOwner,
  assignableUsers
}: {
  subtasks: SubtaskItem[];
  taskId: string;
  canEdit: boolean;
  canAssignOwner?: boolean;
  assignableUsers?: Array<{ id: string; name: string; username: string }>;
}) {
  if (!subtasks.length) {
    return <p className="text-sm text-[#667085]">ไม่มีงานย่อยในภารกิจนี้</p>;
  }

  return (
    <div className="space-y-4">
      {!canEdit ? (
        <p className="text-sm text-[#667085]">คุณมีสิทธิ์ดูอย่างเดียว — แก้ไขงานย่อยได้เฉพาะในคณะกรรมการที่ตนเองรับผิดชอบ · ประธาน/Admin แก้ไขได้ทุกคณะ</p>
      ) : null}
      {subtasks.map((subtask) => (
        <SubtaskCard
          key={subtask.id}
          subtask={subtask}
          taskId={taskId}
          canEdit={canEdit}
          canAssignOwner={canAssignOwner}
          assignableUsers={assignableUsers}
        />
      ))}
    </div>
  );
}
