"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge, Button } from "@/components/ui";
import { errors, readApiError } from "@/lib/messages";
import { formatBaht, thaiStatus } from "@/lib/utils";

export type BudgetTransactionRow = {
  id: string;
  amount: number;
  status: string;
  note: string | null;
  created_at: string;
  created_by_name: string;
};

const statusOptions = ["REQUESTED", "APPROVED", "COMMITTED", "PAID", "VERIFIED"] as const;

export function BudgetTransactionsPanel({
  budgetItemId,
  initialTransactions,
  canManage
}: {
  budgetItemId: string;
  initialTransactions: BudgetTransactionRow[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [transactions, setTransactions] = useState(initialTransactions);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function addTransaction(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(`/api/budget/items/${budgetItemId}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(form.get("amount")),
          status: String(form.get("status") ?? "PAID"),
          note: String(form.get("note") ?? "")
        })
      });
      if (!response.ok) throw new Error(await readApiError(response, errors.saveFailed));
      event.currentTarget.reset();
      setMessage("บันทึกธุรกรรมแล้ว — ยอดใช้จริงอัปเดตจากรายการ PAID/VERIFIED");
      await reload();
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : errors.saveFailed);
    } finally {
      setLoading(false);
    }
  }

  async function reload() {
    const response = await fetch(`/api/budget/items/${budgetItemId}/transactions`);
    if (!response.ok) return;
    const body = (await response.json()) as { items: BudgetTransactionRow[] };
    setTransactions(body.items ?? []);
  }

  async function removeTransaction(id: string) {
    if (!window.confirm("ลบธุรกรรมนี้? ยอดใช้จริงจะคำนวณใหม่")) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/budget/items/${budgetItemId}/transactions/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(await readApiError(response, errors.saveFailed));
      setMessage("ลบธุรกรรมแล้ว");
      await reload();
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : errors.saveFailed);
    } finally {
      setLoading(false);
    }
  }

  function formatWhen(iso: string) {
    try {
      return new Date(iso).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" });
    } catch {
      return "";
    }
  }

  const paidTotal = transactions
    .filter((tx) => tx.status === "PAID" || tx.status === "VERIFIED")
    .reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <div className="mt-2 border-t border-[#e7e2d7] pt-2">
      <button
        type="button"
        className="text-xs font-bold text-[#123f76] hover:underline"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "ปิดธุรกรรม" : `ธุรกรรม (${transactions.length}) · รวมจ่าย ${formatBaht(paidTotal)}`}
      </button>

      {open ? (
        <div className="mt-2 space-y-2">
          <p className="text-[11px] leading-snug text-[#667085]">
            ยอดใช้จริงของรายการ = ผลรวมธุรกรรมสถานะ จ่ายแล้ว (PAID) / ตรวจแล้ว (VERIFIED)
          </p>

          {canManage ? (
            <form onSubmit={addTransaction} className="grid gap-2 rounded-md border bg-[#fbfaf5] p-2 sm:grid-cols-2">
              <label className="text-xs font-bold">
                จำนวน (บาท)
                <input name="amount" type="number" min={0} step={0.01} className="mt-1 h-9 w-full rounded border px-2 text-sm" required />
              </label>
              <label className="text-xs font-bold">
                สถานะ
                <select name="status" className="mt-1 h-9 w-full rounded border px-2 text-sm" defaultValue="PAID">
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>
                      {thaiStatus(s)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-bold sm:col-span-2">
                หมายเหตุ
                <input name="note" className="mt-1 h-9 w-full rounded border px-2 text-sm" placeholder="เลขที่ใบเสร็จ / รายละเอียด" />
              </label>
              <Button type="submit" variant="gold" disabled={loading} className="sm:col-span-2">
                {loading ? "กำลังบันทึก..." : "บันทึกธุรกรรม"}
              </Button>
            </form>
          ) : null}

          <ul className="max-h-48 space-y-1 overflow-y-auto">
            {transactions.length === 0 ? (
              <li className="text-xs text-[#667085]">ยังไม่มีธุรกรรม</li>
            ) : (
              transactions.map((tx) => (
                <li key={tx.id} className="flex flex-wrap items-start justify-between gap-1 rounded border px-2 py-1.5 text-xs">
                  <div>
                    <b>{formatBaht(tx.amount)}</b>
                    <span className="ml-2">
                      <Badge tone={tx.status === "PAID" || tx.status === "VERIFIED" ? "green" : "gold"}>
                        {thaiStatus(tx.status)}
                      </Badge>
                    </span>
                    {tx.note ? <p className="mt-0.5 text-[#667085]">{tx.note}</p> : null}
                    <p className="text-[10px] text-[#98a2b3]">
                      {tx.created_by_name} · {formatWhen(tx.created_at)}
                    </p>
                  </div>
                  {canManage ? (
                    <button
                      type="button"
                      className="font-bold text-[#b91528] hover:underline"
                      onClick={() => removeTransaction(tx.id)}
                      disabled={loading}
                    >
                      ลบ
                    </button>
                  ) : null}
                </li>
              ))
            )}
          </ul>
          {message ? <p className="text-xs font-bold text-[#123f76]">{message}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
