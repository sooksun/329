"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui";

type ProfileFormProps = {
  initial: { name: string; username: string };
};

export function ProfileForm({ initial }: ProfileFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(form.get("name") ?? ""),
          username: String(form.get("username") ?? ""),
          current_password: String(form.get("current_password") ?? "") || undefined,
          password: String(form.get("password") ?? "") || undefined
        })
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? "บันทึกไม่สำเร็จ");
      setMessage("บันทึกโปรไฟล์แล้ว — ถ้าเปลี่ยนรหัสผ่าน ให้ใช้รหัสใหม่ครั้งถัดไป");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={save}>
      <label className="block text-sm font-bold">
        ชื่อ-นามสกุล
        <input name="name" className="mt-1 h-11 w-full rounded-md border px-3" defaultValue={initial.name} required />
      </label>
      <label className="block text-sm font-bold">
        ชื่อผู้ใช้ (ไม่ต้องเป็นอีเมล)
        <input
          name="username"
          className="mt-1 h-11 w-full rounded-md border px-3"
          defaultValue={initial.username}
          autoComplete="username"
          pattern="[a-z0-9][a-z0-9._-]{2,31}"
          required
        />
        <span className="mt-1 block text-xs text-[#667085]">ใช้ตัวพิมพ์เล็ก a-z ตัวเลข . _ - อย่างน้อย 3 ตัว</span>
      </label>
      <hr className="border-[#e7e2d7]" />
      <p className="text-sm font-bold text-[#123f76]">เปลี่ยนรหัสผ่าน (เว้นว่างถ้าไม่เปลี่ยน)</p>
      <label className="block text-sm font-bold">
        รหัสผ่านปัจจุบัน
        <input name="current_password" type="password" className="mt-1 h-11 w-full rounded-md border px-3" autoComplete="current-password" />
      </label>
      <label className="block text-sm font-bold">
        รหัสผ่านใหม่
        <input name="password" type="password" className="mt-1 h-11 w-full rounded-md border px-3" minLength={6} autoComplete="new-password" />
      </label>
      <Button type="submit" variant="gold" disabled={saving} className="w-full justify-center sm:w-auto">
        {saving ? "กำลังบันทึก..." : "บันทึกโปรไฟล์"}
      </Button>
      {message ? <p className="text-sm font-bold text-[#123f76]">{message}</p> : null}
    </form>
  );
}
