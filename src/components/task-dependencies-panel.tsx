"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge, Button } from "@/components/ui";
import { errors, readApiError } from "@/lib/messages";
import { thaiStatus } from "@/lib/utils";

type DepTask = {
  id: string;
  code: string;
  title: string;
  status: string;
  due_date?: string;
};

type DependsRow = { id: string; dependsOn: DepTask };
type BlockedRow = { id: string; task: DepTask };
type PickerTask = { id: string; code: string; title: string; status: string };

export function TaskDependenciesPanel({
  taskId,
  initialDependsOn,
  initialBlocked,
  pickerTasks,
  canEdit
}: {
  taskId: string;
  initialDependsOn: DependsRow[];
  initialBlocked: BlockedRow[];
  pickerTasks: PickerTask[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [dependsOn, setDependsOn] = useState(initialDependsOn);
  const [blocked, setBlocked] = useState(initialBlocked);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const linkedIds = new Set(dependsOn.map((d) => d.dependsOn.id));
  const options = pickerTasks.filter((t) => !linkedIds.has(t.id));

  async function addDependency(event: React.FormEvent) {
    event.preventDefault();
    if (!canEdit || !selected) return;
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`/api/tasks/${taskId}/dependencies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ depends_on_id: selected })
      });
      if (!response.ok) throw new Error(await readApiError(response, errors.saveFailed));
      const created = (await response.json()) as { id: string; dependsOn: DepTask };
      setDependsOn((prev) => [...prev, { id: created.id, dependsOn: created.dependsOn }]);
      setSelected("");
      setMessage("เพิ่มความสัมพันธ์แล้ว");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : errors.saveFailed);
    } finally {
      setLoading(false);
    }
  }

  async function removeDependency(dependencyId: string) {
    if (!canEdit) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}/dependencies/${dependencyId}`, { method: "DELETE" });
      if (!response.ok) throw new Error(await readApiError(response, errors.saveFailed));
      setDependsOn((prev) => prev.filter((d) => d.id !== dependencyId));
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : errors.saveFailed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-black text-[#101827]">ต้องทำหลังจาก (พึ่งพา)</h3>
        <p className="text-xs text-[#667085]">ภารกิจนี้เริ่มได้เมื่องานด้านล่างเสร็จหรือพร้อมแล้ว</p>
        <ul className="mt-2 space-y-2">
          {dependsOn.length === 0 ? (
            <li className="text-sm text-[#667085]">ไม่มีงานที่ต้องทำก่อน</li>
          ) : (
            dependsOn.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2">
                <Link href={`/tasks/detail?id=${row.dependsOn.id}`} className="text-sm font-bold text-[#123f76] hover:underline">
                  {row.dependsOn.code} · {row.dependsOn.title}
                </Link>
                <div className="flex items-center gap-2">
                  <Badge tone={row.dependsOn.status === "DONE" ? "green" : "gold"}>{thaiStatus(row.dependsOn.status)}</Badge>
                  {canEdit ? (
                    <button
                      type="button"
                      className="text-xs font-bold text-[#b91528]"
                      onClick={() => removeDependency(row.id)}
                      disabled={loading}
                    >
                      ลบ
                    </button>
                  ) : null}
                </div>
              </li>
            ))
          )}
        </ul>
        {canEdit ? (
          <form onSubmit={addDependency} className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
            <label className="flex-1 text-sm font-bold">
              เพิ่มงานที่ต้องทำก่อน
              <select
                className="mt-1 h-10 w-full rounded-md border px-3"
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                required
              >
                <option value="">เลือกภารกิจ</option>
                {options.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.code} · {t.title} ({thaiStatus(t.status)})
                  </option>
                ))}
              </select>
            </label>
            <Button type="submit" variant="gold" disabled={loading || !selected}>
              เพิ่ม
            </Button>
          </form>
        ) : null}
      </div>

      <div>
        <h3 className="text-sm font-black text-[#101827]">งานที่รอภารกิจนี้</h3>
        <ul className="mt-2 space-y-2">
          {blocked.length === 0 ? (
            <li className="text-sm text-[#667085]">ไม่มีงานอื่นรอภารกิจนี้</li>
          ) : (
            blocked.map((row) => (
              <li key={row.id} className="rounded-md border border-[#e7e2d7] bg-[#fbfaf5] px-3 py-2">
                <Link href={`/tasks/detail?id=${row.task.id}`} className="text-sm font-bold text-[#123f76] hover:underline">
                  {row.task.code} · {row.task.title}
                </Link>
                <span className="ml-2">
                  <Badge>{thaiStatus(row.task.status)}</Badge>
                </span>
              </li>
            ))
          )}
        </ul>
      </div>

      {message ? <p className="text-sm font-bold text-[#123f76]">{message}</p> : null}
    </div>
  );
}
