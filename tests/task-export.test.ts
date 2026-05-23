import { describe, expect, it } from "vitest";
import { buildTaskExportRows, taskExportRowsToCsv } from "../src/lib/task-export";

describe("task export", () => {
  it("builds one row per subtask with parent task fields", () => {
    const rows = buildTaskExportRows([
      {
        code: "P0-01",
        title: "ภารกิจหลัก",
        description: "รายละเอียดภารกิจ",
        success_criteria: "เกณฑ์ภารกิจ",
        committee: { name: "ฝ่ายกีฬา" },
        subtasks: [
          { title: "งานย่อย 1", notes: "รายละเอียดย่อย 1" },
          { title: "งานย่อย 2", notes: null }
        ]
      }
    ]);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      task_code: "P0-01",
      task_title: "ภารกิจหลัก",
      subtask_title: "งานย่อย 1",
      subtask_description: "รายละเอียดย่อย 1"
    });
  });

  it("includes task-only row when no subtasks", () => {
    const rows = buildTaskExportRows([
      {
        code: "P1-01",
        title: "ภารกิจเดี่ยว",
        description: null,
        success_criteria: "ครบตามแผน",
        committee: { name: "ฝ่ายเอกสาร" },
        subtasks: []
      }
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0].subtask_title).toBe("");
    expect(rows[0].task_success_criteria).toBe("ครบตามแผน");
  });

  it("escapes csv cells with commas and quotes", () => {
    const csv = taskExportRowsToCsv([
      {
        task_code: "X",
        committee_name: "คณะ",
        task_title: 'ชื่อ "พิเศษ", มีคอมม่า',
        task_description: "",
        task_success_criteria: "",
        subtask_title: "",
        subtask_description: "",
        subtask_success_criteria: ""
      }
    ]);
    expect(csv).toContain('"ชื่อ ""พิเศษ"", มีคอมม่า"');
    expect(csv.startsWith("\uFEFF")).toBe(true);
  });
});
