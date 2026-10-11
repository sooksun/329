import { describe, expect, it } from "vitest";
import { ganttMonthLabels, projectGanttWindow } from "../src/lib/event-calendar";

describe("project gantt window", () => {
  const eventStart = new Date("2028-03-29T08:00:00+07:00");
  const eventEnd = new Date("2028-04-05T18:00:00+07:00");

  it("follows the selected project instead of the hardcoded 2570 edition", () => {
    const window = projectGanttWindow(eventStart, eventEnd, [
      { start_date: new Date("2027-07-01"), due_date: new Date("2028-03-20") },
      { start_date: new Date("2027-09-01"), due_date: new Date("2028-06-01") }
    ]);
    expect(window.start.toISOString().slice(0, 10)).toBe("2027-07-01");
    // กำหนดส่งช้าสุดเลยหลังงาน 21 วัน → ขยายหน้าต่างให้ครอบคลุม
    expect(window.end.toISOString().slice(0, 10)).toBe("2028-06-01");
  });

  it("falls back to ~10 months before the event when there are no tasks", () => {
    const window = projectGanttWindow(eventStart, null, []);
    expect(window.start < eventStart).toBe(true);
    expect(Math.round((eventStart.getTime() - window.start.getTime()) / 86400000)).toBe(300);
  });

  it("labels the window with Buddhist-era months", () => {
    const labels = ganttMonthLabels({ start: new Date("2027-07-01"), end: new Date("2028-04-26") });
    expect(labels).toHaveLength(5);
    expect(labels[0]).toContain("70");
    expect(labels[4]).toContain("71");
  });
});
