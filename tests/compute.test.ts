import { describe, expect, it } from "vitest";
import { computeProjectSummary } from "../src/server/project/compute";

const task = (id: string, evidenceStatuses: string[]) =>
  ({
    id,
    weight: 1,
    verified_progress: 0,
    reported_progress: 0,
    status: "IN_PROGRESS",
    due_date: new Date("2030-01-01"),
    evidence: evidenceStatuses.map((status, index) => ({ id: `${id}-e${index}`, status }))
  }) as never;

describe("project summary", () => {
  it("measures evidence coverage as share of tasks with approved evidence", () => {
    const summary = computeProjectSummary({
      project: { event_date: new Date("2030-01-01"), planned_budget: 0, actual_budget: 0 },
      // 1 ใน 4 ภารกิจมีหลักฐานอนุมัติ (ภารกิจแรกมีหลักฐานอนุมัติ 3 ชิ้น — ต้องไม่นับเกิน)
      tasks: [task("a", ["APPROVED", "APPROVED", "APPROVED"]), task("b", ["PENDING"]), task("c", ["REJECTED"]), task("d", [])],
      evidence: [],
      risks: [],
      budgetItems: []
    });
    expect(summary.evidenceCoverage).toBe(25);
  });
});
