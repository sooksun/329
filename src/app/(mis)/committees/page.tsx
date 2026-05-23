import Link from "next/link";
import { getServerSession } from "next-auth";
import { CommitteeManager } from "@/components/committee-manager";
import { Badge, Card, ProgressBar } from "@/components/ui";
import { authOptions } from "@/lib/auth";
import {
  CardGrid,
  MetricGrid,
  MetricTile,
  PageHeader,
  PageLink,
  PageStack
} from "@/components/page/page-layout";
import { linkButtonClasses } from "@/lib/button-styles";
import { getCommitteesPageData } from "@/server/project/loaders/committees";
import { canManageCommitteeMembers, canManageCommitteesGlobally } from "@/server/committees/access";
import { listCommitteesWithMembers, listUsersForCommitteePicker } from "@/server/committees/manage";
import { getSessionUser } from "@/server/auth/session";
import { formatBaht, thaiRiskLevel } from "@/lib/utils";

type CommitteesPageProps = {
  searchParams?: Promise<{ filter?: string }>;
};

export default async function CommitteesPage({ searchParams }: CommitteesPageProps) {
  const data = await getCommitteesPageData();
  if (!data) return null;

  const session = await getServerSession(authOptions);
  const user = getSessionUser(session);
  const committeesFull = await listCommitteesWithMembers(data.project.id);
  const pickerUsers = await listUsersForCommitteePicker(data.project.id);
  const canManageGlobal = user ? canManageCommitteesGlobally(user) : false;
  const memberManageRights: Record<string, boolean> = {};
  if (user) {
    for (const committee of committeesFull) {
      memberManageRights[committee.id] = await canManageCommitteeMembers(user, committee.id);
    }
  }

  const params = (await searchParams) ?? {};
  const committees =
    params.filter === "delayed"
      ? data.committeeStats.filter((committee) => committee.delayedTasks > 0)
      : params.filter === "risk"
        ? data.committeeStats.filter((committee) => ["High", "Critical"].includes(committee.riskLevel))
        : data.committeeStats;

  return (
    <PageStack>
      <PageHeader
        title="คณะอนุกรรมการ"
        subtitle={`${data.committees.length} ฝ่าย · ภารกิจรวม ${data.summary.totalTasks} งาน`}
        actions={
          <>
            <PageLink href="/committees?filter=delayed" active={params.filter === "delayed"}>
              มีงานล่าช้า
            </PageLink>
            <PageLink href="/committees?filter=risk" active={params.filter === "risk"}>
              เสี่ยงสูง
            </PageLink>
            <PageLink href="/reports">ส่งออกรายงาน</PageLink>
          </>
        }
      />

      <MetricGrid>
        {[
          ["ทั้งหมด", data.committeeStats.length],
          ["ตามแผน", data.committeeStats.filter((c) => c.delayedTasks === 0).length],
          ["ต้องระวัง", data.committeeStats.filter((c) => ["High", "Critical"].includes(c.riskLevel)).length],
          ["มีงานล่าช้า", data.committeeStats.filter((c) => c.delayedTasks > 0).length],
          ["หลักฐานขาด", data.committeeStats.filter((c) => c.missingEvidence > 0).length]
        ].map(([label, value]) => (
          <MetricTile key={label} label={label} value={value} />
        ))}
      </MetricGrid>

      <CommitteeManager
        committees={committeesFull.map((c) => ({
          id: c.id,
          name: c.name,
          owner_name: c.owner_name,
          owner_initials: c.owner_initials,
          sort_order: c.sort_order,
          risk_level: c.risk_level,
          planned_budget: c.planned_budget,
          members: c.members.map((m) => ({
            id: m.id,
            position: m.position,
            user: m.user
          })),
          _count: { tasks: c._count.tasks }
        }))}
        users={pickerUsers}
        canManageGlobal={canManageGlobal}
        memberManageRights={memberManageRights}
      />

      <CardGrid cols={3}>
        {committees.map((committee) => (
          <Card className="p-4 sm:p-5" key={committee.id}>
            <div className="mb-3 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="text-base font-black leading-snug sm:text-lg">{committee.name}</h2>
                <p className="text-xs text-[#667085] sm:text-sm">{committee.owner_name}</p>
              </div>
              <Badge tone={committee.delayedTasks ? "red" : "green"}>{committee.delayedTasks ? "ต้องเร่ง" : "ตามแผน"}</Badge>
            </div>
            <div className="mb-3">
              <div className="mb-1 flex justify-between text-xs font-bold sm:text-sm">
                <span>ความก้าวหน้า</span>
                <span>{committee.progress}%</span>
              </div>
              <ProgressBar value={committee.progress} />
            </div>
            <div className="grid grid-cols-3 gap-1 text-center text-xs sm:text-sm">
              <div>
                <b className="block text-lg sm:text-xl">{committee.totalTasks}</b>ภารกิจ
              </div>
              <div>
                <b className="block text-lg sm:text-xl">{committee.completedTasks}</b>เสร็จ
              </div>
              <div>
                <b className="block text-lg text-[#b91528] sm:text-xl">{committee.delayedTasks}</b>ล่าช้า
              </div>
            </div>
            <p className="mt-3 text-xs text-[#667085] sm:text-sm">
              หลักฐานขาด {committee.missingEvidence} · ความเสี่ยง {thaiRiskLevel(committee.riskLevel)}
              <br />
              งบ {formatBaht(committee.budgetUsed)} / {formatBaht(committee.budgetPlanned)}
            </p>
            <Link href={`/tasks?committee=${committee.id}`} className={linkButtonClasses("gold", "mt-4 w-full justify-center")}>
              เปิดบอร์ด
            </Link>
          </Card>
        ))}
      </CardGrid>
    </PageStack>
  );
}
