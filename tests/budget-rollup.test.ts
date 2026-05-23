import { describe, expect, it } from "vitest";

describe("budget rollup", () => {
  it("sums committee items into project totals", () => {
    const items = [
      { committee_id: "c1", planned_amount: 100, actual_amount: 40 },
      { committee_id: "c1", planned_amount: 50, actual_amount: 10 },
      { committee_id: "c2", planned_amount: 200, actual_amount: 80 }
    ];
    const projectPlanned = items.reduce((sum, item) => sum + item.planned_amount, 0);
    const projectActual = items.reduce((sum, item) => sum + item.actual_amount, 0);
    expect(projectPlanned).toBe(350);
    expect(projectActual).toBe(130);

    const byCommittee = (committeeId: string) =>
      items.filter((item) => item.committee_id === committeeId).reduce((sum, item) => sum + item.actual_amount, 0);
    expect(byCommittee("c1")).toBe(50);
    expect(byCommittee("c2")).toBe(80);
  });
});
