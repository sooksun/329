"use client";

import { Download, RefreshCcw, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui";
import { errors, readApiError } from "@/lib/messages";
import { toastCreated, toastError, toastInfo, toastSaved } from "@/lib/toast";
import { pollReportJob, requestPptxReport } from "@/lib/report-client";

export function DashboardActions({ latestSnapshotId }: { latestSnapshotId?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [snapshotId, setSnapshotId] = useState(latestSnapshotId);

  async function createSnapshot() {
    setLoading("snapshot");
    try {
      const response = await fetch("/api/snapshots", { method: "POST" });
      if (!response.ok) throw new Error(await readApiError(response, "สร้าง Snapshot ไม่สำเร็จ"));
      const snapshot = await response.json();
      setSnapshotId(snapshot.id);
      toastSaved("บันทึก Snapshot แล้ว");
      router.refresh();
    } catch (error) {
      toastError(error instanceof Error ? error.message : "สร้าง Snapshot ไม่สำเร็จ");
    } finally {
      setLoading(null);
    }
  }

  async function generatePptx() {
    setLoading("pptx");
    try {
      let activeSnapshotId = snapshotId;
      if (!activeSnapshotId) {
        const snapshotResponse = await fetch("/api/snapshots", { method: "POST" });
        if (!snapshotResponse.ok) throw new Error(await readApiError(snapshotResponse, "สร้าง Snapshot ไม่สำเร็จ"));
        activeSnapshotId = (await snapshotResponse.json()).id;
        setSnapshotId(activeSnapshotId);
      }
      if (!activeSnapshotId) throw new Error(errors.snapshotRequired);
      const result = await requestPptxReport(activeSnapshotId);
      if (result.queued && result.jobId) {
        toastInfo("กำลังสร้างรายงานในคิว...");
        const done = await pollReportJob(result.jobId);
        if (done.status === "FAILED") throw new Error(done.error ?? errors.reportGenerationFailed);
        toastCreated(`สร้าง PowerPoint แล้ว: ${done.report?.title ?? "สำเร็จ"}`);
      } else {
        toastCreated(`สร้าง PowerPoint แล้ว: ${result.report?.title ?? "สำเร็จ"}`);
      }
      router.refresh();
    } catch (error) {
      toastError(error instanceof Error ? error.message : "สร้าง PowerPoint ไม่สำเร็จ");
    } finally {
      setLoading(null);
    }
  }

  const btnClass = "w-full justify-center sm:w-auto";

  return (
    <div className="flex w-full flex-col gap-2 sm:items-end">
      <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button className={btnClass} onClick={() => router.refresh()} disabled={Boolean(loading)}>
          <RefreshCcw size={16} /> รีเฟรช
        </Button>
        <Button className={btnClass} onClick={createSnapshot} disabled={Boolean(loading)}>
          <Save size={16} /> {loading === "snapshot" ? "กำลังบันทึก..." : "Snapshot"}
        </Button>
        <Button className={btnClass} variant="gold" onClick={generatePptx} disabled={Boolean(loading)}>
          <Download size={16} /> {loading === "pptx" ? "กำลังสร้าง..." : "สร้าง PowerPoint"}
        </Button>
      </div>
    </div>
  );
}
