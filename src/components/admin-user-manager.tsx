"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge, Button } from "@/components/ui";
import { toastCreated, toastError, toastUpdated } from "@/lib/toast";

type CommitteeOption = { id: string; name: string };

type AdminUserRow = {
  id: string;
  name: string;
  username: string;
  roles: Array<{ role: { name: string; label: string } }>;
  committeeLinks: Array<{ position: string; committee: { id: string; name: string } }>;
};

const ROLE_OPTIONS = [
  { value: "Task Owner", label: "ผู้รับผิดชอบงาน" },
  { value: "Committee Lead", label: "หัวหน้าฝ่าย" },
  { value: "Data Recorder", label: "เจ้าหน้าที่บันทึก" },
  { value: "Finance Officer", label: "การเงิน" },
  { value: "Evidence Reviewer", label: "ตรวจหลักฐาน" },
  { value: "Viewer", label: "ดูอย่างเดียว" }
];
const ASSIGNABLE_ROLES = new Set(ROLE_OPTIONS.map((r) => r.value));

export function AdminUserManager({
  users,
  committees
}: {
  users: AdminUserRow[];
  committees: CommitteeOption[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<AdminUserRow | null>(null);

  async function createUser(event: React.FormEvent<HTMLFormElement>) {
    // เก็บ form ไว้ก่อน await — React ตั้ง event.currentTarget เป็น null หลัง handler ทำงานเสร็จ
    const formElement = event.currentTarget;
    event.preventDefault();
    setSaving(true);
    const form = new FormData(formElement);
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
      formElement.reset();
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
            <input name="password" type="password" className="mt-1 h-11 w-full rounded-md border px-3" minLength={10} required />
          </label>
          <label className="text-sm font-bold">
            บทบาท
            <select name="role_name" className="mt-1 h-11 w-full rounded-md border px-3" defaultValue="Task Owner">
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
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
                <th className="py-2 pr-3">คณะ</th>
                <th className="py-2 text-right">จัดการ</th>
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
                  <td className="py-2 pr-3 text-xs text-[#667085]">
                    {user.committeeLinks.map((l) => l.committee.name).join(", ") || "—"}
                  </td>
                  <td className="py-2 text-right">
                    <Button variant="ghost" onClick={() => setEditing(user)}>
                      แก้ไขข้อมูล
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing ? (
        <EditUserDialog
          key={editing.id}
          user={editing}
          committees={committees}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}

function EditUserDialog({
  user,
  committees,
  onClose,
  onSaved
}: {
  user: AdminUserRow;
  committees: CommitteeOption[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const assignedRoles = user.roles.filter((r) => ASSIGNABLE_ROLES.has(r.role.name));
  const currentRole = assignedRoles[0]?.role.name ?? "";
  const systemRoles = user.roles.filter((r) => !ASSIGNABLE_ROLES.has(r.role.name));
  const committeeIds = new Set(committees.map((c) => c.id));
  const currentLink = user.committeeLinks.find((l) => committeeIds.has(l.committee.id));

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    const formElement = event.currentTarget;
    event.preventDefault();
    setSaving(true);
    const form = new FormData(formElement);
    // ส่งบทบาทเฉพาะเมื่อเปลี่ยนจริง — ผู้ใช้บางคนมีหลายบทบาท ถ้าส่งทุกครั้งจะถูกยุบเหลือบทบาทเดียว
    const selectedRole = String(form.get("role_name") ?? "");
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(form.get("name") ?? ""),
          username: String(form.get("username") ?? ""),
          password: String(form.get("password") ?? "") || undefined,
          role_name: selectedRole && selectedRole !== currentRole ? selectedRole : undefined,
          committee_id: String(form.get("committee_id") ?? ""),
          position: String(form.get("position") ?? "") || undefined
        })
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? "บันทึกไม่สำเร็จ");
      toastUpdated(`บันทึกข้อมูล ${body.username ?? user.username} แล้ว`);
      onSaved();
    } catch (error) {
      toastError(error instanceof Error ? error.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-user-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        className="max-h-[90vh] w-full max-w-xl space-y-3 overflow-y-auto rounded-md bg-white p-4 shadow-xl sm:p-6"
        onSubmit={save}
      >
        <h2 id="edit-user-title" className="text-base font-black">
          แก้ไขข้อมูลผู้ใช้
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-bold sm:col-span-2">
            ชื่อ-นามสกุล
            <input name="name" defaultValue={user.name} className="mt-1 h-11 w-full rounded-md border px-3" required />
          </label>
          <label className="text-sm font-bold">
            ชื่อผู้ใช้
            <input
              name="username"
              defaultValue={user.username}
              className="mt-1 h-11 w-full rounded-md border px-3"
              pattern="[a-z0-9][a-z0-9._-]{2,31}"
              required
            />
          </label>
          <label className="text-sm font-bold">
            รีเซ็ตรหัสผ่าน
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              className="mt-1 h-11 w-full rounded-md border px-3"
              minLength={10}
              placeholder="เว้นว่างถ้าไม่เปลี่ยน"
            />
          </label>
          <label className="text-sm font-bold">
            บทบาท
            <select name="role_name" className="mt-1 h-11 w-full rounded-md border px-3" defaultValue={currentRole}>
              {currentRole ? null : <option value="">— ไม่เปลี่ยน —</option>}
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            {assignedRoles.length > 1 ? (
              <span className="mt-1 block text-xs font-normal text-[#667085]">
                ปัจจุบันมี {assignedRoles.length} บทบาท: {assignedRoles.map((r) => r.role.label).join(", ")} — ถ้าเปลี่ยน จะเหลือบทบาทที่เลือกเพียงบทบาทเดียว
              </span>
            ) : null}
            {systemRoles.length ? (
              <span className="mt-1 block text-xs font-normal text-[#667085]">
                บทบาทระบบคงเดิม: {systemRoles.map((r) => r.role.label).join(", ")}
              </span>
            ) : null}
          </label>
          <label className="text-sm font-bold">
            คณะกรรมการ
            <select
              name="committee_id"
              className="mt-1 h-11 w-full rounded-md border px-3"
              defaultValue={currentLink?.committee.id ?? ""}
            >
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
            <input
              name="position"
              defaultValue={currentLink?.position ?? ""}
              className="mt-1 h-11 w-full rounded-md border px-3"
              placeholder="เช่น เจ้าหน้าที่ฝ่ายกีฬา"
            />
          </label>
        </div>
        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <Button onClick={onClose} disabled={saving}>
            ยกเลิก
          </Button>
          <Button type="submit" variant="gold" disabled={saving}>
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </Button>
        </div>
      </form>
    </div>
  );
}
