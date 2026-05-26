"use client";

import Link from "next/link";
import { useState } from "react";
import { linkButtonClasses } from "@/lib/button-styles";
import { toastInfo } from "@/lib/toast";
import { cn } from "@/lib/utils";

export function RegisterForm() {
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const village = String(form.get("village") ?? "").trim();
    const contactName = String(form.get("contactName") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();

    if (!village || !contactName || !phone) {
      setLoading(false);
      toastInfo("กรุณากรอกหมู่บ้าน ชื่อผู้ติดต่อ และเบอร์โทรให้ครบ");
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 400));
    setLoading(false);
    toastInfo("รับแจ้งความประสงค์แล้ว — คณะกรรมการจะติดต่อกลับเมื่อเปิดรับลงทะเบียนอย่างเป็นทางการ");
    event.currentTarget.reset();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="village" className="mb-1 block text-sm font-bold">
          หมู่บ้าน / ทีม
        </label>
        <input
          id="village"
          name="village"
          required
          className="w-full rounded-md border border-[#d8d1c1] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#142844]"
          placeholder="เช่น บ้านพญาไพร"
        />
      </div>
      <div>
        <label htmlFor="contactName" className="mb-1 block text-sm font-bold">
          ชื่อผู้ติดต่อ
        </label>
        <input
          id="contactName"
          name="contactName"
          required
          className="w-full rounded-md border border-[#d8d1c1] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#142844]"
          placeholder="ชื่อ-นามสกุล"
        />
      </div>
      <div>
        <label htmlFor="phone" className="mb-1 block text-sm font-bold">
          เบอร์โทร
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          required
          className="w-full rounded-md border border-[#d8d1c1] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#142844]"
          placeholder="08x-xxx-xxxx"
        />
      </div>
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-bold">
          อีเมล (ถ้ามี)
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className="w-full rounded-md border border-[#d8d1c1] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#142844]"
          placeholder="email@example.com"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className={cn(linkButtonClasses("gold", "w-full min-h-12 text-base"), loading && "opacity-70")}
      >
        {loading ? "กำลังส่ง..." : "ส่งความประสงค์เข้าร่วม"}
      </button>
      <p className="text-center text-xs text-[#667085]">
        มีบัญชี MIS แล้ว?{" "}
        <Link href="/login" className="font-bold text-[#142844] underline-offset-2 hover:underline">
          เข้าสู่ระบบ
        </Link>
      </p>
    </form>
  );
}
