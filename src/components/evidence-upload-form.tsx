"use client";

import { Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui";
import { emitNotificationsChanged } from "@/lib/notification-events";

type UploadTask = {
  id: string;
  code: string;
  title: string;
  committeeName: string;
};

export function EvidenceUploadForm({ tasks }: { tasks: UploadTask[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const form = new FormData(event.currentTarget);
      const response = await fetch("/api/evidence/upload", {
        method: "POST",
        body: form
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "อัปโหลดไม่สำเร็จ");
      }
      event.currentTarget.reset();
      setMessage("อัปโหลดหลักฐานแล้ว รอตรวจอนุมัติ");
      emitNotificationsChanged();
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "อัปโหลดไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="grid gap-3 rounded-md border border-[#e7e2d7] bg-white p-4 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_auto]"
    >
      <label className="block text-sm font-bold sm:col-span-2 lg:col-span-1">
        ภารกิจ
        <select name="task_id" className="mt-1 h-11 w-full rounded-md border px-3" required defaultValue={tasks[0]?.id ?? ""}>
          {tasks.map((task) => (
            <option key={task.id} value={task.id}>
              {task.code} · {task.title} · {task.committeeName}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-bold">
        คำอธิบายหลักฐาน
        <input name="caption" className="mt-1 h-11 w-full rounded-md border px-3" placeholder="เช่น ภาพจุดลงทะเบียน" required />
      </label>
      <label className="block text-sm font-bold">
        ไฟล์
        <input name="file" type="file" className="mt-1 h-11 w-full rounded-md border px-3 py-2 text-sm" required />
      </label>
      <div className="sm:col-span-2 lg:col-span-1 lg:flex lg:items-end">
        <Button type="submit" variant="gold" disabled={loading} className="min-h-[44px] w-full justify-center">
          <Upload size={16} /> {loading ? "กำลังอัปโหลด..." : "อัปโหลด"}
        </Button>
      </div>
      {message ? <p className="text-sm font-bold text-[#123f76] sm:col-span-2 lg:col-span-4">{message}</p> : null}
    </form>
  );
}
