"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormDateField, FormDateTimeField } from "@/components/ui/thai-date-picker";
import { Button } from "@/components/ui";
import { errors, readApiError } from "@/lib/messages";
import { toastConfirm, toastCreated, toastDeleted, toastError, toastSaved } from "@/lib/toast";
import { formatThaiDateTime } from "@/lib/utils";

type TaskOption = { id: string; code: string; title: string };

export type MeetingRow = {
  id: string;
  title: string;
  meeting_at: string;
  notes: string;
  decisions: string;
  agendas: Array<{ id: string; title: string; order: number }>;
  actionItems: Array<{
    id: string;
    decision_title: string;
    description: string;
    owner_name: string;
    due_date: string;
    status: string;
    linked_task_id: string | null;
  }>;
};

export function MeetingManager({
  meetings,
  tasks,
  canManage
}: {
  meetings: MeetingRow[];
  tasks: TaskOption[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!canManage) return null;

  async function createMeeting(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.get("title"),
          meeting_at: form.get("meeting_at"),
          notes: form.get("notes"),
          decisions: form.get("decisions"),
          agenda_text: form.get("agenda_text"),
          action_title: form.get("action_title") || undefined,
          action_description: form.get("action_description"),
          action_owner: form.get("action_owner"),
          action_due: form.get("action_due"),
          action_task_id: form.get("action_task_id") || undefined
        })
      });
      if (!response.ok) throw new Error(await readApiError(response, errors.saveFailed));
      toastCreated("สร้างการประชุมแล้ว");
      setOpen(false);
      router.refresh();
    } catch (error) {
      toastError(error instanceof Error ? error.message : errors.saveFailed);
    } finally {
      setLoading(false);
    }
  }

  async function saveMeeting(meetingId: string, form: HTMLFormElement) {
    setLoading(true);
    const data = new FormData(form);
    try {
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.get("title"),
          meeting_at: data.get("meeting_at"),
          notes: data.get("notes"),
          decisions: data.get("decisions"),
          agenda_text: data.get("agenda_text")
        })
      });
      if (!response.ok) throw new Error(await readApiError(response, errors.saveFailed));
      setEditingId(null);
      toastSaved("บันทึกการประชุมแล้ว");
      router.refresh();
    } catch (error) {
      toastError(error instanceof Error ? error.message : errors.saveFailed);
    } finally {
      setLoading(false);
    }
  }

  function removeMeeting(id: string, title: string) {
    toastConfirm(`ลบการประชุม「${title}」?`, async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/meetings/${id}`, { method: "DELETE" });
        if (!response.ok) throw new Error(await readApiError(response, errors.saveFailed));
        toastDeleted("ลบการประชุมแล้ว");
        router.refresh();
      } catch (error) {
        toastError(error instanceof Error ? error.message : errors.saveFailed);
      } finally {
        setLoading(false);
      }
    });
  }

  return (
    <div className="rounded-md border border-[#e7e2d7] bg-white p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap justify-between gap-2">
        <h2 className="text-base font-black">จัดการการประชุม</h2>
        <Button variant="gold" onClick={() => setOpen((v) => !v)}>
          {open ? "ปิดฟอร์ม" : "สร้างการประชุม"}
        </Button>
      </div>

      {open ? (
        <form onSubmit={createMeeting} className="mb-4 grid gap-2 rounded-md border bg-[#fbfaf5] p-3 sm:grid-cols-2">
          <label className="text-xs font-bold sm:col-span-2">
            ชื่อการประชุม
            <input name="title" className="mt-1 h-9 w-full rounded border px-2 text-sm" required />
          </label>
          <label className="text-xs font-bold">
            วันเวลา (พ.ศ.)
            <div className="mt-1">
              <FormDateTimeField name="meeting_at" required />
            </div>
          </label>
          <label className="text-xs font-bold sm:col-span-2">
            วาระ (หนึ่งบรรทัดต่อหัวข้อ)
            <textarea name="agenda_text" className="mt-1 w-full rounded border px-2 py-1 text-sm" rows={3} />
          </label>
          <label className="text-xs font-bold sm:col-span-2">
            บันทึก
            <textarea name="notes" className="mt-1 w-full rounded border px-2 py-1 text-sm" rows={2} />
          </label>
          <label className="text-xs font-bold sm:col-span-2">
            มติ
            <textarea name="decisions" className="mt-1 w-full rounded border px-2 py-1 text-sm" rows={2} />
          </label>
          <p className="text-xs font-bold text-[#667085] sm:col-span-2">Action item แรก (ไม่บังคับ)</p>
          <label className="text-xs font-bold sm:col-span-2">
            หัวข้อมติ
            <input name="action_title" className="mt-1 h-9 w-full rounded border px-2 text-sm" />
          </label>
          <label className="text-xs font-bold sm:col-span-2">
            รายละเอียด
            <input name="action_description" className="mt-1 h-9 w-full rounded border px-2 text-sm" />
          </label>
          <label className="text-xs font-bold">
            ผู้รับผิดชอบ
            <input name="action_owner" className="mt-1 h-9 w-full rounded border px-2 text-sm" />
          </label>
          <label className="text-xs font-bold">
            กำหนดส่ง (พ.ศ.)
            <div className="mt-1">
              <FormDateField name="action_due" />
            </div>
          </label>
          <label className="text-xs font-bold sm:col-span-2">
            ผูกภารกิจ
            <select name="action_task_id" className="mt-1 h-9 w-full rounded border px-2 text-sm" defaultValue="">
              <option value="">— ไม่ผูก —</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.code} · {t.title}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit" variant="gold" disabled={loading} className="sm:col-span-2">
            บันทึก
          </Button>
        </form>
      ) : null}

      <div className="space-y-2">
        {meetings.map((meeting) => (
          <div key={meeting.id} className="rounded border p-2">
            <div className="flex flex-wrap justify-between gap-2">
              <b className="text-sm">{meeting.title}</b>
              <div className="flex gap-2">
                <button type="button" className="text-xs font-bold text-[#123f76]" onClick={() => setEditingId(editingId === meeting.id ? null : meeting.id)}>
                  แก้ไข
                </button>
                <button type="button" className="text-xs font-bold text-[#b91528]" onClick={() => removeMeeting(meeting.id, meeting.title)}>
                  ลบ
                </button>
              </div>
            </div>
            {editingId === meeting.id ? (
              <form
                key={`edit-${meeting.id}`}
                className="mt-2 grid gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  void saveMeeting(meeting.id, e.currentTarget);
                }}
              >
                <input name="title" defaultValue={meeting.title} className="h-9 rounded border px-2 text-sm" required />
                <FormDateTimeField name="meeting_at" defaultValue={meeting.meeting_at} required />
                <textarea
                  name="agenda_text"
                  defaultValue={meeting.agendas.sort((a, b) => a.order - b.order).map((a) => a.title).join("\n")}
                  className="rounded border px-2 py-1 text-sm"
                  rows={3}
                />
                <textarea name="notes" defaultValue={meeting.notes} className="rounded border px-2 py-1 text-sm" rows={2} />
                <textarea name="decisions" defaultValue={meeting.decisions} className="rounded border px-2 py-1 text-sm" rows={2} />
                <Button type="submit" variant="gold" disabled={loading}>
                  บันทึก
                </Button>
              </form>
            ) : (
              <p className="mt-1 text-xs text-[#667085]">
                {formatThaiDateTime(meeting.meeting_at)} · {meeting.agendas.length} วาระ · {meeting.actionItems.length} action
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
