import { NextResponse } from "next/server";
import { errors } from "@/lib/messages";
import { prisma } from "@/lib/prisma";
import { invalidateProjectCache } from "@/server/cache/invalidate";
import { canManageBudget } from "@/server/budget/access";
import {
  afterBudgetTransactionChange,
  deleteBudgetTransaction,
  parseTransactionAmount,
  parseTransactionStatus,
  updateBudgetTransaction
} from "@/server/budget/transactions";
import { requireApiSession } from "@/server/auth/session";
import { forbiddenResponse } from "@/server/permissions/assert";
import { getActiveProjectForUser } from "@/server/tenant/project-access";

function idsFromUrl(request: Request) {
  const parts = new URL(request.url).pathname.split("/").filter(Boolean);
  const itemsIdx = parts.indexOf("items");
  const txIdx = parts.indexOf("transactions");
  return {
    itemId: itemsIdx >= 0 ? parts[itemsIdx + 1] : "",
    transactionId: txIdx >= 0 ? parts[txIdx + 1] : ""
  };
}

export async function PATCH(request: Request) {
  const auth = await requireApiSession();
  if ("error" in auth) return auth.error;

  const active = await getActiveProjectForUser(auth.user);
  if (!active) return NextResponse.json({ error: errors.noActiveProject }, { status: 404 });
  if (!(await canManageBudget(auth.user, active.id))) {
    return forbiddenResponse("คุณไม่มีสิทธิ์แก้ไขธุรกรรมงบประมาณ");
  }

  const { itemId, transactionId } = idsFromUrl(request);
  const body = await request.json().catch(() => ({}));

  try {
    const tx = await updateBudgetTransaction(transactionId, itemId, {
      ...(body.amount !== undefined ? { amount: parseTransactionAmount(body.amount) } : {}),
      ...(body.status !== undefined ? { status: parseTransactionStatus(body.status) } : {}),
      ...(body.note !== undefined ? { note: body.note === null ? null : String(body.note) } : {})
    });
    await afterBudgetTransactionChange(active.id, itemId);
    await invalidateProjectCache(active.id);
    return NextResponse.json(tx);
  } catch (error) {
    const message = error instanceof Error ? error.message : errors.dataInvalid;
    return NextResponse.json({ error: message }, { status: message === "ไม่พบธุรกรรมงบประมาณ" ? 404 : 400 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireApiSession();
  if ("error" in auth) return auth.error;

  const active = await getActiveProjectForUser(auth.user);
  if (!active) return NextResponse.json({ error: errors.noActiveProject }, { status: 404 });
  if (!(await canManageBudget(auth.user, active.id))) {
    return forbiddenResponse("คุณไม่มีสิทธิ์ลบธุรกรรมงบประมาณ");
  }

  const { itemId, transactionId } = idsFromUrl(request);
  try {
    await deleteBudgetTransaction(transactionId, itemId);
    await afterBudgetTransactionChange(active.id, itemId);
    await prisma.auditLog.create({
      data: {
        user_id: auth.user.id,
        action: "Delete budget transaction",
        entity_type: "BudgetTransaction",
        entity_id: transactionId
      }
    });
    await invalidateProjectCache(active.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : errors.dataInvalid;
    return NextResponse.json({ error: message }, { status: message === "ไม่พบธุรกรรมงบประมาณ" ? 404 : 400 });
  }
}
