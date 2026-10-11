import JSZip from "jszip";
import pptxgen from "pptxgenjs";
import { describe, expect, it } from "vitest";
import { addExecutiveSlides, EXECUTIVE_SLIDE_COUNT } from "../src/server/reports/pptx-slides";
import { buildRiskMatrix, parseSnapshotData } from "../src/server/reports/snapshot-data";

async function slideXml(data: Parameters<typeof addExecutiveSlides>[1]) {
  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_WIDE";
  addExecutiveSlides(pptx, data, { projectName: "กีฬา 329", snapshotTitle: "Snapshot ทดสอบ" });
  const zip = await JSZip.loadAsync((await pptx.write({ outputType: "nodebuffer" })) as Buffer);
  const names = Object.keys(zip.files).filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name));
  const xml = await Promise.all(names.map((name) => zip.file(name)!.async("string")));
  return { count: names.length, text: xml.join("\n") };
}

describe("executive PowerPoint", () => {
  it("renders real snapshot figures instead of title-only slides", async () => {
    const { count, text } = await slideXml({
      overallProgress: 38,
      metrics: { reported: 45, totalTasks: 36, completedTasks: 5, delayedTasks: 3, criticalRisks: 2, evidencePending: 4, daysRemaining: 170 },
      committeeProgress: [
        { name: "อำนวยการและการเงิน", progress: 40, totalTasks: 9, completedTasks: 1, delayedTasks: 1, budgetPlanned: 540000, budgetUsed: 120000 }
      ],
      budgetSummary: { planned: 3660000, requested: 900000, approved: 800000, committed: 0, actual: 849000 },
      delayedTasks: ["P0-04 จัดทำงบประมาณ"],
      riskMatrix: buildRiskMatrix([{ likelihood: 4, impact: 5 }]),
      criticalRisks: [{ code: "RK-001", title: "ฝนตกหนัก", likelihood: 4, impact: 5, score: 20, level: "Critical" }],
      decisionsNeeded: ["อนุมัติจ้างเหมารถ"],
      timeline: [{ code: "P0-01", title: "เตรียมสนาม", start: "2027-01-01T00:00:00Z", due: "2027-03-20T00:00:00Z", status: "IN_PROGRESS" }]
    });

    expect(count).toBe(EXECUTIVE_SLIDE_COUNT);
    for (const expected of ["38%", "5 / 36", "อำนวยการและการเงิน", "P0-04 จัดทำงบประมาณ", "RK-001", "อนุมัติจ้างเหมารถ", "เตรียมสนาม", "3,660,000"]) {
      expect(text).toContain(expected);
    }
  });

  it("still renders every slide for an old snapshot with missing fields", async () => {
    const { count, text } = await slideXml(parseSnapshotData('{"overallProgress": 12}'));
    expect(count).toBe(EXECUTIVE_SLIDE_COUNT);
    expect(text).toContain("12%");
    expect(text).toContain("Snapshot นี้ไม่มีข้อมูลไทม์ไลน์");
  });

  it("tolerates corrupt snapshot JSON", () => {
    expect(parseSnapshotData("not json")).toEqual({});
  });
});
