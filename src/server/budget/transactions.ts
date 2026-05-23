import type { BudgetStatus } from "@prisma/client";
import { errors } from "@/lib/messages";
import { prisma } from "@/lib/prisma";
import { rollupBudgetTotals } from "@/server/budget/rollup";

const budgetStatuses = new Set<BudgetStatus>(["DRAFT", "REQUESTED", "APPROVED", "COMMITTED", "PAID", "VERIFIED"]);
const ACTUAL_STATUSES: BudgetStatus[] = ["PAID", "VERIFIED"];

export function parseTransactionAmount(value: unknown) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) throw new Error(errors.budgetAmountNegative);
  return amount;
}

export function parseTransactionStatus(value: unknown): BudgetStatus {
  const status = String(value ?? "PAID") as BudgetStatus;
  if (!budgetStatuses.has(status)) throw new Error(errors.statusInvalid);
  return status;
}

/** รวมยอดจ่ายจริงจากธุรกรรม PAID/VERIFIED → BudgetItem.actual_amount */
export async function syncBudgetItemFromTransactions(budgetItemId: string) {
  const txs = await prisma.budgetTransaction.findMany({
    where: { budget_item_id: budgetItemId },
    select: { amount: true, status: true }
  });
  const actual_amount = txs
    .filter((tx) => ACTUAL_STATUSES.includes(tx.status))
    .reduce((sum, tx) => sum + tx.amount, 0);

  const item = await prisma.budgetItem.update({
    where: { id: budgetItemId },
    data: { actual_amount }
  });
  return item;
}

export async function listBudgetTransactions(budgetItemId: string) {
  return prisma.budgetTransaction.findMany({
    where: { budget_item_id: budgetItemId },
    orderBy: { created_at: "desc" }
  });
}

export async function createBudgetTransaction(input: {
  budgetItemId: string;
  amount: number;
  status: BudgetStatus;
  note?: string | null;
  createdById: string;
}) {
  const note = input.note?.trim() || null;
  return prisma.budgetTransaction.create({
    data: {
      budget_item_id: input.budgetItemId,
      amount: input.amount,
      status: input.status,
      note,
      created_by: input.createdById
    }
  });
}

export async function updateBudgetTransaction(
  transactionId: string,
  budgetItemId: string,
  data: { amount?: number; status?: BudgetStatus; note?: string | null }
) {
  const existing = await prisma.budgetTransaction.findFirst({
    where: { id: transactionId, budget_item_id: budgetItemId }
  });
  if (!existing) throw new Error("ไม่พบธุรกรรมงบประมาณ");

  const note = data.note !== undefined ? (data.note === null || data.note === "" ? null : data.note.trim()) : undefined;

  return prisma.budgetTransaction.update({
    where: { id: transactionId },
    data: {
      ...(data.amount !== undefined ? { amount: data.amount } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(note !== undefined ? { note } : {})
    }
  });
}

export async function deleteBudgetTransaction(transactionId: string, budgetItemId: string) {
  const existing = await prisma.budgetTransaction.findFirst({
    where: { id: transactionId, budget_item_id: budgetItemId }
  });
  if (!existing) throw new Error("ไม่พบธุรกรรมงบประมาณ");
  await prisma.budgetTransaction.delete({ where: { id: transactionId } });
}

export async function afterBudgetTransactionChange(projectId: string, budgetItemId: string) {
  await syncBudgetItemFromTransactions(budgetItemId);
  await rollupBudgetTotals(projectId);
}
