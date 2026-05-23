export type TaskBoardItem = {
  id: string;
  code: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  committee_id: string;
  committeeName: string;
  ownerName: string | null;
  dueDateIso: string;
  reported_progress: number;
  verified_progress: number;
  evidenceCount: number;
  hasBudget: boolean;
  hasRisk: boolean;
};

export type TaskBoardFilters = {
  committee?: string;
  priority?: string;
  status?: string;
  search?: string;
};

export const TASK_BOARD_STATUSES = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "SUBMITTED",
  "REVISION_REQUIRED",
  "VERIFIED",
  "DONE",
  "DELAYED"
] as const;
