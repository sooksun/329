"use client";

import { ChevronDown, FolderKanban } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type ProjectOption = {
  id: string;
  name: string;
  edition: string;
  organizationName: string;
};

export function ProjectSelector({
  projects,
  activeProjectId,
  variant = "header"
}: {
  projects: ProjectOption[];
  activeProjectId: string;
  /** header = แถบ desktop, drawer = เมนูมือถือเต็มความกว้าง */
  variant?: "header" | "drawer";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const active = projects.find((project) => project.id === activeProjectId) ?? projects[0];

  if (!active || projects.length <= 1) {
    if (variant === "drawer") return null;
    return (
      <div className="hidden min-w-0 text-sm text-[#667085] md:block">
        {active ? (
          <span className="truncate" title={`${active.organizationName} · ${active.name}`}>
            {active.organizationName} › {active.name}
          </span>
        ) : (
          "MIS"
        )}
      </div>
    );
  }

  async function onChange(projectId: string) {
    if (projectId === activeProjectId || loading) return;
    setLoading(true);
    try {
      const response = await fetch("/api/projects/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId })
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "สลับโปรเจกต์ไม่สำเร็จ");
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <label
      className={
        variant === "drawer"
          ? "relative block w-full"
          : "relative hidden min-w-[200px] max-w-xs md:block"
      }
    >
      <span className="sr-only">เลือกโปรเจกต์</span>
      <FolderKanban
        size={16}
        className={`pointer-events-none absolute left-2 top-2.5 ${variant === "drawer" ? "text-blue-200" : "text-[#98a2b3]"}`}
      />
      <select
        className={
          variant === "drawer"
            ? "h-10 w-full appearance-none truncate rounded-md border border-white/20 bg-white/10 pl-8 pr-8 text-sm font-bold text-white disabled:opacity-60"
            : "h-10 w-full appearance-none truncate rounded-md border border-[#e7e2d7] bg-[#fbfaf5] pl-8 pr-8 text-sm font-bold text-[#123f76] disabled:opacity-60"
        }
        value={activeProjectId}
        disabled={loading}
        onChange={(event) => onChange(event.target.value)}
        title="สลับโปรเจกต์ / รอบจัดงาน"
      >
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.organizationName} · {project.name} ({project.edition})
          </option>
        ))}
      </select>
      <ChevronDown
        size={16}
        className={`pointer-events-none absolute right-2 top-2.5 ${variant === "drawer" ? "text-blue-200" : "text-[#98a2b3]"}`}
      />
    </label>
  );
}
