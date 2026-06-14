import Link from "next/link";
import { getServerSession } from "next-auth";
import { Badge, ProgressBar } from "@/components/ui";
import { BudgetChart } from "@/components/budget-chart";
import { BudgetItemEditor } from "@/components/budget-item-editor";
import { BudgetTransactionsPanel } from "@/components/budget-transactions-panel";
import { authOptions } from "@/lib/auth";
import {
  ChartBox,
  MetricGrid,
  MetricTile,
  PageHeader,
  PageLink,
  PageStack,
  SectionCard,
  SplitLayout
} from "@/components/page/page-layout";
import { prisma } from "@/lib/prisma";
import { getBudgetPageData } from "@/server/project/loaders/budget";
import { canManageBudget, FINANCE_COMMITTEE_NAME } from "@/server/budget/access";
import { getSessionUser } from "@/server/auth/session";
import { formatBaht, thaiStatus } from "@/lib/utils";

type BudgetPageProps = {
  searchParams?: Promise<{ filter?: string }>;
};

export default async function BudgetPage({ searchParams }: BudgetPageProps) {
  const data = await getBudgetPageData();
  if (!data) return null;
  const session = await getServerSession(authOptions);
  const user = getSessionUser(session);
  const canEditBudget = user ? await canManageBudget(user, data.project.id) : false;
  const params = (await searchParams) ?? {};
  const b = data.summary.budget;
  const budgetCommittee = data.committees.find((committee) => committee.name === FINANCE_COMMITTEE_NAME);
  const chartData = data.committeeStats.map((committee) => ({
    name: committee.name,
    planned: Math.round(committee.budgetPlanned / 1000),
    actual: Math.round(committee.budgetUsed / 1000)
  }));
  const budgetItems =
    params.filter === "over" ? data.budgetItems.filter((item) => item.actual_amount > item.approved_amount) : data.budgetItems;

  const txAuthorIds = [
    ...new Set(
      budgetItems.flatMap((item) => item.transactions.map((tx) => tx.created_by).filter(Boolean) as string[])
    )
  ];
  const txAuthors = txAuthorIds.length
    ? await prisma.user.findMany({ where: { id: { in: txAuthorIds } }, select: { id: true, name: true } })
    : [];
  const txAuthorNames = new Map(txAuthors.map((u) => [u.id, u.name]));

  return (
    <PageStack>
      <PageHeader
        title="งบประมาณโครงการ"
        subtitle={`แผน ${formatBaht(b.planned)} · ใช้จริง ${Math.round((b.actual / Math.max(1, b.planned)) * 100)}%`}
        actions={
          <>
            <PageLink href="/budget?filter=over" active={params.filter === "over"}>
              เกินงบ
            </PageLink>
            <PageLink href="/reports">ส่งออกรายงาน</PageLink>
            <PageLink href={budgetCommittee ? `/tasks?committee=${budgetCommittee.id}` : "/tasks"} variant="gold">
              งานงบประมาณ
            </PageLink>
          </>
        }
      />

      <MetricGrid columns="four">
        {[
          ["งบที่วางแผน", formatBaht(b.planned)],
          ["ขอเบิกแล้ว", formatBaht(b.requested)],
          ["อนุมัติแล้ว", formatBaht(b.approved)],
          ["ใช้จริง", formatBaht(b.actual)],
          ["คงเหลือ", formatBaht(b.approved - b.actual)]
        ].map(([label, value]) => (
          <MetricTile key={label} label={label} value={value} />
        ))}
      </MetricGrid>

      <SplitLayout
        asideWidth="lg"
        main={
          <SectionCard title="การใช้จ่ายตามคณะอนุกรรมการ">
            <ChartBox height="h-72 sm:h-96">
              <BudgetChart data={chartData} />
            </ChartBox>
          </SectionCard>
        }
        aside={
          <SectionCard title="รายการงบประมาณ">
            <div className="max-h-[70vh] space-y-3 overflow-y-auto sm:max-h-none">
              {budgetItems.slice(0, 14).map((item) => (
                <div className="rounded-md border p-3 hover:border-[#b68a2e]" key={item.id}>
                  <Link
                    href={item.task_id ? `/tasks/detail?id=${item.task_id}` : "/budget"}
                    className="block active:bg-[#fbfaf5]"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                      <b className="text-sm leading-snug">{item.title}</b>
                      <Badge tone={item.actual_amount > item.approved_amount ? "red" : "green"}>{thaiStatus(item.status)}</Badge>
                    </div>
                    <ProgressBar
                      value={(item.actual_amount / Math.max(1, item.approved_amount)) * 100}
                      color={item.actual_amount > item.approved_amount ? "#b91528" : "#123f76"}
                    />
                    <p className="text-xs text-[#667085]">
                      {formatBaht(item.actual_amount)} / {formatBaht(item.approved_amount)} · {item.committee.name}
                    </p>
                  </Link>
                  {canEditBudget ? (
                    <BudgetItemEditor
                      id={item.id}
                      title={item.title}
                      status={item.status}
                      receiptNo={item.receipt_no}
                      actualAmount={item.actual_amount}
                      approvedAmount={item.approved_amount}
                      requestedAmount={item.requested_amount}
                    />
                  ) : null}
                  <BudgetTransactionsPanel
                    budgetItemId={item.id}
                    canManage={canEditBudget}
                    initialTransactions={item.transactions.map((tx) => ({
                      id: tx.id,
                      amount: tx.amount,
                      status: tx.status,
                      note: tx.note,
                      created_at: tx.created_at.toISOString(),
                      created_by_name: tx.created_by ? (txAuthorNames.get(tx.created_by) ?? "ผู้ใช้") : "—"
                    }))}
                  />
                </div>
              ))}
            </div>
          </SectionCard>
        }
      />
    </PageStack>
  );
}
