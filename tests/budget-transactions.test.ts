import { describe, expect, it } from "vitest";

/** สอดคล้อง syncBudgetItemFromTransactions — รวมเฉพาะ PAID/VERIFIED */
function sumActualFromTransactions(txs: Array<{ amount: number; status: string }>) {
  return txs
    .filter((tx) => tx.status === "PAID" || tx.status === "VERIFIED")
    .reduce((sum, tx) => sum + tx.amount, 0);
}

describe("budget transactions sync", () => {
  it("sums only PAID and VERIFIED into actual", () => {
    const txs = [
      { amount: 1000, status: "PAID" },
      { amount: 500, status: "VERIFIED" },
      { amount: 2000, status: "REQUESTED" },
      { amount: 300, status: "COMMITTED" }
    ];
    expect(sumActualFromTransactions(txs)).toBe(1500);
  });

  it("returns zero when no paid transactions", () => {
    expect(sumActualFromTransactions([{ amount: 100, status: "DRAFT" }])).toBe(0);
  });
});
