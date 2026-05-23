"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge, Button } from "@/components/ui";
import { errors } from "@/lib/messages";

type UserOption = { id: string; name: string; username: string };

type MemberRow = {
  id: string;
  position: string;
  user: UserOption;
};

export type CommitteeRow = {
  id: string;
  name: string;
  owner_name: string;
  owner_initials: string;
  sort_order: number;
  risk_level: string;
  planned_budget: number;
  members: MemberRow[];
  _count: { tasks: number };
};

export function CommitteeManager({
  committees: initialCommittees,
  users,
  canManageGlobal,
  memberManageRights
}: {
  committees: CommitteeRow[];
  users: UserOption[];
  canManageGlobal: boolean;
  memberManageRights: Record<string, boolean>;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const canManageAny = canManageGlobal || Object.values(memberManageRights).some(Boolean);
  if (!canManageAny) return null;

  async function apiJson(url: string, init?: RequestInit) {
    const response = await fetch(url, { ...init, credentials: "same-origin" });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : errors.saveFailed);
    return body;
  }

  async function createCommittee(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading("create");
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      await apiJson("/api/committees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          owner_name: form.get("owner_name"),
          owner_initials: form.get("owner_initials"),
          sort_order: Number(form.get("sort_order") || 0),
          risk_level: form.get("risk_level"),
          planned_budget: Number(form.get("planned_budget") || 0)
        })
      });
      setMessage("สร้างคณะกรรมการแล้ว");
      event.currentTarget.reset();
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : errors.saveFailed);
    } finally {
      setLoading(null);
    }
  }

  async function saveCommittee(committeeId: string, form: HTMLFormElement) {
    setLoading(`edit-${committeeId}`);
    setMessage("");
    const data = new FormData(form);
    try {
      await apiJson(`/api/committees/${committeeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          owner_name: data.get("owner_name"),
          owner_initials: data.get("owner_initials"),
          sort_order: Number(data.get("sort_order")),
          risk_level: data.get("risk_level"),
          planned_budget: Number(data.get("planned_budget"))
        })
      });
      setMessage("บันทึกคณะแล้ว");
      setEditingId(null);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : errors.saveFailed);
    } finally {
      setLoading(null);
    }
  }

  async function deleteCommittee(committeeId: string, name: string) {
    if (!window.confirm(`ลบคณะ「${name}」? (ได้เฉพาะคณะที่ไม่มีภารกิจ)`)) return;
    setLoading(`del-${committeeId}`);
    setMessage("");
    try {
      await apiJson(`/api/committees/${committeeId}`, { method: "DELETE" });
      setMessage("ลบคณะแล้ว");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : errors.saveFailed);
    } finally {
      setLoading(null);
    }
  }

  async function addMember(committeeId: string, event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(`member-${committeeId}`);
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      await apiJson(`/api/committees/${committeeId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: form.get("user_id"),
          position: form.get("position")
        })
      });
      setMessage("เพิ่มสมาชิกแล้ว");
      event.currentTarget.reset();
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : errors.saveFailed);
    } finally {
      setLoading(null);
    }
  }

  async function removeMember(committeeId: string, memberId: string, userName: string) {
    if (!window.confirm(`ถอน ${userName} ออกจากคณะ?`)) return;
    setLoading(`rm-${memberId}`);
    try {
      await apiJson(`/api/committees/${committeeId}/members/${memberId}`, { method: "DELETE" });
      setMessage("ถอนสมาชิกแล้ว");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : errors.saveFailed);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-4 rounded-md border border-[#e7e2d7] bg-white p-4 sm:p-5">
      <div>
        <h2 className="text-base font-black sm:text-lg">จัดการคณะและสมาชิก</h2>
        <p className="mt-1 text-sm text-[#667085]">
          {canManageGlobal
            ? "เลขา/ผู้ดูแล: สร้างและแก้ไขคณะ · หัวหน้าฝ่าย: จัดการสมาชิกในคณะของตนเอง"
            : "หัวหน้าฝ่าย: เพิ่ม/ถอนสมาชิกในคณะของคุณ"}
        </p>
      </div>

      {canManageGlobal ? (
        <form onSubmit={createCommittee} className="grid gap-3 rounded-md border border-[#e7e2d7] bg-[#fbfaf5] p-3 sm:grid-cols-2">
          <h3 className="text-sm font-black sm:col-span-2">เพิ่มคณะกรรมการใหม่</h3>
          <label className="text-sm font-bold sm:col-span-2">
            ชื่อคณะ
            <input name="name" className="mt-1 h-10 w-full rounded-md border px-3" required />
          </label>
          <label className="text-sm font-bold">
            หัวหน้าคณะ (แสดง)
            <input name="owner_name" className="mt-1 h-10 w-full rounded-md border px-3" required />
          </label>
          <label className="text-sm font-bold">
            ตัวย่อ
            <input name="owner_initials" className="mt-1 h-10 w-full rounded-md border px-3" maxLength={8} required />
          </label>
          <label className="text-sm font-bold">
            ลำดับ
            <input name="sort_order" type="number" className="mt-1 h-10 w-full rounded-md border px-3" defaultValue={0} />
          </label>
          <label className="text-sm font-bold">
            ระดับความเสี่ยง
            <select name="risk_level" className="mt-1 h-10 w-full rounded-md border px-3" defaultValue="Low">
              {["Low", "Medium", "High", "Critical"].map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-bold sm:col-span-2">
            งบวางแผน (บาท)
            <input name="planned_budget" type="number" min={0} className="mt-1 h-10 w-full rounded-md border px-3" defaultValue={0} />
          </label>
          <Button type="submit" variant="gold" disabled={loading === "create"} className="sm:col-span-2">
            {loading === "create" ? "กำลังสร้าง..." : "สร้างคณะ"}
          </Button>
        </form>
      ) : null}

      <div className="space-y-4">
        {initialCommittees
          .filter((c) => canManageGlobal || memberManageRights[c.id])
          .map((committee) => (
            <div key={committee.id} className="rounded-md border border-[#e7e2d7] p-3 sm:p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <b className="text-sm font-black">{committee.name}</b>
                  <span className="ml-2 text-xs text-[#667085]">
                    {committee.members.length} สมาชิก · {committee._count.tasks} ภารกิจ
                  </span>
                </div>
                {canManageGlobal ? (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => setEditingId(editingId === committee.id ? null : committee.id)}
                    >
                      {editingId === committee.id ? "ปิดแก้ไข" : "แก้ไขคณะ"}
                    </Button>
                    <Button
                      variant="danger"
                      disabled={committee._count.tasks > 0 || loading === `del-${committee.id}`}
                      onClick={() => deleteCommittee(committee.id, committee.name)}
                      title={committee._count.tasks > 0 ? "มีภารกิจอยู่ ลบไม่ได้" : undefined}
                    >
                      ลบคณะ
                    </Button>
                  </div>
                ) : null}
              </div>

              {editingId === committee.id && canManageGlobal ? (
                <form
                  className="mb-3 grid gap-2 border-b border-[#e7e2d7] pb-3 sm:grid-cols-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void saveCommittee(committee.id, e.currentTarget);
                  }}
                >
                  <label className="text-xs font-bold sm:col-span-2">
                    ชื่อคณะ
                    <input name="name" defaultValue={committee.name} className="mt-1 h-9 w-full rounded border px-2 text-sm" required />
                  </label>
                  <label className="text-xs font-bold">
                    หัวหน้าคณะ
                    <input name="owner_name" defaultValue={committee.owner_name} className="mt-1 h-9 w-full rounded border px-2 text-sm" required />
                  </label>
                  <label className="text-xs font-bold">
                    ตัวย่อ
                    <input name="owner_initials" defaultValue={committee.owner_initials} className="mt-1 h-9 w-full rounded border px-2 text-sm" required />
                  </label>
                  <label className="text-xs font-bold">
                    ลำดับ
                    <input name="sort_order" type="number" defaultValue={committee.sort_order} className="mt-1 h-9 w-full rounded border px-2 text-sm" />
                  </label>
                  <label className="text-xs font-bold">
                    ความเสี่ยง
                    <select name="risk_level" defaultValue={committee.risk_level} className="mt-1 h-9 w-full rounded border px-2 text-sm">
                      {["Low", "Medium", "High", "Critical"].map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs font-bold sm:col-span-2">
                    งบวางแผน
                    <input name="planned_budget" type="number" min={0} defaultValue={committee.planned_budget} className="mt-1 h-9 w-full rounded border px-2 text-sm" />
                  </label>
                  <Button type="submit" variant="gold" disabled={loading === `edit-${committee.id}`}>
                    บันทึกคณะ
                  </Button>
                </form>
              ) : null}

              {memberManageRights[committee.id] ? (
                <>
                  <ul className="mb-3 space-y-1">
                    {committee.members.length === 0 ? (
                      <li className="text-xs text-[#667085]">ยังไม่มีสมาชิก</li>
                    ) : (
                      committee.members.map((member) => (
                        <li key={member.id} className="flex flex-wrap items-center justify-between gap-2 rounded bg-[#fbfaf5] px-2 py-1.5 text-sm">
                          <span>
                            <b>{member.user.name}</b>{" "}
                            <span className="text-xs text-[#667085]">@{member.user.username}</span>
                            <span className="ml-2 inline-block">
                              <Badge>{member.position}</Badge>
                            </span>
                          </span>
                          <button
                            type="button"
                            className="text-xs font-bold text-[#b91528] hover:underline"
                            disabled={loading === `rm-${member.id}`}
                            onClick={() => removeMember(committee.id, member.id, member.user.name)}
                          >
                            ถอน
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                  <form onSubmit={(e) => addMember(committee.id, e)} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                    <label className="text-xs font-bold">
                      ผู้ใช้
                      <select name="user_id" className="mt-1 h-9 w-full rounded border px-2 text-sm" required defaultValue="">
                        <option value="" disabled>
                          เลือกผู้ใช้
                        </option>
                        {users
                          .filter((u) => !committee.members.some((m) => m.user.id === u.id))
                          .map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name} ({u.username})
                            </option>
                          ))}
                      </select>
                    </label>
                    <label className="text-xs font-bold">
                      ตำแหน่ง
                      <input name="position" className="mt-1 h-9 w-full rounded border px-2 text-sm" placeholder="เช่น เจ้าหน้าที่ฝ่าย" required />
                    </label>
                    <Button type="submit" variant="gold" className="self-end" disabled={loading === `member-${committee.id}`}>
                      เพิ่ม
                    </Button>
                  </form>
                </>
              ) : null}
            </div>
          ))}
      </div>

      {message ? <p className="text-sm font-bold text-[#123f76]">{message}</p> : null}
    </div>
  );
}
