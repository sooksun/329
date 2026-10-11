import pptxgen from "pptxgenjs";
import { errors } from "@/lib/messages";
import { prisma } from "@/lib/prisma";
import { addExecutiveSlides } from "@/server/reports/pptx-slides";
import { parseSnapshotData } from "@/server/reports/snapshot-data";
import { putObject } from "@/server/storage/object-store";

export async function generatePptxForSnapshot(snapshotId: string, userId: string) {
  const snapshot = await prisma.dashboardSnapshot.findUnique({
    where: { id: snapshotId },
    include: { project: true }
  });
  if (!snapshot) throw new Error(errors.snapshotNotFound);

  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "329 Yunnan Sports MIS";
  pptx.subject = "รายงานจาก Snapshot แดชบอร์ด";
  pptx.theme = { headFontFace: "Sarabun", bodyFontFace: "Sarabun" };

  // เนื้อหาจริงจากข้อมูลที่ freeze ไว้ใน snapshot (เดิมทุกสไลด์มีแค่หัวข้อ)
  addExecutiveSlides(pptx, parseSnapshotData(snapshot.data), {
    projectName: snapshot.project.name,
    snapshotTitle: snapshot.title
  });

  // เขียนลง object store ที่เดียว (เดิมเขียน storage/reports ก่อนแล้วอ่านกลับมาอัปโหลดซ้ำ)
  const filename = `329-report-${snapshot.id}.pptx`;
  const bytes = (await pptx.write({ outputType: "nodebuffer" })) as Buffer;
  const stored = await putObject({
    projectId: snapshot.project_id,
    kind: "report",
    filename,
    bytes,
    mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  });

  const report = await prisma.powerPointReport.create({
    data: {
      project_id: snapshot.project_id,
      snapshot_id: snapshot.id,
      type: "EXECUTIVE_SUMMARY",
      title: `รายงาน ${snapshot.title}`,
      file_path: stored.storageKey,
      generated_by: userId
    }
  });

  await prisma.auditLog.create({
    data: {
      project_id: snapshot.project_id,
      user_id: userId,
      action: "Generate PowerPoint",
      entity_type: "PowerPointReport",
      entity_id: report.id,
      new_value: JSON.stringify({ snapshot_id: snapshot.id, file_path: stored.storageKey, provider: stored.storageProvider })
    }
  });

  return { report, stored };
}
