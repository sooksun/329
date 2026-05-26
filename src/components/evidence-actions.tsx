"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui";
import { emitNotificationsChanged } from "@/lib/notification-events";
import { toastError, toastSaved } from "@/lib/toast";

export function EvidenceActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  async function review(nextStatus: "APPROVED" | "REJECTED", rejection_reason?: string) {
    setLoading(nextStatus);
    try {
      const response = await fetch("/api/evidence/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status: nextStatus,
          ...(nextStatus === "REJECTED" && rejection_reason?.trim()
            ? { rejection_reason: rejection_reason.trim() }
            : {})
        })
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "บันทึกผลตรวจไม่สำเร็จ");
      }
      toastSaved(nextStatus === "APPROVED" ? "อนุมัติแล้ว" : "บันทึกว่าไม่ผ่านแล้ว — แจ้งผู้อัปโหลดแล้ว");
      setRejectOpen(false);
      setRejectReason("");
      emitNotificationsChanged();
      router.refresh();
    } catch (error) {
      toastError(error instanceof Error ? error.message : "บันทึกผลตรวจไม่สำเร็จ");
    } finally {
      setLoading(null);
    }
  }

  if (status !== "PENDING") return null;

  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button variant="gold" onClick={() => review("APPROVED")} disabled={Boolean(loading)} className="w-full justify-center sm:w-auto">
          {loading === "APPROVED" ? "กำลังอนุมัติ..." : "อนุมัติ"}
        </Button>
        <Button
          variant="danger"
          onClick={() => setRejectOpen((value) => !value)}
          disabled={Boolean(loading)}
          className="w-full justify-center sm:w-auto"
        >
          ไม่ผ่าน
        </Button>
      </div>
      {rejectOpen ? (
        <div className="space-y-2 rounded-md border border-[#f0d4d8] bg-[#fff8f8] p-3">
          <label className="block text-sm font-bold">
            เหตุผลที่ไม่ผ่าน (ไม่บังคับ)
            <textarea
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              rows={2}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="เช่น ภาพไม่ชัด ขาดวันที่ถ่าย"
            />
          </label>
          <Button
            variant="danger"
            onClick={() => review("REJECTED", rejectReason)}
            disabled={loading === "REJECTED"}
            className="w-full justify-center sm:w-auto"
          >
            {loading === "REJECTED" ? "กำลังบันทึก..." : "ยืนยันไม่ผ่าน"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
