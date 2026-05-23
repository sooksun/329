"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui";
import { errors } from "@/lib/messages";

type TaskEdit = {
  id: string;
  title: string;
  status: string;
  reported_progress: number;
  verified_progress: number;
};

const statuses = [
  ["NOT_STARTED", "ยังไม่เริ่ม"],
  ["IN_PROGRESS", "กำลังดำเนินการ"],
  ["SUBMITTED", "ส่งตรวจ"],
  ["REVISION_REQUIRED", "ต้องแก้ไข"],
  ["VERIFIED", "ตรวจแล้ว"],
  ["DONE", "เสร็จสิ้น"],
  ["DELAYED", "ล่าช้า"]
];

export function TaskDetailActions({
  task,
  canClose,
  canEdit = false,
  mobileSticky = false,
  doneBlockers = []
}: {
  task: TaskEdit;
  canClose: boolean;
  canEdit?: boolean;
  mobileSticky?: boolean;
  doneBlockers?: string[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  async function save(nextStatus?: string) {
    setSaving(true);
    setMessage("");
    try {
      const values = formRef.current ? new FormData(formRef.current) : new FormData();
      const payload = {
        title: String(values.get("title") ?? task.title),
        status: nextStatus ?? String(values.get("status") ?? task.status),
        reported_progress: Number(values.get("reported_progress") ?? task.reported_progress),
        verified_progress: Number(values.get("verified_progress") ?? task.verified_progress)
      };
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? errors.saveFailed);
      }
      setMessage("บันทึกแล้ว");
      setEditing(false);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  const idleToolbar = (
    <>
      <div className={`flex gap-2 ${mobileSticky ? "w-full [&_button]:min-h-[44px] [&_button]:flex-1" : "flex-wrap"}`}>
        {!mobileSticky ? <Button onClick={() => router.back()}>กลับ</Button> : null}
        {canEdit ? (
          <>
            <Button onClick={() => setEditing(true)}>แก้ไข</Button>
            <Button variant="gold" onClick={() => save("DONE")} disabled={saving || !canClose} title={!canClose ? doneBlockers.join(" · ") : undefined}>
              เสร็จสิ้น
            </Button>
          </>
        ) : null}
      </div>
      {!canEdit && !mobileSticky ? (
        <p className="text-sm text-[#667085]">คุณดูภารกิจนี้ได้อย่างเดียว — แก้ไขได้เฉพาะงานในคณะกรรมการของตนเอง</p>
      ) : null}
      {message ? <p className={`text-sm font-bold text-[#b91528] ${mobileSticky ? "text-center" : ""}`}>{message}</p> : null}
    </>
  );

  if (!editing) {
    if (mobileSticky) {
      return (
        <>
          <div
            className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e7e2d7] bg-white/95 p-3 shadow-[0_-4px_24px_rgba(16,24,39,0.08)] backdrop-blur md:hidden"
            style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
          >
            {idleToolbar}
          </div>
          <div className="h-[5.5rem] md:hidden" aria-hidden />
        </>
      );
    }
    return <div className="flex flex-col items-start gap-2 md:items-end">{idleToolbar}</div>;
  }

  const editForm = (
    <form ref={formRef} className="w-full rounded-md border border-[#e7e2d7] bg-[#fbfaf5] p-4 sm:p-4" onSubmit={(event) => { event.preventDefault(); save(); }}>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-bold">
          ชื่องาน
          <input name="title" className="mt-1 h-10 w-full rounded-md border px-3" defaultValue={task.title} />
        </label>
        <label className="text-sm font-bold">
          สถานะ
          <select name="status" className="mt-1 h-10 w-full rounded-md border px-3" defaultValue={task.status}>
            {statuses.map(([value, label]) => (
              <option key={value} value={value} disabled={value === "DONE" && !canClose}>
                {label}
                {value === "DONE" && !canClose ? " (ยังปิดไม่ได้)" : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-bold">
          ความคืบหน้าที่รายงาน
          <input name="reported_progress" className="mt-1 h-10 w-full rounded-md border px-3" type="number" min={0} max={100} defaultValue={task.reported_progress} />
        </label>
        <label className="text-sm font-bold">
          ความคืบหน้าที่ตรวจแล้ว
          <input name="verified_progress" className="mt-1 h-10 w-full rounded-md border px-3" type="number" min={0} max={100} defaultValue={task.verified_progress} />
        </label>
      </div>
      <div className="mt-4 flex gap-2">
        <Button type="submit" variant="gold" disabled={saving}>{saving ? "กำลังบันทึก..." : "บันทึก"}</Button>
        <Button onClick={() => setEditing(false)} disabled={saving}>ยกเลิก</Button>
      </div>
      {message ? <p className="mt-2 text-sm font-bold text-[#b91528]">{message}</p> : null}
    </form>
  );

  if (mobileSticky) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-40 max-h-[85vh] overflow-y-auto border-t border-[#e7e2d7] bg-white p-3 shadow-[0_-8px_32px_rgba(16,24,39,0.12)] md:static md:max-h-none md:border-0 md:p-0 md:shadow-none">
        {editForm}
      </div>
    );
  }
  return editForm;
}
