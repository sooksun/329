import { describe, expect, it, vi } from "vitest";

/** ข้อความแจ้งเตือน — สอดคล้อง dispatch.ts */
function uploadBody(taskCode: string, caption: string) {
  return `${taskCode}: ${caption}`;
}

function rejectBody(taskCode: string, caption: string, reason?: string | null) {
  const reasonText = reason?.trim() ? ` — เหตุผล: ${reason.trim()}` : "";
  return `${taskCode}: ${caption}${reasonText}`;
}

describe("notification messages", () => {
  it("formats upload notification body", () => {
    expect(uploadBody("T-001", "ภาพก่อน-หลัง")).toBe("T-001: ภาพก่อน-หลัง");
  });

  it("formats reject notification with optional reason", () => {
    expect(rejectBody("T-001", "ใบเสร็จ", null)).toBe("T-001: ใบเสร็จ");
    expect(rejectBody("T-001", "ใบเสร็จ", "  ไม่ชัด  ")).toBe("T-001: ใบเสร็จ — เหตุผล: ไม่ชัด");
  });
});

vi.mock("@/lib/prisma", () => ({ prisma: {} }));

describe("delayed task notices", () => {
  const due = new Date("2027-03-01T00:00:00Z");
  const task = { id: "t1", code: "P0-01", title: "เตรียมสนาม", owner_id: "u1", due_date: due };

  it("notifies once per due date even if the task is re-flagged later", async () => {
    const { tasksNeedingDelayNotice } = await import("../src/server/notifications/dispatch");
    expect(tasksNeedingDelayNotice([task], [])).toHaveLength(1);
    const notifiedAfterDue = [{ body: "P0-01: เตรียมสนาม", created_at: new Date("2027-03-02T00:00:00Z") }];
    expect(tasksNeedingDelayNotice([task], notifiedAfterDue)).toHaveLength(0);
  });

  it("notifies again when the due date was moved and passed again", async () => {
    const { tasksNeedingDelayNotice } = await import("../src/server/notifications/dispatch");
    const oldNotice = [{ body: "P0-01: เตรียมสนาม", created_at: new Date("2027-02-01T00:00:00Z") }];
    expect(tasksNeedingDelayNotice([task], oldNotice)).toHaveLength(1);
    // code อื่นที่ขึ้นต้นเหมือนกันต้องไม่ถูกนับรวม
    expect(tasksNeedingDelayNotice([task], [{ body: "P0-010: อื่น", created_at: new Date("2027-03-05") }])).toHaveLength(1);
  });
});
