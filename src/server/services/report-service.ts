/**
 * Report domain — ยังรันใน monolith (Phase 2 queue + PPTX)
 * แยกเป็น HTTP microservice เมื่อ ops พร้อม (ดู docs/architecture/phase-3.md)
 */
import { enqueueReportJob, isReportQueueEnabled } from "@/server/queue/report-queue";
import { generatePptxForSnapshot } from "@/server/reports/generate-pptx";

export const reportService = {
  isQueueEnabled: isReportQueueEnabled,

  async generateInline(snapshotId: string, userId: string) {
    return generatePptxForSnapshot(snapshotId, userId);
  },

  async enqueue(snapshotId: string, userId: string, projectId: string) {
    return enqueueReportJob({ snapshotId, userId, projectId });
  }
};

export type ReportService = typeof reportService;
