import { NextResponse } from "next/server";
import { errors } from "@/lib/messages";
import { prisma } from "@/lib/prisma";
import { invalidateProjectCache } from "@/server/cache/invalidate";
import { canManageBudget } from "@/server/budget/access";
import {
  afterBudgetTransactionChange,
  createBudgetTransaction,
  listBudgetTransactions,
  parseTransactionAmount,
  parseTransactionStatus
} from "@/server/budget/transactions";
import { requireApiSession } from "@/server/auth/session";
import { forbiddenResponse } from "@/server/permissions/assert";
import { getActiveProjectForUser } from "@/server/tenant/project-access";

function budgetItemIdFromUrl(request: Request) {
  const parts = new URL(request.url).pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("items");
  return idx >= 0 ? parts[idx + 1] : "";
}

async function loadBudgetItem(itemId: string, projectId: string) {
  return prisma.budgetItem.findFirst({
    where: { id: itemId, project_id: projectId, deleted_at: null }
  });
}

export async function GET(request: Request) {
  const auth = await requireApiSession();
  if ("error" in auth) return auth.error;

  const active = await getActiveProjectForUser(auth.user);
  if (!active) return NextResponse.json({ error: errors.noActiveProject }, { status: 404 });

  const itemId = budgetItemIdFromUrl(request);
  const item = await loadBudgetItem(itemId, active.id);
  if (!item) return NextResponse.json({ error: "ไม่พบรายการงบประมาณ" }, { status: 404 });

  const transactions = await listBudgetTransactions(itemId);
  const userIds = [...new Set(transactions.map((t) => t.created_by).filter(Boolean) as string[])];
  const users = userIds.length
    ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } })
    : [];
  const names = new Map(users.map((u) => [u.id, u.name]));

  return NextResponse.json({
    items: transactions.map((tx) => ({
      id: tx.id,
      amount: tx.amount,
      status: tx.status,
      note: tx.note,
      created_at: tx.created_at,
      created_by_name: tx.created_by ? (names.get(tx.created_by) ?? "ผู้ใช้") : "—"
    })),
    actual_amount: item.actual_amount,
    canManage: await canManageBudget(auth.user, active.id)
  });
}

export async function POST(request: Request) {
  const auth = await requireApiSession();
  if ("error" in auth) return auth.error;

  const active = await getActiveProjectForUser(auth.user);
  if (!active) return NextResponse.json({ error: errors.noActiveProject }, { status: 404 });
  if (!(await canManageBudget(auth.user, active.id))) {
    return forbiddenResponse("คุณไม่มีสิทธิ์บันทึกธุรกรรมงบประมาณ");
  }

  const itemId = budgetItemIdFromUrl(request);
  const item = await loadBudgetItem(itemId, active.id);
  if (!item) return NextResponse.json({ error: "ไม่พบรายการงบประมาณ" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  try {
    const amount = parseTransactionAmount(body.amount);
    const status = parseTransactionStatus(body.status);
    const tx = await createBudgetTransaction({
      budgetItemId: itemId,
      amount,
      status,
      note: body.note != null ? String(body.note) : null,
      createdById: auth.user.id
    });
    await afterBudgetTransactionChange(active.id, itemId);
    await prisma.auditLog.create({
      data: {
        user_id: auth.user.id,
        action: "Create budget transaction",
        entity_type: "BudgetTransaction",
        entity_id: tx.id,
        new_value: JSON.stringify(tx)
      }
    });
    await invalidateProjectCache(active.id);
    const updated = await loadBudgetItem(itemId, active.id);
    return NextResponse.json({ transaction: tx, actual_amount: updated?.actual_amount ?? 0 }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : errors.dataInvalid },
      { status: 400 }
    );
  }
}
