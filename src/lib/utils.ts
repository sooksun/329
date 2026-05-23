import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBaht(value: number) {
  if (value >= 1_000_000) return `฿${(value / 1_000_000).toFixed(2)}ล้าน`;
  if (value >= 1_000) return `฿${Math.round(value / 1_000)}พัน`;
  return `฿${value.toLocaleString("th-TH")}`;
}

export function clampProgress(value: number) {
  return Math.max(0, Math.min(100, Math.round(value || 0)));
}

export function riskLevel(score: number) {
  if (score >= 16) return "Critical";
  if (score >= 11) return "High";
  if (score >= 6) return "Medium";
  return "Low";
}

export function thaiRiskStatus(status: string) {
  const map: Record<string, string> = {
    OPEN: "เปิด",
    MITIGATING: "กำลังลดความเสี่ยง",
    WATCHING: "เฝ้าระวัง",
    CLOSED: "ปิดแล้ว"
  };
  return map[status] ?? status;
}

export function thaiRiskLevel(level: string) {
  const map: Record<string, string> = {
    Critical: "วิกฤต",
    High: "สูง",
    Medium: "ปานกลาง",
    Low: "ต่ำ"
  };
  return map[level] ?? level;
}

export function thaiStatus(status: string) {
  const map: Record<string, string> = {
    NOT_STARTED: "ยังไม่เริ่ม",
    IN_PROGRESS: "กำลังดำเนินการ",
    SUBMITTED: "ส่งตรวจ",
    REVISION_REQUIRED: "ต้องแก้ไข",
    VERIFIED: "ตรวจแล้ว",
    DONE: "เสร็จสิ้น",
    DELAYED: "ล่าช้า",
    PENDING: "รอตรวจ",
    APPROVED: "อนุมัติแล้ว",
    REJECTED: "ไม่ผ่าน",
    DRAFT: "ร่าง",
    REQUESTED: "ขออนุมัติ",
    APPROVED_BUDGET: "อนุมัติแล้ว",
    COMMITTED: "ผูกพัน",
    PAID: "จ่ายแล้ว"
  };
  return map[status] ?? status;
}

export function thaiReportType(type: string) {
  const map: Record<string, string> = {
    EXECUTIVE_SUMMARY: "สรุปผู้บริหาร",
    COMMITTEE_PROGRESS: "ความก้าวหน้าคณะกรรมการ",
    BUDGET_REPORT: "รายงานงบประมาณ",
    FINAL_EVENT_REPORT: "รายงานหลังจัดงาน"
  };
  return map[type] ?? type;
}
