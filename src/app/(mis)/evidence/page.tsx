import { getServerSession } from "next-auth";
import { EvidenceActions } from "@/components/evidence-actions";
import { EvidenceUploadForm } from "@/components/evidence-upload-form";
import { Badge, Card } from "@/components/ui";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { filterTasksByCommitteeAccess, getCommitteeAccessContext } from "@/server/auth/committee-access";
import { getSessionUser } from "@/server/auth/session";
import { getEvidencePageData } from "@/server/project/loaders/evidence";
import { linkButtonClasses } from "@/lib/button-styles";
import { CardGrid, MetricGrid, MetricTile, PageHeader, PageStack } from "@/components/page/page-layout";
import { prisma } from "@/lib/prisma";
import { can, permissions } from "@/lib/rbac";
import { canReviewEvidence } from "@/server/permissions/assert";
import { thaiStatus } from "@/lib/utils";

export default async function EvidencePage() {
  const data = await getEvidencePageData();
  if (!data) return null;

  const session = await getServerSession(authOptions);
  const user = getSessionUser(session);
  const access = user ? await getCommitteeAccessContext(user, data.project.id) : null;
  const scopedTasks = access ? filterTasksByCommitteeAccess(data.tasks, access) : data.tasks;
  const scopedEvidence = access?.isGlobalAdmin
    ? data.evidence
    : data.evidence.filter((item) => access?.committeeIds.includes(item.committee_id));
  const userIds = Array.from(new Set(scopedEvidence.flatMap((item) => [item.created_by, item.reviewed_by]).filter(Boolean) as string[]));
  const users = userIds.length ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } }) : [];
  const userName = new Map(users.map((u) => [u.id, u.name]));

  return (
    <PageStack>
      <PageHeader
        title="คลังหลักฐาน"
        subtitle={`${scopedEvidence.length} ชิ้น${access && !access.isGlobalAdmin ? " · เฉพาะคณะของคุณ" : ""}`}
      />

      {scopedTasks.length ? (
        <EvidenceUploadForm
          tasks={scopedTasks.map((task) => ({
            id: task.id,
            code: task.code,
            title: task.title,
            committeeName: task.committee.name
          }))}
        />
      ) : (
        <Card className="p-4 text-sm text-[#667085]">ไม่มีภารกิจในคณะของคุณสำหรับอัปโหลดหลักฐาน</Card>
      )}

      <MetricGrid columns="four">
        {[
          ["ทั้งหมด", scopedEvidence.length],
          ["อนุมัติแล้ว", scopedEvidence.filter((e) => e.status === "APPROVED").length],
          ["รอตรวจ", scopedEvidence.filter((e) => e.status === "PENDING").length],
          ["ไม่ผ่าน", scopedEvidence.filter((e) => e.status === "REJECTED").length]
        ].map(([label, value]) => (
          <MetricTile key={label} label={label} value={value} />
        ))}
      </MetricGrid>

      <CardGrid cols={4}>
        {scopedEvidence.map((evidence) => (
          <Card className="overflow-hidden" key={evidence.id}>
            <div className="grid aspect-video place-items-center bg-gradient-to-br from-[#123f76] to-[#b68a2e] text-3xl font-black text-white sm:text-5xl">
              {evidence.code}
            </div>
            <div className="p-3 sm:p-4">
              <div className="mb-2 flex flex-wrap justify-between gap-2">
                <Badge tone="blue">{evidence.committee.name}</Badge>
                <Badge tone={evidence.status === "APPROVED" ? "green" : evidence.status === "REJECTED" ? "red" : "gold"}>
                  {thaiStatus(evidence.status)}
                </Badge>
              </div>
              <h2 className="text-sm font-black leading-snug sm:text-base">{evidence.caption}</h2>
              <p className="mt-1 text-xs text-[#667085]">
                {evidence.fileAsset.original_filename} · {evidence.task?.code}
              </p>
              <Link
                href={`/api/files/${evidence.file_asset_id}/download`}
                className={linkButtonClasses("ghost", "mt-3 w-full justify-center sm:w-auto")}
                target="_blank"
                rel="noopener noreferrer"
              >
                เปิดไฟล์
              </Link>
              <div className="mt-3 rounded-md bg-[#fbfaf5] p-2 text-xs text-[#475467] sm:p-3 sm:text-sm">
                <p>
                  <b>อัปโหลด:</b> {evidence.created_by ? (userName.get(evidence.created_by) ?? evidence.created_by) : "—"}
                </p>
                <p>
                  <b>ตรวจ:</b> {evidence.reviewed_by ? (userName.get(evidence.reviewed_by) ?? evidence.reviewed_by) : "ยังไม่ตรวจ"}
                </p>
              </div>
              {user && access && canReviewEvidence(user, evidence, access) ? (
                <EvidenceActions id={evidence.id} status={evidence.status} />
              ) : evidence.status === "PENDING" && user && can(user.roles, permissions.evidenceReview) ? (
                <p className="mt-3 text-xs text-[#667085]">รอผู้ตรวจในคณะ {evidence.committee.name}</p>
              ) : null}
            </div>
          </Card>
        ))}
      </CardGrid>
    </PageStack>
  );
}
