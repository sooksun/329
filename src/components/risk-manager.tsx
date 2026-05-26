"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Badge, Button } from "@/components/ui";
import { errors, readApiError } from "@/lib/messages";
import { toastConfirm, toastCreated, toastDeleted, toastError, toastSaved } from "@/lib/toast";
import { thaiRiskLevel, thaiRiskStatus } from "@/lib/utils";

type CommitteeOption = { id: string; name: string };
type TaskOption = { id: string; code: string; title: string; committee_id: string };

export type RiskRow = {
  id: string;
  code: string;
  title: string;
  committee_id: string;
  committee: { name: string };
  task_id: string | null;
  likelihood: number;
  impact: number;
  score: number;
  level: string;
  mitigation_plan: string;
  contingency_plan: string;
  owner_name: string;
  owner_initials: string;
  status: string;
};

const riskStatuses = ["OPEN", "MITIGATING", "WATCHING", "CLOSED"] as const;

export function RiskManager({
  risks: initialRisks,
  committees,
  tasks,
  canManageGlobal,
  manageCommitteeIds
}: {
  risks: RiskRow[];
  committees: CommitteeOption[];
  tasks: TaskOption[];
  canManageGlobal: boolean;
  manageCommitteeIds: string[];
}) {
  const router = useRouter();
  const [risks, setRisks] = useState(initialRisks);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [committeeId, setCommitteeId] = useState(committees[0]?.id ?? "");

  const canManageAny = canManageGlobal || manageCommitteeIds.length > 0;
  const committeeOptions = canManageGlobal
    ? committees
    : committees.filter((c) => manageCommitteeIds.includes(c.id));

  const taskOptions = useMemo(
    () => tasks.filter((t) => !committeeId || t.committee_id === committeeId),
    [tasks, committeeId]
  );

  function canEdit(risk: RiskRow) {
    return canManageGlobal || manageCommitteeIds.includes(risk.committee_id);
  }

  async function createRisk(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/risks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          committee_id: form.get("committee_id"),
          task_id: form.get("task_id") || null,
          title: form.get("title"),
          likelihood: Number(form.get("likelihood")),
          impact: Number(form.get("impact")),
          mitigation_plan: form.get("mitigation_plan"),
          contingency_plan: form.get("contingency_plan"),
          owner_name: form.get("owner_name"),
          owner_initials: form.get("owner_initials"),
          status: form.get("status")
        })
      });
      if (!response.ok) throw new Error(await readApiError(response, errors.saveFailed));
      toastCreated("เพิ่มความเสี่ยงแล้ว");
      setCreateOpen(false);
      router.refresh();
    } catch (error) {
      toastError(error instanceof Error ? error.message : errors.saveFailed);
    } finally {
      setLoading(false);
    }
  }

  async function saveRisk(riskId: string, form: HTMLFormElement) {
    setLoading(true);
    const data = new FormData(form);
    try {
      const response = await fetch(`/api/risks/${riskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.get("title"),
          likelihood: Number(data.get("likelihood")),
          impact: Number(data.get("impact")),
          mitigation_plan: data.get("mitigation_plan"),
          contingency_plan: data.get("contingency_plan"),
          owner_name: data.get("owner_name"),
          owner_initials: data.get("owner_initials"),
          status: data.get("status")
        })
      });
      if (!response.ok) throw new Error(await readApiError(response, errors.saveFailed));
      setEditingId(null);
      toastSaved("บันทึกความเสี่ยงแล้ว");
      router.refresh();
    } catch (error) {
      toastError(error instanceof Error ? error.message : errors.saveFailed);
    } finally {
      setLoading(false);
    }
  }

  function removeRisk(risk: RiskRow) {
    toastConfirm(`ลบความเสี่ยง ${risk.code}?`, async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/risks/${risk.id}`, { method: "DELETE" });
        if (!response.ok) throw new Error(await readApiError(response, errors.saveFailed));
        setRisks((prev) => prev.filter((r) => r.id !== risk.id));
        toastDeleted("ลบแล้ว");
        router.refresh();
      } catch (error) {
        toastError(error instanceof Error ? error.message : errors.saveFailed);
      } finally {
        setLoading(false);
      }
    });
  }

  if (!canManageAny) return null;

  return (
    <div className="rounded-md border border-[#e7e2d7] bg-white p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-black">จัดการความเสี่ยง</h2>
        <Button variant="gold" onClick={() => setCreateOpen((v) => !v)}>
          {createOpen ? "ปิดฟอร์ม" : "เพิ่มความเสี่ยง"}
        </Button>
      </div>

      {createOpen ? (
        <form onSubmit={createRisk} className="mb-4 grid gap-2 rounded-md border bg-[#fbfaf5] p-3 sm:grid-cols-2">
          <label className="text-xs font-bold sm:col-span-2">
            ชื่อความเสี่ยง
            <input name="title" className="mt-1 h-9 w-full rounded border px-2 text-sm" required />
          </label>
          <label className="text-xs font-bold">
            คณะ
            <select
              name="committee_id"
              className="mt-1 h-9 w-full rounded border px-2 text-sm"
              value={committeeId}
              onChange={(e) => setCommitteeId(e.target.value)}
              required
            >
              {committeeOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-bold">
            ภารกิจ (ไม่บังคับ)
            <select name="task_id" className="mt-1 h-9 w-full rounded border px-2 text-sm" defaultValue="">
              <option value="">— ไม่ผูกภารกิจ —</option>
              {taskOptions.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.code} · {t.title}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-bold">
            โอกาส (1–5)
            <input name="likelihood" type="number" min={1} max={5} defaultValue={3} className="mt-1 h-9 w-full rounded border px-2 text-sm" required />
          </label>
          <label className="text-xs font-bold">
            ผลกระทบ (1–5)
            <input name="impact" type="number" min={1} max={5} defaultValue={3} className="mt-1 h-9 w-full rounded border px-2 text-sm" required />
          </label>
          <label className="text-xs font-bold">
            สถานะ
            <select name="status" className="mt-1 h-9 w-full rounded border px-2 text-sm" defaultValue="OPEN">
              {riskStatuses.map((s) => (
                <option key={s} value={s}>
                  {thaiRiskStatus(s)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-bold">
            ผู้รับผิดชอบ
            <input name="owner_name" className="mt-1 h-9 w-full rounded border px-2 text-sm" required />
          </label>
          <label className="text-xs font-bold">
            ตัวย่อ
            <input name="owner_initials" className="mt-1 h-9 w-full rounded border px-2 text-sm" maxLength={8} required />
          </label>
          <label className="text-xs font-bold sm:col-span-2">
            แนวทางลดความเสี่ยง
            <textarea name="mitigation_plan" className="mt-1 w-full rounded border px-2 py-1 text-sm" rows={2} required />
          </label>
          <label className="text-xs font-bold sm:col-span-2">
            แผนสำรอง
            <textarea name="contingency_plan" className="mt-1 w-full rounded border px-2 py-1 text-sm" rows={2} required />
          </label>
          <Button type="submit" variant="gold" disabled={loading} className="sm:col-span-2">
            บันทึก
          </Button>
        </form>
      ) : null}

      <div className="space-y-2">
        {risks
          .filter((r) => canEdit(r))
          .slice(0, 8)
          .map((risk) => (
            <div key={risk.id} className="rounded border p-2 text-sm">
              <div className="flex flex-wrap justify-between gap-2">
                <span>
                  <Badge>{risk.code}</Badge> {risk.title}
                </span>
                <div className="flex gap-2">
                  <button type="button" className="text-xs font-bold text-[#123f76]" onClick={() => setEditingId(editingId === risk.id ? null : risk.id)}>
                    แก้ไข
                  </button>
                  <button type="button" className="text-xs font-bold text-[#b91528]" onClick={() => removeRisk(risk)}>
                    ลบ
                  </button>
                </div>
              </div>
              {editingId === risk.id ? (
                <form
                  className="mt-2 grid gap-2 sm:grid-cols-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void saveRisk(risk.id, e.currentTarget);
                  }}
                >
                  <label className="text-xs font-bold sm:col-span-2">
                    ชื่อ
                    <input name="title" defaultValue={risk.title} className="mt-1 h-8 w-full rounded border px-2" required />
                  </label>
                  <label className="text-xs font-bold">
                    โอกาส
                    <input name="likelihood" type="number" min={1} max={5} defaultValue={risk.likelihood} className="mt-1 h-8 w-full rounded border px-2" />
                  </label>
                  <label className="text-xs font-bold">
                    ผลกระทบ
                    <input name="impact" type="number" min={1} max={5} defaultValue={risk.impact} className="mt-1 h-8 w-full rounded border px-2" />
                  </label>
                  <label className="text-xs font-bold">
                    สถานะ
                    <select name="status" defaultValue={risk.status} className="mt-1 h-8 w-full rounded border px-2">
                      {riskStatuses.map((s) => (
                        <option key={s} value={s}>
                          {thaiRiskStatus(s)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs font-bold">
                    ผู้รับผิดชอบ
                    <input name="owner_name" defaultValue={risk.owner_name} className="mt-1 h-8 w-full rounded border px-2" />
                  </label>
                  <label className="text-xs font-bold sm:col-span-2">
                    แนวทางลดความเสี่ยง
                    <textarea name="mitigation_plan" defaultValue={risk.mitigation_plan} className="mt-1 w-full rounded border px-2" rows={2} />
                  </label>
                  <label className="text-xs font-bold sm:col-span-2">
                    แผนสำรอง
                    <textarea name="contingency_plan" defaultValue={risk.contingency_plan} className="mt-1 w-full rounded border px-2" rows={2} />
                  </label>
                  <label className="text-xs font-bold">
                    ตัวย่อ
                    <input name="owner_initials" defaultValue={risk.owner_initials} className="mt-1 h-8 w-full rounded border px-2" />
                  </label>
                  <Button type="submit" variant="gold" disabled={loading}>
                    บันทึก
                  </Button>
                </form>
              ) : (
                <p className="mt-1 text-xs text-[#667085]">
                  {risk.score} · {thaiRiskLevel(risk.level)} · {thaiRiskStatus(risk.status)}
                </p>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
