import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import pptxgen from "pptxgenjs";
import { errors } from "@/lib/messages";
import { prisma } from "@/lib/prisma";
import { putObject } from "@/server/storage/object-store";

const SLIDES = [
  { key: "cover", title: "หน้าปก" },
  { key: "overview", title: "ภาพรวมโครงการ" },
  { key: "dashboard", title: "แดชบอร์ดภาพรวม" },
  { key: "committees", title: "ความก้าวหน้าตามคณะ" },
  { key: "delayed", title: "งานล่าช้า" },
  { key: "timeline", title: "ไทม์ไลน์" },
  { key: "budget", title: "สรุปงบประมาณ" },
  { key: "risks", title: "เมทริกซ์ความเสี่ยง" },
  { key: "evidence", title: "แกลเลอรีหลักฐาน" },
  { key: "decisions", title: "ประเด็นที่ต้องตัดสินใจ" },
  { key: "next7", title: "7 วันข้างหน้า" },
  { key: "summary", title: "สรุปท้ายรายงาน" }
] as const;

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

  for (const slideDef of SLIDES) {
    const isCover = slideDef.key === "cover";
    const slide = pptx.addSlide();
    slide.background = { color: isCover ? "123F76" : "FBFAF5" };
    slide.addText(isCover ? snapshot.project.name : slideDef.title, {
      x: 0.6,
      y: 0.5,
      w: 12,
      h: 0.6,
      fontFace: "Sarabun",
      bold: true,
      fontSize: isCover ? 30 : 22,
      color: isCover ? "FFFFFF" : "101827",
      fit: "shrink"
    });
    slide.addText(snapshot.title, {
      x: 0.6,
      y: 1.25,
      w: 11.8,
      h: 0.4,
      fontFace: "Sarabun",
      fontSize: 14,
      color: isCover ? "D8BD75" : "667085",
      fit: "shrink"
    });
    slide.addText("สร้างจากข้อมูล Snapshot แดชบอร์ดที่บันทึกไว้เท่านั้น", {
      x: 0.6,
      y: 6.8,
      w: 11.5,
      h: 0.3,
      fontSize: 10,
      color: isCover ? "FFFFFF" : "667085"
    });
  }

  const filename = `329-report-${snapshot.id}.pptx`;
  const localDir = path.join(process.cwd(), "storage", "reports");
  await mkdir(localDir, { recursive: true });
  const localPath = path.join(localDir, filename);
  await pptx.writeFile({ fileName: localPath });

  const bytes = await readFile(localPath);
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
      user_id: userId,
      action: "Generate PowerPoint",
      entity_type: "PowerPointReport",
      entity_id: report.id,
      new_value: JSON.stringify({ snapshot_id: snapshot.id, file_path: stored.storageKey, provider: stored.storageProvider })
    }
  });

  return { report, stored };
}
