import { Queue, Worker, type Job } from "bullmq";
import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/messages";
import { generatePptxForSnapshot } from "@/server/reports/generate-pptx";

const QUEUE_NAME = "mis-report-pptx";

export type ReportJobPayload = {
  jobRecordId: string;
  snapshotId: string;
  userId: string;
};

export function isReportQueueEnabled() {
  return Boolean(process.env.REDIS_URL?.trim()) && process.env.REPORT_QUEUE_ENABLED !== "false";
}

function connection() {
  const url = process.env.REDIS_URL?.trim();
  if (!url) throw new Error("REDIS_URL is required for report queue");
  return { url };
}

let queue: Queue<ReportJobPayload> | null = null;

export function getReportQueue() {
  if (!isReportQueueEnabled()) return null;
  if (!queue) {
    queue = new Queue<ReportJobPayload>(QUEUE_NAME, { connection: connection() });
  }
  return queue;
}

export async function enqueueReportJob(input: { snapshotId: string; userId: string; projectId: string }) {
  const record = await prisma.reportGenerationJob.create({
    data: {
      project_id: input.projectId,
      snapshot_id: input.snapshotId,
      generated_by: input.userId,
      status: "QUEUED"
    }
  });

  const q = getReportQueue();
  if (!q) return { record, queued: false };

  const bullJob = await q.add(
    "generate",
    { jobRecordId: record.id, snapshotId: input.snapshotId, userId: input.userId },
    { removeOnComplete: 100, removeOnFail: 50 }
  );

  await prisma.reportGenerationJob.update({
    where: { id: record.id },
    data: { bull_job_id: bullJob.id }
  });

  return { record, queued: true };
}

export async function processReportJob(payload: ReportJobPayload) {
  await prisma.reportGenerationJob.update({
    where: { id: payload.jobRecordId },
    data: { status: "PROCESSING" }
  });

  try {
    const { report, stored } = await generatePptxForSnapshot(payload.snapshotId, payload.userId);
    await prisma.reportGenerationJob.update({
      where: { id: payload.jobRecordId },
      data: {
        status: "COMPLETED",
        file_path: stored.storageKey,
        report_id: report.id,
        completed_at: new Date()
      }
    });
    return report;
  } catch (error) {
    await prisma.reportGenerationJob.update({
      where: { id: payload.jobRecordId },
      data: {
        status: "FAILED",
          error: error instanceof Error ? error.message : errors.reportGenerationFailed,
        completed_at: new Date()
      }
    });
    throw error;
  }
}

export function startReportWorker() {
  if (!isReportQueueEnabled()) {
    console.log("Report queue disabled (set REDIS_URL to enable)");
    return null;
  }

  const worker = new Worker<ReportJobPayload>(
    QUEUE_NAME,
    async (job: Job<ReportJobPayload>) => {
      await processReportJob(job.data);
    },
    { connection: connection(), concurrency: 1 }
  );

  worker.on("failed", (job, err) => {
    console.error(`Report job ${job?.id} failed:`, err.message);
  });

  console.log(`Report worker listening on queue "${QUEUE_NAME}"`);
  return worker;
}
