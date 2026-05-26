"use client";

import { useState } from "react";
import { toast, type Id } from "react-toastify";

function ConfirmToastBody({
  message,
  toastId,
  onConfirm
}: {
  message: string;
  toastId: Id;
  onConfirm: () => void | Promise<void>;
}) {
  const [busy, setBusy] = useState(false);

  return (
    <div className="min-w-[220px]">
      <p className="mb-3 text-sm font-bold leading-snug">{message}</p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy}
          className="rounded bg-[#b91528] px-3 py-1 text-xs font-bold text-white disabled:opacity-60"
          onClick={() => {
            void (async () => {
              setBusy(true);
              try {
                await onConfirm();
                toast.dismiss(toastId);
              } finally {
                setBusy(false);
              }
            })();
          }}
        >
          ยืนยัน
        </button>
        <button
          type="button"
          className="rounded border border-white/40 px-3 py-1 text-xs font-bold"
          onClick={() => toast.dismiss(toastId)}
        >
          ยกเลิก
        </button>
      </div>
    </div>
  );
}

export function toastConfirm(message: string, onConfirm: () => void | Promise<void>) {
  toast.warn(
    ({ toastProps }) => (
      <ConfirmToastBody message={message} toastId={toastProps.toastId} onConfirm={onConfirm} />
    ),
    { autoClose: false, closeButton: false, draggable: false }
  );
}

export function toastSaved(message = "บันทึกแล้ว") {
  toast.success(message);
}

export function toastCreated(message = "สร้างแล้ว") {
  toast.success(message);
}

export function toastUpdated(message = "อัปเดตแล้ว") {
  toast.success(message);
}

export function toastDeleted(message = "ลบแล้ว") {
  toast.success(message);
}

export function toastError(message: string) {
  toast.error(message);
}

export function toastInfo(message: string) {
  toast.info(message);
}
