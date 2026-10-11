import type pptxgen from "pptxgenjs";
import { formatThaiDateShort } from "@/lib/format-date";
import type { SnapshotData } from "@/server/reports/snapshot-data";

const FONT = "Sarabun";
const NAVY = "123F76";
const RED = "B91528";
const MUTED = "667085";
const INK = "101827";

type Slide = ReturnType<pptxgen["addSlide"]>;
type TableRows = Parameters<Slide["addTable"]>[0];

const baht = (value = 0) => `${Math.round(value).toLocaleString("th-TH")} บาท`;
const statusTh: Record<string, string> = {
  NOT_STARTED: "ยังไม่เริ่ม",
  IN_PROGRESS: "กำลังดำเนินการ",
  SUBMITTED: "ส่งตรวจ",
  REVISION_REQUIRED: "ต้องแก้ไข",
  VERIFIED: "ตรวจแล้ว",
  DONE: "เสร็จสิ้น",
  DELAYED: "ล่าช้า"
};

function header(slide: Slide, title: string, subtitle: string) {
  slide.background = { color: "FBFAF5" };
  slide.addText(title, { x: 0.6, y: 0.35, w: 12, h: 0.6, fontFace: FONT, bold: true, fontSize: 24, color: INK, fit: "shrink" });
  slide.addText(subtitle, { x: 0.6, y: 0.95, w: 12, h: 0.35, fontFace: FONT, fontSize: 12, color: MUTED });
  slide.addText("สร้างจากข้อมูล Snapshot แดชบอร์ดที่บันทึกไว้ · 329 Yunnan Sports MIS", {
    x: 0.6, y: 7.0, w: 12, h: 0.3, fontFace: FONT, fontSize: 9, color: MUTED
  });
}

function bulletList(slide: Slide, items: string[] | undefined, empty: string, max = 14) {
  const list = items ?? [];
  if (list.length === 0) {
    slide.addText(empty, { x: 0.6, y: 1.6, w: 12, h: 0.5, fontFace: FONT, fontSize: 16, color: MUTED });
    return;
  }
  const shown = list.slice(0, max);
  const more = list.length > max ? [`… และอีก ${list.length - max} รายการ`] : [];
  slide.addText(
    [...shown, ...more].map((text) => ({ text, options: { bullet: true, breakLine: true } })),
    { x: 0.6, y: 1.5, w: 12, h: 5.3, fontFace: FONT, fontSize: 15, color: INK, valign: "top", fit: "shrink" }
  );
}

function table(slide: Slide, head: string[], rows: string[][], colW: number[]) {
  const headRow = head.map((text) => ({ text, options: { bold: true, color: "FFFFFF", fill: { color: NAVY } } }));
  const body = rows.map((row) => row.map((text) => ({ text })));
  slide.addTable([headRow, ...body] as TableRows, {
    x: 0.6, y: 1.5, w: 12.1, colW, fontFace: FONT, fontSize: 12, color: INK,
    border: { type: "solid", pt: 0.5, color: "D9D4C7" }, autoPage: false
  });
}

