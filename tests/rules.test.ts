import { describe, expect, it } from "vitest";
import {
  autoDelayStatus,
  canMarkDone,
  taskDoneBlockers,
  computeRisk,
  detectBudgetOverrun,
  evidenceProgress,
  hasDependencyLoop,
  validateBudget,
  validateSubtaskInput,
  validateTaskInput,
  weightedProgress
} from "../src/lib/rules";

describe("329 MIS business rules", () => {
  it("creates weighted progress safely", () => {
    expect(weightedProgress([{ weight: 2, verified_progress: 50 }, { weight: 1, verified_progress: 100 }])).toBe(67);
    expect(weightedProgress([])).toBe(0);
  });

  it("rolls up evidence progress", () => {
    expect(evidenceProgress(4, 3)).toBe(75);
    expect(evidenceProgress(0, 0)).toBe(100);
  });

  it("auto-marks overdue tasks delayed unless complete", () => {
    expect(autoDelayStatus("IN_PROGRESS", new Date("2020-01-01"), new Date("2026-01-01"))).toBe("DELAYED");
    expect(autoDelayStatus("DONE", new Date("2020-01-01"), new Date("2026-01-01"))).toBe("DONE");
  });

  it("validates subtask notes and progress", () => {
    expect(() => validateSubtaskInput({ title: "  ", reported_progress: 0, verified_progress: 0 })).toThrow();
    expect(() => validateSubtaskInput({ title: "งานย่อย", reported_progress: 101, verified_progress: 0 })).toThrow();
    expect(validateSubtaskInput({ title: "งานย่อย", reported_progress: 50, verified_progress: 80 })).toBe(true);
  });

  it("guards invalid dates and missing owners", () => {
    expect(() => validateTaskInput({ owner_id: null, priority: "HIGH", start_date: new Date(), due_date: new Date(), reported_progress: 20, verified_progress: 10 })).toThrow();
    expect(() => validateTaskInput({ owner_id: "u1", priority: "HIGH", start_date: new Date("2026-02-02"), due_date: new Date("2026-02-01"), reported_progress: 20, verified_progress: 10 })).toThrow();
    expect(() => validateTaskInput({ owner_id: "u1", priority: "HIGH", start_date: new Date(), due_date: new Date(), reported_progress: 101, verified_progress: 10 })).toThrow();
    expect(() => validateTaskInput({ owner_id: "u1", priority: "HIGH", start_date: new Date(), due_date: new Date(), reported_progress: 20, verified_progress: -1 })).toThrow();
  });

  it("enforces done workflow", () => {
    const ready = { hasApprovedEvidence: true, hasReviewer: true, verified_progress: 100 };
    expect(canMarkDone(ready)).toBe(true);
    expect(taskDoneBlockers(ready)).toEqual([]);
    expect(canMarkDone({ hasApprovedEvidence: false, hasReviewer: true, verified_progress: 100 })).toBe(false);
    expect(canMarkDone({ hasApprovedEvidence: true, hasReviewer: false, verified_progress: 100 })).toBe(false);
    expect(canMarkDone({ hasApprovedEvidence: true, hasReviewer: true, verified_progress: 99 })).toBe(false);
    expect(taskDoneBlockers({ hasApprovedEvidence: false, hasReviewer: false, verified_progress: 50 }).length).toBe(3);
  });

  it("detects budget overruns and invalid budget", () => {
    expect(detectBudgetOverrun(120, 100)).toBe(true);
    expect(() => validateBudget({ amount: -1, project_id: "p", task_id: "t" })).toThrow();
    expect(() => validateBudget({ amount: 1, project_id: "p" })).toThrow();
  });

  it("calculates risk levels", () => {
    expect(computeRisk(4, 4)).toEqual({ score: 16, level: "Critical" });
    expect(computeRisk(2, 3)).toEqual({ score: 6, level: "Medium" });
  });

  it("prevents circular dependencies", () => {
    expect(hasDependencyLoop([{ task_id: "a", depends_on_id: "b" }, { task_id: "b", depends_on_id: "c" }], { task_id: "c", depends_on_id: "a" })).toBe(true);
    expect(hasDependencyLoop([{ task_id: "a", depends_on_id: "b" }], { task_id: "c", depends_on_id: "a" })).toBe(false);
  });
});
