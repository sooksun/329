import { describe, expect, it } from "vitest";
import { EVENT_329, formatThaiEventPeriod, scheduleTaskWindow } from "../src/lib/event-calendar";
import { formatThaiDateLong } from "../src/lib/format-date";

describe("329 event calendar", () => {
  it("anchors event on 29 March 2570 (2027 CE)", () => {
    expect(EVENT_329.start.getFullYear()).toBe(2027);
    expect(EVENT_329.start.getMonth()).toBe(2);
    expect(EVENT_329.start.getDate()).toBe(29);
    expect(EVENT_329.end.getMonth()).toBe(3);
    expect(EVENT_329.end.getDate()).toBe(5);
  });

  it("schedules pre-event tasks before opening day", () => {
    const { start, due } = scheduleTaskWindow("P0", 0, "pre");
    expect(due.getTime()).toBeLessThan(EVENT_329.start.getTime());
    expect(start.getTime()).toBeLessThan(due.getTime());
  });

  it("defaults to the pre-event window when no phase is given", () => {
    const { due } = scheduleTaskWindow("P0", 0);
    expect(due.getTime()).toBeLessThan(EVENT_329.start.getTime());
  });

  it("schedules event-week tasks during 29 Mar – 5 Apr", () => {
    const { start, due } = scheduleTaskWindow("P1", 0, "event");
    expect(start.getTime()).toBeGreaterThanOrEqual(EVENT_329.start.getTime());
    expect(due.getTime()).toBeLessThanOrEqual(EVENT_329.end.getTime() + 86400000);
  });

  it("schedules post-event tasks after closing day", () => {
    const { start } = scheduleTaskWindow("P3", 0, "post");
    expect(start.getTime()).toBeGreaterThan(EVENT_329.end.getTime());
  });

  it("formats Thai event period in Buddhist Era", () => {
    const text = formatThaiEventPeriod();
    expect(text).toMatch(/29/);
    expect(text).toMatch(/5/);
    expect(text).toMatch(/2570/);
    expect(formatThaiDateLong(EVENT_329.start)).toMatch(/2570/);
  });
});
