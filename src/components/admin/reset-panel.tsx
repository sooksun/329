"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toastConfirm, toastError, toastInfo } from "@/lib/toast";
import { cn } from "@/lib/utils";

type Counts = {
  tasks: number;
  subtasks: number;
  evidence: number;
  risks: number;
  meetings: number;
  budgetTx: number;
  snapshots: number;
  notifications: number;
  comments: number;
};

const CONFIRM_WORD = "RESET";

export function ResetPanel({
  project,
  counts
}: {
  project: { id: string; name: string; edition: string };
  counts: Counts;
}) {
  const router = useRouter();
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<null | Record<string, number>>(null);
  const ready = confirm.trim() === CONFIRM_WORD && !loading;

  async function runReset() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: CONFIRM_WORD, projectId: project.id })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toastError(data.error ?? "รีเซ็ตข้อมูลไม่สำเร็จ");
        return;
      }
      setDone(data.summary ?? {});
      setConfirm("");
      toastInfo("รีเซ็ตข้อมูลเรียบร้อย — ระบบพร้อมเริ่มงานจริงแล้ว");
      router.refresh();
    } catch {
      toastError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit() {
    if (!ready) return;
    toastConfirm(
      `ยืนยันรีเซ็ตข้อมูลของโปรเจกต์ "${project.name}" (ครั้งที่ ${project.edition})? การกระทำนี้ย้อนกลับไม่ได้`,
      runReset
    );
  }

  const willDelete = [
    { label: "หลักฐาน (Evidence) + ไฟล์แนบ", value: counts.evidence },
    { label: "ความเสี่ยง (Risk)", value: counts.risks },
    { label: "การประชุม + วาระ + มติ", value: counts.meetings },
    { label: "ธุรกรรมงบประมาณ", value: counts.budgetTx },
    { label: "สแนปช็อต/รายงาน", value: counts.snapshots },
    { label: "การแจ้งเตือน", value: counts.notifications },
    { label: "ความคิดเห็นในภารกิจ", value: counts.comments }
  ];

  return (
    <div className="space-y-6">
      {/* คำเตือน */}
      <div className="rounded-lg border border-[#f2bdc4] bg-[#fff5f6] p-4">
        <p className="text-sm font-black text-[#b91528]">⚠ การรีเซ็ตนี้ลบข้อมูลถาวรและย้อนกลับไม่ได้</p>
        <p className="mt-1 text-sm text-[#7a2230]">
          ใช้เพื่อ <b>เริ่มใช้งานระบบจริง</b> — ล้างข้อมูลทดสอบ/สาธิตออก โดย<b>คงโครงสร้างงานทั้งหมดไว้</b>
        </p>
      </div>

      {/* คงไว้ / ลบ */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-[#bfe3c9] bg-[#f3faf4] p-4">
          <p className="text-sm font-black text-[#137a3a]">คงไว้ (ไม่ลบ)</p>
          <ul className="mt-2 space-y-1 text-sm text-[#1f5132]">
            <li>• ภารกิจ {counts.tasks} งาน + งานย่อย {counts.subtasks} รายการ</li>
            <li>• ผู้รับผิดชอบ / ผู้ตรวจ / กำหนดการ / ผัง dependency</li>
            <li>• คณะอนุกรรมการ / แผนงาน / รายการงบที่วางแผน</li>
            <li>• ผู้ใช้ / บทบาท / สิทธิ์ / องค์กร</li>
          </ul>
        </div>
        <div className="rounded-lg border border-[#f1d4b0] bg-[#fdf6ec] p-4">
          <p className="text-sm font-black text-[#9a6a1e]">รีเซ็ตเป็น 0 / ยังไม่เริ่ม</p>
          <ul className="mt-2 space-y-1 text-sm text-[#6b4d1c]">
            <li>• สถานะ + ความคืบหน้าของภารกิจ/งานย่อยทั้งหมด</li>
            <li>• ความคืบหน้าของแผน/คณะ/โครงการ</li>
            <li>• ยอดงบที่ใช้จริง (กลับเป็นแผน)</li>
          </ul>
        </div>
      </div>

      {/* รายการที่จะลบ */}
      <div className="rounded-lg border border-[#e7e2d7] bg-white p-4">
        <p className="text-sm font-black text-[#142844]">ข้อมูลปฏิบัติงานที่จะถูกลบ</p>
        <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
          {willDelete.map((row) => (
            <div key={row.label} className="flex items-baseline justify-between gap-2 border-b border-dashed border-[#eee] pb-1">
              <span className="text-sm text-[#667085]">{row.label}</span>
              <span className="font-mono text-sm font-bold text-[#b91528]">{row.value}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-[#9aa1ad]">
          หมายเหตุ: Audit Log (ร่องรอยการทำงานระดับระบบ) จะถูกคงไว้ และการรีเซ็ตนี้จะถูกบันทึกด้วย
        </p>
      </div>

      {done ? (
        <div className="rounded-lg border border-[#bfe3c9] bg-[#f3faf4] p-4 text-sm text-[#1f5132]">
          <p className="font-black text-[#137a3a]">รีเซ็ตเรียบร้อย ✓</p>
          <p className="mt-1">
            ลบ: หลักฐาน {done.evidence ?? 0}, ไฟล์ {done.fileAssets ?? 0}, ความเสี่ยง {done.risks ?? 0}, ประชุม {done.meetings ?? 0},
            ธุรกรรมงบ {done.budgetTransactions ?? 0}, สแนปช็อต {done.snapshots ?? 0}, แจ้งเตือน {done.notifications ?? 0}, คอมเมนต์ {done.comments ?? 0} ·
            รีเซ็ตภารกิจ {done.tasksReset ?? 0} / งานย่อย {done.subtasksReset ?? 0} / งบ {done.budgetItemsReset ?? 0}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-[#e7e2d7] bg-[#fbfaf5] p-4">
          <label htmlFor="reset-confirm" className="block text-sm font-bold text-[#142844]">
            พิมพ์ <span className="font-mono font-black text-[#b91528]">{CONFIRM_WORD}</span> เพื่อยืนยัน
          </label>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <input
              id="reset-confirm"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="off"
              placeholder={CONFIRM_WORD}
              className="w-full rounded-md border border-[#d8d1c1] bg-white px-3 py-2.5 text-sm font-mono outline-none focus:border-[#b91528] sm:max-w-xs"
            />
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!ready}
              className={cn(
                "inline-flex min-h-11 items-center justify-center rounded-md px-6 text-sm font-bold text-white transition",
                ready ? "bg-[#b91528] hover:bg-[#9d1221]" : "cursor-not-allowed bg-[#e3a7af]"
              )}
            >
              {loading ? "กำลังรีเซ็ต..." : "รีเซ็ตข้อมูลเริ่มงานจริง"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