/** เพิ่มสไลด์ทั้งหมดของรายงานผู้บริหารลงใน pptx — snapshot รุ่นเก่าที่ข้อมูลไม่ครบจะแสดงข้อความแทน */
export function addExecutiveSlides(pptx: pptxgen, data: SnapshotData, meta: { projectName: string; snapshotTitle: string }) {
  const sub = meta.snapshotTitle;
  const p = data.projectSummary;
  const period = p?.event_date ? `${formatThaiDateShort(p.event_date)} – ${formatThaiDateShort(p.event_end_date ?? p.event_date)}` : "";

  // 1) หน้าปก
  const cover = pptx.addSlide();
  cover.background = { color: NAVY };
  cover.addText(meta.projectName, { x: 0.6, y: 2.2, w: 12, h: 1, fontFace: FONT, bold: true, fontSize: 34, color: "FFFFFF", fit: "shrink" });
  cover.addText([p?.edition, period].filter(Boolean).join(" · ") || "รายงานผู้บริหาร", {
    x: 0.6, y: 3.3, w: 12, h: 0.5, fontFace: FONT, fontSize: 18, color: "D8BD75"
  });
  cover.addText(`รายงานสรุปผู้บริหาร · ${sub}`, { x: 0.6, y: 6.6, w: 12, h: 0.4, fontFace: FONT, fontSize: 12, color: "FFFFFF" });

  // 2) ภาพรวม KPI
  const overview = pptx.addSlide();
  header(overview, "ภาพรวมโครงการ", sub);
  const m = data.metrics;
  const tiles: [string, string][] = [
    ["ความคืบหน้า (ตรวจแล้ว)", `${data.overallProgress ?? 0}%`],
    ["ความคืบหน้า (รายงาน)", m ? `${m.reported}%` : "—"],
    ["ภารกิจเสร็จ / ทั้งหมด", m ? `${m.completedTasks} / ${m.totalTasks}` : "—"],
    ["งานล่าช้า", m ? String(m.delayedTasks) : String(data.delayedTasks?.length ?? 0)],
    ["ความเสี่ยงวิกฤต/สูง", m ? String(m.criticalRisks) : String(data.criticalRisks?.length ?? 0)],
    ["ภารกิจมีหลักฐานอนุมัติ", `${data.evidenceSummary ?? 0}%`],
    ["หลักฐานรอตรวจ", m ? String(m.evidencePending) : "—"],
    ["นับถอยหลังถึงวันงาน", m ? `${m.daysRemaining} วัน` : "—"]
  ];
  tiles.forEach(([label, value], index) => {
    const x = 0.6 + (index % 4) * 3.05;
    const y = 1.6 + Math.floor(index / 4) * 2.5;
    overview.addShape("rect", { x, y, w: 2.85, h: 2.2, fill: { color: "FFFFFF" }, line: { color: "E7E2D7" } });
    overview.addText(value, { x, y: y + 0.35, w: 2.85, h: 0.9, fontFace: FONT, bold: true, fontSize: 28, color: NAVY, align: "center", fit: "shrink" });
    overview.addText(label, { x: x + 0.1, y: y + 1.3, w: 2.65, h: 0.6, fontFace: FONT, fontSize: 12, color: MUTED, align: "center", fit: "shrink" });
  });

  // 3) ความก้าวหน้าตามคณะ
  const committees = pptx.addSlide();
  header(committees, "ความก้าวหน้าตามคณะ", sub);
  if (data.committeeProgress?.length) {
    table(
      committees,
      ["คณะ", "ความคืบหน้า", "เสร็จ/ทั้งหมด", "ล่าช้า", "งบตามแผน", "ใช้จริง"],
      data.committeeProgress.map((c) => [c.name, `${c.progress}%`, `${c.completedTasks}/${c.totalTasks}`, String(c.delayedTasks), baht(c.budgetPlanned), baht(c.budgetUsed)]),
      [4.1, 1.5, 1.6, 1.0, 1.95, 1.95]
    );
  } else bulletList(committees, [], "ไม่มีข้อมูลคณะใน Snapshot นี้");

  // 4) งานล่าช้า
  const delayed = pptx.addSlide();
  header(delayed, `งานล่าช้า (${data.delayedTasks?.length ?? 0})`, sub);
  bulletList(delayed, data.delayedTasks, "ไม่มีงานล่าช้า ✓");

  // 5) ไทม์ไลน์ (งานที่ยังไม่ปิด เรียงตามกำหนดส่ง)
  const timeline = pptx.addSlide();
  header(timeline, "ไทม์ไลน์งานที่ยังไม่ปิด", sub);
  if (data.timeline?.length) {
    table(
      timeline,
      ["รหัส", "ภารกิจ", "เริ่ม", "กำหนดส่ง", "สถานะ"],
      data.timeline.slice(0, 14).map((t) => [t.code, t.title, formatThaiDateShort(t.start), formatThaiDateShort(t.due), statusTh[t.status] ?? t.status]),
      [1.2, 5.6, 1.6, 1.6, 2.1]
    );
  } else bulletList(timeline, [], "Snapshot นี้ไม่มีข้อมูลไทม์ไลน์ (สร้าง Snapshot ใหม่เพื่อดูข้อมูล)");

  // 6) งบประมาณ
  const budget = pptx.addSlide();
  header(budget, "สรุปงบประมาณ", sub);
  const b = data.budgetSummary;
  if (b) {
    table(
      budget,
      ["รายการ", "จำนวนเงิน"],
      [
        ["งบตามแผน", baht(b.planned)],
        ["ขอเบิก", baht(b.requested)],
        ["อนุมัติ", baht(b.approved)],
        ["ผูกพัน", baht(b.committed)],
        ["ใช้จริง", baht(b.actual)],
        ["คงเหลือตามแผน (แผน − ใช้จริง)", baht(b.planned - b.actual)]
      ],
      [7, 5.1]
    );
  } else bulletList(budget, [], "ไม่มีข้อมูลงบประมาณใน Snapshot นี้");

  // 7) เมทริกซ์ความเสี่ยง
  const risks = pptx.addSlide();
  header(risks, "เมทริกซ์ความเสี่ยง", sub);
  if (data.riskMatrix) {
    risks.addText("โอกาสเกิด ↑ · ผลกระทบ →", { x: 0.6, y: 1.4, w: 5, h: 0.3, fontFace: FONT, fontSize: 11, color: MUTED });
    for (let row = 0; row < 5; row += 1) {
      const likelihood = 5 - row;
      for (let col = 0; col < 5; col += 1) {
        const impact = col + 1;
        const score = likelihood * impact;
        const count = data.riskMatrix[likelihood - 1]?.[impact - 1] ?? 0;
        risks.addText(count ? String(count) : "", {
          x: 0.9 + col * 0.95, y: 1.8 + row * 0.95, w: 0.9, h: 0.9, align: "center", valign: "middle",
          fontFace: FONT, bold: true, fontSize: 16, color: score >= 16 ? RED : NAVY,
          fill: { color: score >= 16 ? "FFE3E7" : score >= 11 ? "FFF0D0" : score >= 6 ? "EDF6FF" : "ECF9EF" }
        });
      }
    }
  }
  bulletListAt(risks, (data.criticalRisks ?? []).map((r) => `${r.code} ${r.title} — โอกาส ${r.likelihood}×ผลกระทบ ${r.impact}${r.committee?.name ? ` · ${r.committee.name}` : ""}`), data.riskMatrix ? 6.0 : 0.6, data.riskMatrix ? 6.7 : 12, "ไม่มีความเสี่ยงระดับวิกฤต/สูง ✓");

  // 8) หลักฐาน
  const evidence = pptx.addSlide();
  header(evidence, "สรุปหลักฐาน", sub);
  bulletList(
    evidence,
    [
      `ภารกิจที่มีหลักฐานอนุมัติแล้ว ${data.evidenceSummary ?? 0}%`,
      ...(m ? [`หลักฐานรอตรวจ ${m.evidencePending} รายการ`] : [])
    ],
    "ไม่มีข้อมูลหลักฐาน"
  );

  // 9) ประเด็นที่ต้องตัดสินใจ
  const decisions = pptx.addSlide();
  header(decisions, "ประเด็นที่ต้องตัดสินใจ", sub);
  bulletList(decisions, data.decisionsNeeded, "ไม่มีประเด็นค้างจากการประชุม ✓");

  // 10) 7 วันข้างหน้า
  const next7 = pptx.addSlide();
  header(next7, "งานที่ครบกำหนดใน 7 วันข้างหน้า", sub);
  bulletList(next7, data.next7DaysTasks, "ไม่มีงานครบกำหนดใน 7 วันข้างหน้า");

  // 11) สรุปท้ายรายงาน
  const summary = pptx.addSlide();
  header(summary, "สรุปท้ายรายงาน", sub);
  bulletList(
    summary,
    [
      `ความคืบหน้าที่ตรวจแล้ว ${data.overallProgress ?? 0}%`,
      `งานล่าช้า ${m?.delayedTasks ?? data.delayedTasks?.length ?? 0} งาน · ความเสี่ยงวิกฤต/สูง ${m?.criticalRisks ?? data.criticalRisks?.length ?? 0} รายการ`,
      ...(b ? [`ใช้งบไปแล้ว ${baht(b.actual)} จากแผน ${baht(b.planned)}`] : []),
      `ประเด็นรอตัดสินใจ ${data.decisionsNeeded?.length ?? 0} เรื่อง`
    ],
    ""
  );
}

function bulletListAt(slide: Slide, items: string[], x: number, w: number, empty: string) {
  if (items.length === 0) {
    slide.addText(empty, { x, y: 1.8, w, h: 0.5, fontFace: FONT, fontSize: 14, color: MUTED });
    return;
  }
  slide.addText(
    items.slice(0, 10).map((text) => ({ text, options: { bullet: true, breakLine: true } })),
    { x, y: 1.8, w, h: 4.9, fontFace: FONT, fontSize: 12, color: INK, valign: "top", fit: "shrink" }
  );
}

export const EXECUTIVE_SLIDE_COUNT = 11;
