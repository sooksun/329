"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge, Button } from "@/components/ui";
import { toastCreated, toastError } from "@/lib/toast";

type CommitteeOption = { id: string; name: string };

type AdminUserRow = {
  id: string;
  name: string;
  username: string;
  roles: Array<{ role: { name: string; label: string } }>;
  committeeLinks: Array<{ position: string; committee: { id: string; name: string } }>;
};

export function AdminUserManager({
  users,
  committees
}: {
  users: AdminUserRow[];
  committees: CommitteeOption[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function createUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(form.get("name") ?? ""),
          username: String(form.get("username") ?? ""),
          password: String(form.get("password") ?? ""),
          role_name: String(form.get("role_name") ?? "Task Owner"),
          committee_id: String(form.get("committee_id") ?? "") || undefined,
          position: String(form.get("position") ?? "") || undefined
        })
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? "สร้างผู้ใช้ไม่สำเร็จ");
      toastCreated(`สร้างผู้ใช้ ${body.username} แล้ว`);
      event.currentTarget.reset();
      router.refresh();
    } catch (error) {
      toastError(error instanceof Error ? error.message : "สร้างผู้ใช้ไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <form className="rounded-md border border-[#e7e2d7] bg-[#fbfaf5] p-4 space-y-3" onSubmit={createUser}>
        <h2 className="text-base font-black">เพิ่มผู้ใช้ใหม่</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-bold sm:col-span-2">
            ชื่อ-นามสกุล
            <input name="name" className="mt-1 h-11 w-full rounded-md border px-3" required />
          </label>
          <label className="text-sm font-bold">
            ชื่อผู้ใช้
            <input name="username" className="mt-1 h-11 w-full rounded-md border px-3" pattern="[a-z0-9][a-z0-9._-]{2,31}" required />
          </label>
          <label className="text-sm font-bold">
            รหัสผ่านเริ่มต้น
            <input name="password" type="password" className="mt-1 h-11 w-full rounded-md border px-3" minLength={6} required />
          </label>
          <label className="text-sm font-bold">
            บทบาท
            <select name="role_name" className="mt-1 h-11 w-full rounded-md border px-3" defaultValue="Task Owner">
              <option value="Task Owner">ผู้รับผิดชอบงาน</option>
              <option value="Committee Lead">หัวหน้าฝ่าย</option>
              <option value="Data Recorder">เจ้าหน้าที่บันทึก</option>
              <option value="Finance Officer">การเงิน</option>
              <option value="Evidence Reviewer">ตรวจหลักฐาน</option>
              <option value="Viewer">ดูอย่างเดียว</option>
            </select>
          </label>
          <label className="text-sm font-bold">
            คณะกรรมการ
            <select name="committee_id" className="mt-1 h-11 w-full rounded-md border px-3" defaultValue="">
              <option value="">— ไม่ระบุ —</option>
              {committees.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-bold sm:col-span-2">
            ตำแหน่งในคณะ
            <input name="position" className="mt-1 h-11 w-full rounded-md border px-3" placeholder="เช่น เจ้าหน้าที่ฝ่ายกีฬา" />
          </label>
        </div>
        <Button type="submit" variant="gold" disabled={saving}>
          {saving ? "กำลังสร้าง..." : "สร้างผู้ใช้"}
        </Button>
      </form>

      <div className="space-y-2">
        <h2 className="text-base font-black">ผู้ใช้ในระบบ ({users.length})</h2>
        <div className="mis-table-scroll">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b text-xs text-[#667085]">
                <th className="py-2 pr-3">ชื่อ</th>
                <th className="py-2 pr-3">ชื่อผู้ใช้</th>
                <th className="py-2 pr-3">บทบาท</th>
                <th className="py-2">คณะ</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-[#f0ebe0]">
                  <td className="py-2 pr-3 font-bold">{user.name}</td>
                  <td className="py-2 pr-3">{user.username}</td>
                  <td className="py-2 pr-3">
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((r) => (
                        <Badge key={r.role.name} tone="blue">
                          {r.role.label}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="py-2 text-xs text-[#667085]">
                    {user.committeeLinks.map((l) => l.committee.name).join(", ") || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
