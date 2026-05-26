"use client";

import { Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui";
import { errors, readApiError } from "@/lib/messages";
import { toastCreated, toastError, toastInfo } from "@/lib/toast";
import { pollReportJob, requestPptxReport } from "@/lib/report-client";

export function ReportGenerateButton({ snapshotId }: { snapshotId?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      let activeSnapshotId = snapshotId;
      if (!activeSnapshotId) {
        const snapshotResponse = await fetch("/api/snapshots", { method: "POST" });
        if (!snapshotResponse.ok) throw new Error(await readApiError(snapshotResponse, "สร้าง Snapshot ไม่สำเร็จ"));
        activeSnapshotId = (await snapshotResponse.json()).id;
      }
      if (!activeSnapshotId) throw new Error(errors.snapshotRequired);
      const result = await requestPptxReport(activeSnapshotId);
      if (result.queued && result.jobId) {
        toastInfo("กำลังสร้างรายงานในคิว...");
        const done = await pollReportJob(result.jobId);
        if (done.status === "FAILED") throw new Error(done.error ?? errors.reportGenerationFailed);
        toastCreated(`สร้างแล้ว: ${done.report?.title ?? "สำเร็จ"}`);
      } else {
        toastCreated(`สร้างแล้ว: ${result.report?.title ?? "สำเร็จ"}`);
      }
      router.refresh();
    } catch (error) {
      toastError(error instanceof Error ? error.message : "สร้างรายงานไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-2 sm:items-end">
      <Button variant="gold" onClick={generate} disabled={loading} className="w-full justify-center sm:w-auto">
        <Download size={16} />
        {loading ? "กำลังสร้าง..." : "สร้างรายงาน PowerPoint"}
      </Button>
    </div>
  );
}
