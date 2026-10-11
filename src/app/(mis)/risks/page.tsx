import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { RiskManager } from "@/components/risk-manager";
import { Badge } from "@/components/ui";
import { authOptions } from "@/lib/auth";
import { thaiRiskLevel } from "@/lib/utils";
import { PageHeader, PageLink, PageStack, SectionCard, SplitLayout } from "@/components/page/page-layout";
import { getCommitteeAccessContext } from "@/server/auth/committee-access";
import { getSessionUser } from "@/server/auth/session";
import { getRisksPageData } from "@/server/project/loaders/risks";
import { canManageRisksGlobally } from "@/server/risks/access";

type RisksPageProps = {
  searchParams?: Promise<{ level?: string; l?: string; i?: string }>;
};

export default async function RisksPage({ searchParams }: RisksPageProps) {
  const data = await getRisksPageData();
  if (!data) notFound();

  const session = await getServerSession(authOptions);
  const user = getSessionUser(session);
  const canManageGlobal = user ? canManageRisksGlobally(user) : false;
  const access = user ? await getCommitteeAccessContext(user, data.project.id) : null;
  const manageCommitteeIds =
    user && !canManageGlobal && user.roles.includes("Committee Lead") ? (access?.committeeIds ?? []) : [];

  const params = (await searchParams) ?? {};
  // กรองตาม "ช่อง" (โอกาส × ผลกระทบ) — เดิมกรองตามคะแนน ทำให้ช่อง 1×4, 4×1, 2×2 ปนกัน
  const selectedLikelihood = Number(params.l) || undefined;
  const selectedImpact = Number(params.i) || undefined;
  const risks = data.risks.filter((risk) => {
    if (params.level && risk.level !== params.level) return false;
    if (selectedLikelihood && risk.likelihood !== selectedLikelihood) return false;
    if (selectedImpact && risk.impact !== selectedImpact) return false;
    return true;
  });

  return (
    <PageStack>
      <PageHeader
        title="ทะเบียนความเสี่ยง"
        subtitle={`${data.risks.length} รายการ · ${data.summary.criticalRisks} ต้องตัดสินใจ`}
        actions={
          <>
            <PageLink href="/risks?level=Critical" active={params.level === "Critical"}>
              วิกฤต
            </PageLink>
            <PageLink href="/risks?level=High" active={params.level === "High"}>
              สูง
            </PageLink>
            <PageLink href="/reports">ส่งออกรายงาน</PageLink>
          </>
        }
      />

      <RiskManager
        risks={data.risks.map((risk) => ({
          id: risk.id,
          code: risk.code,
          title: risk.title,
          committee_id: risk.committee_id,
          committee: { name: risk.committee.name },
          task_id: risk.task_id,
          likelihood: risk.likelihood,
          impact: risk.impact,
          score: risk.score,
          level: risk.level,
          mitigation_plan: risk.mitigation_plan,
          contingency_plan: risk.contingency_plan,
          owner_name: risk.owner_name,
          owner_initials: risk.owner_initials,
          status: risk.status
        }))}
        committees={data.committees.map((c) => ({ id: c.id, name: c.name }))}
        tasks={data.tasks.map((t) => ({ id: t.id, code: t.code, title: t.title, committee_id: t.committee_id }))}
        canManageGlobal={canManageGlobal}
        manageCommitteeIds={manageCommitteeIds}
      />

      <SplitLayout
        asideFirstOnMobile
        main={
          <SectionCard
            title={
              selectedLikelihood && selectedImpact
                ? `ความเสี่ยง โอกาส ${selectedLikelihood} × ผลกระทบ ${selectedImpact}`
                : "ความเสี่ยงทั้งหมด"
            }
            action={
              selectedLikelihood || params.level ? (
                <Link href="/risks" className="text-sm font-bold text-[#123f76] underline">
                  ล้างตัวกรอง
                </Link>
              ) : undefined
            }
          >
            <div className="space-y-3">
              {risks.map((risk) => (
                <Link
                  href={risk.task_id ? `/tasks/detail?id=${risk.task_id}` : "/risks"}
                  key={risk.id}
                  className="block rounded-md border p-3 active:bg-[#fbfaf5] hover:border-[#b68a2e] sm:p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Badge>{risk.code}</Badge>
                      <h3 className="mt-2 text-sm font-black leading-snug sm:text-base">{risk.title}</h3>
                      <p className="text-xs text-[#667085] sm:text-sm">
                        โอกาส{risk.likelihood}×ผลกระทบ{risk.impact} · {risk.committee.name} · {risk.owner_name}
                      </p>
                      <p className="mt-2 line-clamp-2 text-xs sm:text-sm">แนวทางลดความเสี่ยง: {risk.mitigation_plan}</p>
                    </div>
                    <Badge tone={risk.level === "Critical" || risk.level === "High" ? "red" : "gold"}>
                      {risk.score} · {thaiRiskLevel(risk.level)}
                    </Badge>
                  </div>
                </Link>
              ))}
              {!risks.length ? <p className="text-sm text-[#667085]">ไม่พบความเสี่ยงตามตัวกรองนี้</p> : null}
            </div>
          </SectionCard>
        }
        aside={
          <SectionCard title="เมทริกซ์ความเสี่ยง">
            <p className="mb-2 text-xs text-[#667085]">แกนตั้ง = โอกาสเกิด (5 สูงสุดอยู่บน) · แกนนอน = ผลกระทบ · แตะช่องเพื่อกรอง</p>
            <div className="mis-table-scroll -mx-1 px-1">
              <div className="inline-grid min-w-[300px] grid-cols-[auto_repeat(5,minmax(0,1fr))] gap-1 sm:min-w-0 sm:w-full">
                {Array.from({ length: 5 }, (_, row) => {
                  const likelihood = 5 - row;
                  return [
                    <span key={`l${likelihood}`} className="grid place-items-center px-1 text-xs font-bold text-[#667085]">
                      {likelihood}
                    </span>,
                    ...Array.from({ length: 5 }, (_, col) => {
                      const impact = col + 1;
                      const score = likelihood * impact;
                      const count = data.risks.filter((r) => r.likelihood === likelihood && r.impact === impact).length;
                      const active = selectedLikelihood === likelihood && selectedImpact === impact;
                      return (
                        <Link
                          href={active ? "/risks" : `/risks?l=${likelihood}&i=${impact}`}
                          key={`${likelihood}-${impact}`}
                          aria-current={active ? "true" : undefined}
                          className={`grid aspect-square min-h-[44px] place-items-center rounded text-sm font-black ${active ? "ring-2 ring-[#123f76] ring-offset-1" : ""}`}
                          style={{
                            background: score >= 16 ? "#ffe3e7" : score >= 11 ? "#fff0d0" : score >= 6 ? "#edf6ff" : "#ecf9ef",
                            color: score >= 16 ? "#b91528" : "#123f76"
                          }}
                          title={`โอกาส ${likelihood} × ผลกระทบ ${impact} = คะแนน ${score} · ${count} รายการ`}
                        >
                          {count || ""}
                        </Link>
                      );
                    })
                  ];
                })}
                <span />
                {[1, 2, 3, 4, 5].map((impact) => (
                  <span key={`i${impact}`} className="text-center text-xs font-bold text-[#667085]">
                    {impact}
                  </span>
                ))}
              </div>
            </div>
          </SectionCard>
        }
      />
    </PageStack>
  );
}
