"use client";

import { useMemo, useState } from "react";
import { PROVINCES, VILLAGES, type Village } from "@/lib/villages";
import { cn } from "@/lib/utils";

function VillageCard({ v }: { v: Village }) {
  const isAssoc = v.type === "association";
  return (
    <article
      className={cn(
        "group relative flex flex-col rounded-2xl border bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg",
        v.host ? "border-[#c08a3e] ring-2 ring-[#c08a3e]/30" : "border-[#e7e2d7] hover:border-[#c08a3e]/50"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black",
            v.host ? "bg-[#c08a3e] text-[#08254c]" : "bg-[#08254c] text-[#f3c969]"
          )}
        >
          {v.no}
        </span>
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          {v.host && (
            <span className="rounded-full bg-[#b91528] px-2.5 py-0.5 text-[10px] font-black text-white">
              ★ เจ้าภาพ ครั้งที่ 31
            </span>
          )}
          {isAssoc && (
            <span className="rounded-full border border-[#08254c]/20 bg-[#eef3f9] px-2.5 py-0.5 text-[10px] font-bold text-[#123f76]">
              สมาคม
            </span>
          )}
          <span className="rounded-full border border-[#e7e2d7] bg-[#fbfaf5] px-2.5 py-0.5 text-[10px] font-bold text-[#667085]">
            {v.provinceTh}
          </span>
        </div>
      </div>

      <h3 className="mt-3 text-lg font-black leading-tight text-[#142844]">{v.th}</h3>
      <p className="mt-0.5 font-serif text-sm font-bold text-[#c08a3e]">
        {v.zh}
        {v.provinceZh ? <span className="text-[#667085]"> · {v.provinceZh}</span> : null}
      </p>

      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-4 text-xs">
        {v.phones.length > 0 ? (
          v.phones.map((p) => (
            <a
              key={p}
              href={`tel:${p.replace(/[^0-9]/g, "")}`}
              className="inline-flex items-center gap-1 font-bold text-[#123f76] hover:text-[#c08a3e]"
            >
              <span aria-hidden>☎</span> {p}
            </a>
          ))
        ) : (
          <span className="text-[#9aa1ad]">— ไม่มีเบอร์ติดต่อในระบบ —</span>
        )}
      </div>

      {v.parade ? (
        <span className="absolute bottom-3 right-4 text-[10px] font-bold text-[#9aa1ad]">
          ลำดับพาเหรด #{v.parade}
        </span>
      ) : null}
    </article>
  );
}

export function TeamsExplorer() {
  const [query, setQuery] = useState("");
  const [province, setProvince] = useState<string>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return VILLAGES.filter((v) => {
      if (province !== "all" && v.provinceTh !== province) return false;
      if (!q) return true;
      return (
        v.th.toLowerCase().includes(q) ||
        v.zh.toLowerCase().includes(q) ||
        v.provinceTh.toLowerCase().includes(q) ||
        v.provinceZh.toLowerCase().includes(q)
      );
    }).sort((a, b) => Number(b.host) - Number(a.host) || a.no - b.no);
  }, [query, province]);

  const chips = [{ th: "ทั้งหมด", key: "all", count: VILLAGES.length }].concat(
    PROVINCES.map((p) => ({ th: p.th, key: p.th, count: p.count }))
  );

  return (
    <div>
      {/* controls */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {chips.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setProvince(c.key)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-bold transition",
                province === c.key
                  ? "border-[#08254c] bg-[#08254c] text-[#f1ece1]"
                  : "border-[#e7e2d7] bg-white text-[#142844] hover:border-[#c08a3e]"
              )}
            >
              {c.th}
              <span className={cn("ml-1.5 text-xs", province === c.key ? "text-[#f3c969]" : "text-[#9aa1ad]")}>
                {c.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-72">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9aa1ad]" aria-hidden>
            ⌕
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาหมู่บ้าน / 村名 / จังหวัด"
            className="w-full rounded-full border border-[#d8d1c1] bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-[#08254c]"
          />
        </div>
      </div>

      <p className="mt-5 text-sm font-bold text-[#667085]">
        พบ <span className="text-[#142844]">{filtered.length}</span> รายการ
      </p>

      {filtered.length > 0 ? (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((v) => (
            <VillageCard key={v.no} v={v} />
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-2xl border border-dashed border-[#d8d1c1] bg-white/60 py-16 text-center text-[#667085]">
          ไม่พบหมู่บ้าน/ทีมที่ตรงกับการค้นหา
        </div>
      )}
    </div>
  );
}
