import { formatThaiDateShort } from "@/lib/format-date";

/** ปฏิทินงาน 329 — 3 = มีนาคม, 29 = วันที่ 29 (เริ่มทุกปี) */
export const EVENT_329 = {
  /** รอบจัดงาน พ.ศ. 2570 */
  editionBe: 2570,
  editionCe: 2027,
  /** เปิดงาน 29 มีนาคม 08:00 */
  start: new Date("2027-03-29T08:00:00+07:00"),
  /** ปิดงาน 5 เมษายน 18:00 */
  end: new Date("2027-04-05T18:00:00+07:00"),
  /** เริ่มวางแผน/เตรียมงาน ~10 เดือนก่อนวันงาน */
  planningStart: new Date("2026-06-01T09:00:00+07:00"),
  meaningShort: "329 = เดือน 3 (มีนาคม) · วันที่ 29",
  meaningLong:
    "ชื่องาน 329 หมายถึงจัดขึ้นทุกปีในวันที่ 29 มีนาคม (3 = มีนาคม, 29 = วันที่ 29) รอบนี้จัดต่อเนื่อง 29 มี.ค. – 5 เม.ย. 2570"
} as const;

export type TaskPriorityBand = "P0" | "P1" | "P2" | "P3";

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function formatThaiEventPeriod(start = EVENT_329.start, end: Date = EVENT_329.end) {
  return `${formatThaiDateShort(start)} – ${formatThaiDateShort(end)}`;
}

export function daysUntilEvent(from = new Date(), eventStart = EVENT_329.start) {
  return Math.max(0, Math.ceil((eventStart.getTime() - from.getTime()) / 86400000));
}

/** หน้าต่าง Gantt: มิ.ย. 2569 → เม.ย. 2570 */
export const GANTT_WINDOW = {
  start: EVENT_329.planningStart,
  end: addDays(EVENT_329.end, 21)
};

export const GANTT_MONTH_LABELS = ["มิ.ย.69", "ก.ย.69", "ธ.ค.69", "มี.ค.70", "เม.ย.70"];

export function ganttBarStyle(taskStart: Date, taskDue: Date, windowStart = GANTT_WINDOW.start, windowEnd = GANTT_WINDOW.end) {
  const total = Math.max(1, windowEnd.getTime() - windowStart.getTime());
  const clampedStart = Math.max(windowStart.getTime(), taskStart.getTime());
  const clampedEnd = Math.min(windowEnd.getTime(), Math.max(taskDue.getTime(), taskStart.getTime() + 86400000));
  const left = ((clampedStart - windowStart.getTime()) / total) * 100;
  const width = ((clampedEnd - clampedStart) / total) * 100;
  return {
    left: `${Math.max(0, Math.min(98, left))}%`,
    width: `${Math.max(2, Math.min(100 - left, width))}%`
  };
}

function atHour(date: Date, hour: number) {
  const next = new Date(date);
  next.setHours(hour, 0, 0, 0);
  return next;
}

function postEventSchedule(index: number) {
  const start = atHour(addDays(EVENT_329.end, 3 + (index % 6) * 2), 9);
  const due = atHour(addDays(start, 14 + (index % 4) * 7), 17);
  return { start, due };
}

function eventWeekSchedule(index: number) {
  const dayOffset = Math.min(7, index % 8);
  const start = atHour(addDays(EVENT_329.start, dayOffset), 8);
  const due = atHour(addDays(EVENT_329.start, dayOffset), 18);
  return { start, due };
}

function preEventSchedule(priority: TaskPriorityBand, index: number) {
  const dueDaysBeforeEvent: Record<TaskPriorityBand, [number, number]> = {
    P0: [3, 21],
    P1: [14, 45],
    P2: [30, 90],
    P3: [45, 120]
  };
  const durationDays: Record<TaskPriorityBand, number> = { P0: 21, P1: 28, P2: 35, P3: 21 };

  const [minDays, maxDays] = dueDaysBeforeEvent[priority];
  const daysBefore = minDays + ((index * 5) % (maxDays - minDays + 1));
  let due = atHour(addDays(EVENT_329.start, -daysBefore), 17);

  let start = atHour(addDays(due, -(durationDays[priority] + (index % 4) * 3)), 9);
  if (start < EVENT_329.planningStart) {
    start = atHour(addDays(EVENT_329.planningStart, (index % 12) * 4), 9);
    due = atHour(addDays(start, durationDays[priority]), 17);
  }

  const eve = atHour(addDays(EVENT_329.start, -1), 17);
  if (due > eve) due = eve;
  if (start >= due) start = atHour(addDays(due, -7), 9);

  return { start, due };
}

/** ช่วงเวลาของภารกิจเทียบกับวันงาน */
export type TaskPhase = "pre" | "event" | "post";

/** กำหนด start/due ของภารกิจตามช่วงเวลาและความสำคัญ — สอดคล้องรอบ 29 มี.ค. – 5 เม.ย. 2570 */
export function scheduleTaskWindow(priority: TaskPriorityBand, index: number, phase: TaskPhase = "pre") {
  if (phase === "post") return postEventSchedule(index);
  if (phase === "event") return eventWeekSchedule(index);
  return preEventSchedule(priority, index);
}
