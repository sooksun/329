import { describe, expect, it } from "vitest";

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
