"use client";

import { useCallback, useEffect, useState } from "react";
import { readApiError } from "@/lib/messages";

type LogRow = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  created_at: string;
  user: { id: string; name: string; username: string } | null;
};

const entityTypes = ["", "Task", "Risk", "Meeting", "Evidence", "BudgetItem", "BudgetTransaction", "Comment", "Committee", "User"];

export function AuditLogViewer({ initialItems }: { initialItems: LogRow[] }) {
  const [items, setItems] = useState(initialItems);
  const [entityType, setEntityType] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (entityType) params.set("entity_type", entityType);
      params.set("limit", "100");
      const response = await fetch(`/api/audit-logs?${params.toString()}`);
      if (!response.ok) throw new Error(await readApiError(response, "โหลดไม่สำเร็จ"));
      const body = (await response.json()) as { items: LogRow[] };
      setItems(body.items ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [entityType]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm font-bold">
          กรองตามประเภท
          <select
            className="mt-1 block h-10 rounded-md border px-3 text-sm"
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
          >
            {entityTypes.map((type) => (
              <option key={type || "all"} value={type}>
                {type || "ทั้งหมด"}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="h-10 rounded-md border px-4 text-sm font-bold hover:bg-[#fbfaf5]" onClick={() => void load()} disabled={loading}>
          {loading ? "กำลังโหลด..." : "รีเฟรช"}
        </button>
      </div>

      <div className="mis-table-scroll overflow-x-auto rounded-md border">
        <table className="min-w-[640px] w-full text-left text-sm">
          <thead className="bg-[#fbfaf5] text-xs font-black uppercase text-[#667085]">
            <tr>
              <th className="px-3 py-2">เวลา</th>
              <th className="px-3 py-2">ผู้ใช้</th>
              <th className="px-3 py-2">การกระทำ</th>
              <th className="px-3 py-2">ประเภท</th>
              <th className="px-3 py-2">รหัสอ้างอิง</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-[#667085]">
                  ไม่พบบันทึก
                </td>
              </tr>
            ) : (
              items.map((log) => (
                <tr key={log.id} className="border-t border-[#f0eee7]">
                  <td className="whitespace-nowrap px-3 py-2 text-xs">
                    {new Date(log.created_at).toLocaleString("th-TH")}
                  </td>
                  <td className="px-3 py-2 text-xs">{log.user?.name ?? "—"}</td>
                  <td className="px-3 py-2 font-bold">{log.action}</td>
                  <td className="px-3 py-2">{log.entity_type}</td>
                  <td className="max-w-[200px] truncate px-3 py-2 font-mono text-xs text-[#667085]" title={log.entity_id}>
                    {log.entity_id}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
