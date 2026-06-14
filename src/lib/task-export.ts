export type TaskExportRow = {
  task_code: string;
  committee_name: string;
  task_title: string;
  task_description: string;
  task_success_criteria: string;
  subtask_title: string;
  subtask_description: string;
  subtask_success_criteria: string;
};

export const TASK_EXPORT_HEADERS: Array<{ key: keyof TaskExportRow; label: string }> = [
  { key: "task_code", label: "รหัสภารกิจ" },
  { key: "committee_name", label: "คณะกรรมการ" },
  { key: "task_title", label: "ชื่อภารกิจ" },
  { key: "task_description", label: "รายละเอียดภารกิจ" },
  { key: "task_success_criteria", label: "เกณฑ์ความสำเร็จภารกิจ" },
  { key: "subtask_title", label: "ชื่องานย่อย" },
  { key: "subtask_description", label: "รายละเอียดงานย่อย" },
  { key: "subtask_success_criteria", label: "เกณฑ์ความสำเร็จงานย่อย" }
];

type ExportTaskInput = {
  code: string;
  title: string;
  description: string | null;
  success_criteria: string;
  committee: { name: string };
  subtasks: Array<{
    title: string;
    notes: string | null;
  }>;
};

function emptySubtaskFields(): Pick<TaskExportRow, "subtask_title" | "subtask_description" | "subtask_success_criteria"> {
  return { subtask_title: "", subtask_description: "", subtask_success_criteria: "" };
}

export function buildTaskExportRows(tasks: ExportTaskInput[]): TaskExportRow[] {
  const rows: TaskExportRow[] = [];

  for (const task of tasks) {
    const base = {
      task_code: task.code,
      committee_name: task.committee.name,
      task_title: task.title,
      task_description: task.description ?? "",
      task_success_criteria: task.success_criteria
    };

    if (!task.subtasks.length) {
      rows.push({ ...base, ...emptySubtaskFields() });
      continue;
    }

    for (const subtask of task.subtasks) {
      rows.push({
        ...base,
        subtask_title: subtask.title,
        subtask_description: subtask.notes ?? "",
        subtask_success_criteria: ""
      });
    }
  }

  return rows;
}

function escapeCsvCell(value: string) {
  let normalized = value.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  // กัน CSV/spreadsheet formula injection: เซลล์ที่ขึ้นต้นด้วย = + - @ หรือ tab อาจถูกตีความเป็นสูตร
  if (/^[=+\-@\t]/.test(normalized)) {
    normalized = `'${normalized}`;
  }
  if (/[",\n]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
}

export function taskExportRowsToCsv(rows: TaskExportRow[]) {
  const headerLine = TASK_EXPORT_HEADERS.map((h) => escapeCsvCell(h.label)).join(",");
  const body = rows
    .map((row) => TASK_EXPORT_HEADERS.map((h) => escapeCsvCell(row[h.key] ?? "")).join(","))
    .join("\n");
  return `\uFEFF${headerLine}\n${body}`;
}

export function taskExportFilename(_projectEdition: string, ext: "csv" | "json") {
  const stamp = new Date().toISOString().slice(0, 10);
  return `tasks-export-${stamp}.${ext}`;
}

export function attachmentContentDisposition(filename: string) {
  const ascii = filename.replace(/[^\x20-\x7E]/g, "_") || "tasks-export.csv";
  const encoded = encodeURIComponent(filename);
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}
