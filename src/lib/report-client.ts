export type ReportJobResponse = {
  jobId?: string;
  status: string;
  queued?: boolean;
  report?: { id: string; title: string; file_path: string };
  error?: string;
};

export async function requestPptxReport(snapshotId: string): Promise<ReportJobResponse> {
  const response = await fetch("/api/reports/pptx", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ snapshot_id: snapshotId })
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error ?? "สร้างรายงานไม่สำเร็จ");
  return body as ReportJobResponse;
}

export async function pollReportJob(jobId: string, maxAttempts = 40, intervalMs = 1500): Promise<ReportJobResponse> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(`/api/reports/jobs/${jobId}`);
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error ?? "ตรวจสอบสถานะไม่สำเร็จ");
    if (body.status === "COMPLETED" || body.status === "FAILED") return body as ReportJobResponse;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error("สร้างรายงานใช้เวลานานเกินไป ลองใหม่อีกครั้ง");
}
