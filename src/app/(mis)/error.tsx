"use client";

import { useEffect } from "react";

/** ข้อผิดพลาดระหว่างโหลดหน้า MIS (เช่น DB ขัดข้อง) — แสดงข้อความและให้ลองใหม่ แทนหน้า error ดิบของ Next */
export default function MisError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto grid max-w-lg gap-3 rounded-md border border-[#f3c2c9] bg-[#fff5f6] p-6 text-center">
      <h1 className="text-lg font-black text-[#b91528]">โหลดหน้านี้ไม่สำเร็จ</h1>
      <p className="text-sm text-[#667085]">
        ระบบขัดข้องชั่วคราว ลองใหม่อีกครั้ง หากยังเกิดซ้ำโปรดแจ้งผู้ดูแลระบบ
        {error.digest ? ` (รหัสอ้างอิง ${error.digest})` : ""}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mx-auto min-h-[44px] rounded-md bg-[#123f76] px-5 font-bold text-white hover:bg-[#0e325e]"
      >
        ลองใหม่
      </button>
    </div>
  );
}
