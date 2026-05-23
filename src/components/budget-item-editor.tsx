"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui";
import { errors, readApiError } from "@/lib/messages";
import { thaiStatus } from "@/lib/utils";

type BudgetItemEditorProps = {
  id: string;
  title: string;
  status: string;
  receiptNo: string | null;
  actualAmount: number;
  approvedAmount: number;
  requestedAmount: number;
};

const statusOptions = ["DRAFT", "REQUESTED", "APPROVED", "COMMITTED", "PAID", "VERIFIED"] as const;

export function BudgetItemEditor({
  id,
  title,
  status,
  receiptNo,
  actualAmount,
  approvedAmount,
  requestedAmount
}: BudgetItemEditorProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    actual_amount: String(actualAmount),
    approved_amount: String(approvedAmount),
    requested_amount: String(requestedAmount),
    status,
    receipt_no: receiptNo ?? ""
  });

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`/api/budget/items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actual_amount: Number(form.actual_amount),
          approved_amount: Number(form.approved_amount),
          requested_amount: Number(form.requested_amount),
          status: form.status,
          receipt_no: form.receipt_no.trim() || null
        })
      });
      if (!response.ok) throw new Error(await readApiError(response, errors.saveFailed));
      setMessage("บันทึกแล้ว");
      setOpen(false);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : errors.saveFailed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-2 border-t border-[#e7e2d7] pt-2">
      <button
        type="button"
        className="text-xs font-bold text-[#123f76] hover:underline"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? "ปิดฟอร์มแก้ไข" : "แก้ไขงบ (ฝ่ายการเงิน)"}
      </button>
      {open ? (
        <form onSubmit={save} className="mt-2 space-y-2 rounded-md border border-[#e7e2d7] bg-[#fbfaf5] p-3">
          <p className="text-xs font-bold text-[#667085]">{title}</p>
          <label className="block text-xs">
            ใช้จริง (บาท)
            <input
              type="number"
              min={0}
              step={0.01}
              className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
              value={form.actual_amount}
              onChange={(e) => setForm((f) => ({ ...f, actual_amount: e.target.value }))}
            />
            <span className="mt-0.5 block text-[10px] font-normal text-[#667085]">
              ถ้ามีธุรกรรมด้านล่าง ยอดนี้จะถูกคำนวณจาก PAID/VERIFIED อัตโนมัติ
            </span>
          </label>
          <label className="block text-xs">
            อนุมัติ (บาท)
            <input
              type="number"
              min={0}
              step={0.01}
              className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
              value={form.approved_amount}
              onChange={(e) => setForm((f) => ({ ...f, approved_amount: e.target.value }))}
            />
          </label>
          <label className="block text-xs">
            ขอเบิก (บาท)
            <input
              type="number"
              min={0}
              step={0.01}
              className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
              value={form.requested_amount}
              onChange={(e) => setForm((f) => ({ ...f, requested_amount: e.target.value }))}
            />
          </label>
          <label className="block text-xs">
            สถานะ
            <select
              className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            >
              {statusOptions.map((value) => (
                <option key={value} value={value}>
                  {thaiStatus(value)}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs">
            เลขที่ใบเสร็จ
            <input
              className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
              value={form.receipt_no}
              onChange={(e) => setForm((f) => ({ ...f, receipt_no: e.target.value }))}
            />
          </label>
          <Button type="submit" variant="gold" disabled={loading} className="w-full justify-center">
            {loading ? "กำลังบันทึก..." : "บันทึกงบ"}
          </Button>
        </form>
      ) : null}
      {message ? <p className="mt-1 text-xs font-bold text-[#123f76]">{message}</p> : null}
    </div>
  );
}
