"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { linkButtonClasses } from "@/lib/button-styles";

export function SwitchPrimaryProjectButton({ projectId, label }: { projectId: string; label: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function switchProject() {
    setLoading(true);
    try {
      const response = await fetch("/api/projects/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId })
      });
      if (!response.ok) throw new Error("สลับโปรเจกต์ไม่สำเร็จ");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button type="button" className={linkButtonClasses("gold")} disabled={loading} onClick={switchProject}>
      {loading ? "กำลังสลับ..." : label}
    </button>
  );
}
