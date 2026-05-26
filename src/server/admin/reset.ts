import { prisma } from "@/lib/prisma";
import { invalidateProjectCache } from "@/server/cache/invalidate";

export type ResetSummary = {
  comments: number;
  meetingActionItems: number;
  meetingAgendas: number;
  meetings: number;
  evidence: number;
  fileAssets: number;
  budgetTransactions: number;
  risks: number;
  reports: number;
  reportJobs: number;
  snapshots: number;
  notifications: number;
  tasksReset: number;
  subtasksReset: number;
  budgetItemsReset: number;
};

/**
 * รีเซ็ตข้อมูล "เริ่มงานจริง" ของโปรเจกต์เดียว — ทำงานใน transaction เดียว
 *
 * คงไว้ (ไม่แตะโครงสร้าง): Organization, User, Role, Permission, Project, Committee,
 *   CommitteeMember, Plan, Task, Subtask, TaskDependency, BudgetItem (เฉพาะแผน)
 *   รวมถึง owner/reviewer/กำหนดการ/น้ำหนัก/ผัง dependency ของ Task/Subtask
 *
 * รีเซ็ตเป็น 0 / NOT_STARTED: ความคืบหน้าของ Task, Subtask, Plan, Committee, Project
 *   และยอดจริงของ BudgetItem (requested/approved/committed/actual → 0, status → DRAFT)
 *
 * ลบ (ข้อมูลปฏิบัติงาน): Comment, Meeting(+Agenda+ActionItem), Evidence(+FileAsset),
 *   BudgetTransaction, Risk, PowerPointReport, ReportGenerationJob, DashboardSnapshot, Notification
 *
 * หมายเหตุ: AuditLog เป็นข้อมูลระดับระบบ (ไม่ผูกกับ project) จึง "ไม่ลบ" เพื่อคงร่องรอย
 *   และการรีเซ็ตนี้จะถูกบันทึกลง AuditLog ด้วย
 */
export async function resetProjectOperationalData(projectId: string, actorId: string): Promise<ResetSummary> {
  const summary = await prisma.$transaction(
    async (tx) => {
      const taskIds = (await tx.task.findMany({ where: { project_id: projectId }, select: { id: true } })).map((t) => t.id);
      const meetingIds = (await tx.meeting.findMany({ where: { project_id: projectId }, select: { id: true } })).map((m) => m.id);
      const budgetItemIds = (await tx.budgetItem.findMany({ where: { project_id: projectId }, select: { id: true } })).map((b) => b.id);

      // ── ลบลูกก่อน (เคารพ foreign key) ──
      const comments = taskIds.length
        ? await tx.comment.deleteMany({ where: { task_id: { in: taskIds } } })
        : { count: 0 };
      const meetingActionItems = meetingIds.length
        ? await tx.meetingActionItem.deleteMany({ where: { meeting_id: { in: meetingIds } } })
        : { count: 0 };
      const meetingAgendas = meetingIds.length
        ? await tx.meetingAgenda.deleteMany({ where: { meeting_id: { in: meetingIds } } })
        : { count: 0 };
      const meetings = await tx.meeting.deleteMany({ where: { project_id: projectId } });

      const evidence = await tx.evidence.deleteMany({ where: { project_id: projectId } });
      const fileAssets = await tx.fileAsset.deleteMany({ where: { project_id: projectId } });

      const budgetTransactions = budgetItemIds.length
        ? await tx.budgetTransaction.deleteMany({ where: { budget_item_id: { in: budgetItemIds } } })
        : { count: 0 };

      const risks = await tx.risk.deleteMany({ where: { project_id: projectId } });

      const reports = await tx.powerPointReport.deleteMany({ where: { project_id: projectId } });
      const reportJobs = await tx.reportGenerationJob.deleteMany({ where: { project_id: projectId } });
      const snapshots = await tx.dashboardSnapshot.deleteMany({ where: { project_id: projectId } });

      const notifications = await tx.notification.deleteMany({ where: { project_id: projectId } });

      // ── รีเซ็ตความคืบหน้า (คงโครงสร้าง) ──
      const subtasksReset = taskIds.length
        ? await tx.subtask.updateMany({
            where: { task_id: { in: taskIds } },
            data: { status: "NOT_STARTED", reported_progress: 0, evidence_progress: 0, verified_progress: 0 }
          })
        : { count: 0 };

      const tasksReset = await tx.task.updateMany({
        where: { project_id: projectId },
        data: { status: "NOT_STARTED", reported_progress: 0, evidence_progress: 0, verified_progress: 0 }
      });

      const budgetItemsReset = await tx.budgetItem.updateMany({
        where: { project_id: projectId },
        data: {
          requested_amount: 0,
          approved_amount: 0,
          committed_amount: 0,
          actual_amount: 0,
          receipt_no: null,
          status: "DRAFT"
        }
      });

      await tx.plan.updateMany({
        where: { project_id: projectId },
        data: { reported_progress: 0, evidence_progress: 0, verified_progress: 0 }
      });

      await tx.committee.updateMany({
        where: { project_id: projectId },
        data: { verified_progress: 0, actual_budget: 0 }
      });

      await tx.project.update({
        where: { id: projectId },
        data: { reported_progress: 0, evidence_progress: 0, verified_progress: 0, actual_budget: 0 }
      });

      return {
        comments: comments.count,
        meetingActionItems: meetingActionItems.count,
        meetingAgendas: meetingAgendas.count,
        meetings: meetings.count,
        evidence: evidence.count,
        fileAssets: fileAssets.count,
        budgetTransactions: budgetTransactions.count,
        risks: risks.count,
        reports: reports.count,
        reportJobs: reportJobs.count,
        snapshots: snapshots.count,
        notifications: notifications.count,
        tasksReset: tasksReset.count,
        subtasksReset: subtasksReset.count,
        budgetItemsReset: budgetItemsReset.count
      } satisfies ResetSummary;
    },
    { timeout: 30_000 }
  );

  // บันทึกการรีเซ็ตลง AuditLog (นอก transaction — ไม่ถูกลบไปด้วย)
  await prisma.auditLog.create({
    data: {
      user_id: actorId,
      action: "Reset project data (go-live)",
      entity_type: "Project",
      entity_id: projectId,
      new_value: JSON.stringify(summary)
    }
  });

  await invalidateProjectCache(projectId);
  return summary;
}
