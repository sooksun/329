import { NextResponse } from "next/server";
import type { BudgetStatus } from "@prisma/client";
import { errors } from "@/lib/messages";
import { prisma } from "@/lib/prisma";
import { invalidateProjectCache } from "@/server/cache/invalidate";
import { canManageBudget } from "@/server/budget/access";
import { rollupBudgetTotals } from "@/server/budget/rollup";
import { getActiveProjectForUser } from "@/server/tenant/project-access";
import { requireApiSession } from "@/server/auth/session";
import { forbiddenResponse } from "@/server/permissions/assert";

const budgetStatuses = new Set<BudgetStatus>(["DRAFT", "REQUESTED", "APPROVED", "COMMITTED", "PAID", "VERIFIED"]);

function parseAmount(value: unknown) {
  if (value === undefined) return undefined;
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error(errors.budgetAmountNegative);
  }
  return amount;
}

export async function PATCH(request: Request) {
  const auth = await requireApiSession();
  if ("error" in auth) return auth.error;

  const id = new URL(request.url).pathname.split("/").pop();
  if (!id) return NextResponse.json({ error: errors.idRequired }, { status: 400 });

  const active = await getActiveProjectForUser(auth.user);
  if (!active) return NextResponse.json({ error: errors.noActiveProject }, { status: 404 });

  const item = await prisma.budgetItem.findUnique({
    where: { id },
    include: { committee: true }
  });
  if (!item || item.deleted_at) {
    return NextResponse.json({ error: "ไม่พบรายการงบประมาณ" }, { status: 404 });
  }
  if (item.project_id !== active.id) {
    return NextResponse.json({ error: errors.taskWrongProject }, { status: 403 });
  }

  if (!(await canManageBudget(auth.user, item.project_id))) {
    return forbiddenResponse("คุณไม่มีสิทธิ์แก้ไขงบประมาณ");
  }

  const body = await request.json().catch(() => ({}));

  let actual_amount: number | undefined;
  let approved_amount: number | undefined;
  let requested_amount: number | undefined;
  let committed_amount: number | undefined;
  let planned_amount: number | undefined;

  try {
    actual_amount = parseAmount(body.actual_amount);
    approved_amount = parseAmount(body.approved_amount);
    requested_amount = parseAmount(body.requested_amount);
    committed_amount = parseAmount(body.committed_amount);
    planned_amount = parseAmount(body.planned_amount);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : errors.budgetAmountNegative },
      { status: 400 }
    );
  }

  const status = body.status !== undefined ? String(body.status) : undefined;
  if (status !== undefined && !budgetStatuses.has(status as BudgetStatus)) {
    return NextResponse.json({ error: errors.statusInvalid }, { status: 400 });
  }

  const receipt_no =
    body.receipt_no !== undefined ? (body.receipt_no === null || body.receipt_no === "" ? null : String(body.receipt_no)) : undefined;

  const updated = await prisma.budgetItem.update({
    where: { id },
    data: {
      ...(actual_amount !== undefined ? { actual_amount } : {}),
      ...(approved_amount !== undefined ? { approved_amount } : {}),
      ...(requested_amount !== undefined ? { requested_amount } : {}),
      ...(committed_amount !== undefined ? { committed_amount } : {}),
      ...(planned_amount !== undefined ? { planned_amount } : {}),
      ...(status !== undefined ? { status: status as BudgetStatus } : {}),
      ...(receipt_no !== undefined ? { receipt_no } : {}),
      updated_by: auth.user.id
    },
    include: { committee: true, task: true }
  });

  await rollupBudgetTotals(item.project_id);
  await prisma.auditLog.create({
    data: {
      user_id: auth.user.id,
      action: "Update budget item",
      entity_type: "BudgetItem",
      entity_id: id,
      old_value: JSON.stringify(item),
      new_value: JSON.stringify(updated)
    }
  });
  await invalidateProjectCache(item.project_id);
  return NextResponse.json(updated);
}
