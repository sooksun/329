/**
 * โครงสร้างข้อมูลที่ "freeze" ไว้ใน DashboardSnapshot.data (JSON) — ใช้สร้างรายงาน PowerPoint
 * snapshot รุ่นเก่ามีเฉพาะบาง field จึงต้องอ่านแบบทนข้อมูลขาด (parseSnapshotData)
 */
export type SnapshotCommittee = {
  name: string;
  progress: number;
  totalTasks: number;
  completedTasks: number;
  delayedTasks: number;
  budgetPlanned: number;
  budgetUsed: number;
};

export type SnapshotRisk = {
  code: string;
  title: string;
  likelihood: number;
  impact: number;
  score: number;
  level: string;
  committee?: { name: string } | null;
};

export type SnapshotTimelineItem = { code: string; title: string; start: string; due: string; status: string };

export type SnapshotData = {
  projectSummary?: { name?: string; edition?: string; event_date?: string; event_end_date?: string | null };
  overallProgress?: number;
  metrics?: {
    reported: number;
    totalTasks: number;
    completedTasks: number;
    delayedTasks: number;
    criticalRisks: number;
    evidencePending: number;
    daysRemaining: number;
  };
  committeeProgress?: SnapshotCommittee[];
  budgetSummary?: { planned: number; requested: number; approved: number; committed: number; actual: number };
  delayedTasks?: string[];
  criticalRisks?: SnapshotRisk[];
  /** จำนวนความเสี่ยงทั้งหมดต่อช่อง [โอกาส-1][ผลกระทบ-1] */
  riskMatrix?: number[][];
  evidenceSummary?: number;
  next7DaysTasks?: string[];
  decisionsNeeded?: string[];
  timeline?: SnapshotTimelineItem[];
};

export function parseSnapshotData(raw: string): SnapshotData {
  try {
    const value = JSON.parse(raw) as unknown;
    return value && typeof value === "object" ? (value as SnapshotData) : {};
  } catch {
    return {};
  }
}

export function buildRiskMatrix(risks: { likelihood: number; impact: number }[]) {
  const matrix = Array.from({ length: 5 }, () => Array<number>(5).fill(0));
  for (const risk of risks) {
    const l = Math.min(5, Math.max(1, risk.likelihood)) - 1;
    const i = Math.min(5, Math.max(1, risk.impact)) - 1;
    matrix[l]![i]! += 1;
  }
  return matrix;
}
