import { NextResponse } from "next/server";
import { errors } from "@/lib/messages";
import { attachmentContentDisposition, taskExportFilename, taskExportRowsToCsv } from "@/lib/task-export";
import { requireApiSession } from "@/server/auth/session";
import { getTaskExportPageData } from "@/server/project/loaders/task-export";

export async function GET(request: Request) {
  const auth = await requireApiSession();
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const format = url.searchParams.get("format") === "json" ? "json" : "csv";
  const committeeId = url.searchParams.get("committee_id")?.trim() || undefined;

  const data = await getTaskExportPageData(committeeId);
  if (!data) {
    return NextResponse.json({ error: errors.noActiveProject }, { status: 404 });
  }

  const filename = taskExportFilename(data.project.edition, format);

  if (format === "json") {
    return NextResponse.json(
      {
        exported_at: new Date().toISOString(),
        project: data.project,
        summary: data.summary,
        rows: data.rows
      },
      {
        headers: {
          "Content-Disposition": attachmentContentDisposition(filename)
        }
      }
    );
  }

  const csv = taskExportRowsToCsv(data.rows);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": attachmentContentDisposition(filename)
    }
  });
}
