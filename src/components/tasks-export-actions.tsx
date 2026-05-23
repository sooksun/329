"use client";

import { Download, FileJson } from "lucide-react";
import { useState } from "react";
import { linkButtonClasses } from "@/lib/button-styles";

function parseFilename(disposition: string | null, fallback: string) {
  if (!disposition) return fallback;
  const utf8 = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8?.[1]) {
    try {
      return decodeURIComponent(utf8[1]);
    } catch {
      return fallback;
    }
  }
  const ascii = disposition.match(/filename="([^"]+)"/i) ?? disposition.match(/filename=([^;]+)/i);
  return ascii?.[1]?.trim() || fallback;
}

function buildExportUrl(format: "csv" | "json", committeeId?: string | null) {
  const params = new URLSearchParams();
  if (format === "json") params.set("format", "json");
  if (committeeId) params.set("committee_id", committeeId);
  const query = params.toString();
  return `/api/tasks/export${query ? `?${query}` : ""}`;
}

async function downloadExport(format: "csv" | "json", committeeId?: string | null) {
  const response = await fetch(buildExportUrl(format, committeeId), { credentials: "same-origin" });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(typeof body.error === "string" ? body.error : "ดาวน์โหลดไม่สำเร็จ");
  }
  const fallback = format === "json" ? "tasks-export.json" : "tasks-export.csv";
  const filename = parseFilename(response.headers.get("Content-Disposition"), fallback);
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

type ExportButtonProps = {
  format: "csv" | "json";
  committeeId?: string | null;
  variant?: "default" | "gold" | "ghost";
  label: string;
  className?: string;
};

export function TaskExportDownloadButton({
  format,
  committeeId,
  variant = "gold",
  label,
  className
}: ExportButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    setLoading(true);
    setError("");
    try {
      await downloadExport(format, committeeId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ดาวน์โหลดไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <span className={className}>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={linkButtonClasses(variant, "w-full justify-center gap-2 sm:w-auto")}
      >
        {format === "csv" ? <Download size={16} /> : <FileJson size={16} />}
        {loading ? "กำลังดาวน์โหลด..." : label}
      </button>
      {error ? <span className="mt-1 block text-xs font-bold text-[#b91528]">{error}</span> : null}
    </span>
  );
}

export function TasksExportActions({ committeeId }: { committeeId?: string | null }) {
  return (
    <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap">
      <TaskExportDownloadButton format="csv" committeeId={committeeId} variant="gold" label="ดาวน์โหลด CSV" />
      <TaskExportDownloadButton format="json" committeeId={committeeId} variant="default" label="ดาวน์โหลด JSON" />
    </div>
  );
}
