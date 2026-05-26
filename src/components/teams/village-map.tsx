"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";
import { VILLAGES, type Village } from "@/lib/villages";
import { CHIANG_RAI_CENTER, CHIANG_RAI_ZOOM, NORTH_BOUNDS, VILLAGE_COORDS } from "@/lib/village-coords";
import { cn } from "@/lib/utils";

type Located = Village & { lat: number; lng: number; confidence: string };

const PROVINCE_FOCUS: { th: string; center: [number, number]; zoom: number }[] = [
  { th: "เชียงราย", center: CHIANG_RAI_CENTER, zoom: CHIANG_RAI_ZOOM },
  { th: "เชียงใหม่", center: [19.7, 98.95], zoom: 9 },
  { th: "แม่ฮ่องสอน", center: [19.35, 98.1], zoom: 9 },
  { th: "ตาก", center: [16.35, 98.85], zoom: 10 }
];

export function VillageMap() {
  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Record<number, Marker>>({});
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState<number | null>(null);

  const located = useMemo<Located[]>(
    () =>
      VILLAGES.filter((v) => VILLAGE_COORDS[v.no]).map((v) => ({
        ...v,
        ...VILLAGE_COORDS[v.no]!
      })),
    []
  );
  const missing = VILLAGES.length - located.length;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !mapEl.current || mapRef.current) return;

      const map = L.map(mapEl.current, {
        center: CHIANG_RAI_CENTER,
        zoom: CHIANG_RAI_ZOOM,
        scrollWheelZoom: false,
        attributionControl: true
      });
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      located.forEach((v) => {
        const dot = L.divIcon({
          className: "",
          html: `<span class="lp-pin ${v.host ? "lp-pin-host" : ""}">${v.host ? "★" : ""}</span>`,
          iconSize: v.host ? [26, 26] : [16, 16],
          iconAnchor: v.host ? [13, 13] : [8, 8]
        });
        const m = L.marker([v.lat, v.lng], { icon: dot, title: v.th, zIndexOffset: v.host ? 1000 : 0 })
          .addTo(map)
          .bindPopup(
            `<div style="min-width:160px">
              <strong style="font-size:14px;color:#142844">${v.th}</strong>
              <div style="color:#c08a3e;font-weight:700">${v.zh}${v.provinceZh ? " · " + v.provinceZh : ""}</div>
              <div style="color:#667085;font-size:12px;margin-top:2px">${v.provinceTh}${v.host ? " · ★ เจ้าภาพครั้งที่ 31" : ""}</div>
              ${v.phones.length ? `<div style="font-size:12px;margin-top:4px">☎ ${v.phones.join(", ")}</div>` : ""}
            </div>`
          );
        m.on("click", () => setActive(v.no));
        markersRef.current[v.no] = m;
      });

      setReady(true);
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current = {};
    };
  }, [located]);

  function focus(center: [number, number], zoom: number) {
    mapRef.current?.flyTo(center, zoom, { duration: 0.6 });
  }

  function fitAll() {
    mapRef.current?.flyToBounds(NORTH_BOUNDS, { duration: 0.6 });
  }

  function goTo(v: Located) {
    setActive(v.no);
    mapRef.current?.flyTo([v.lat, v.lng], 12, { duration: 0.6 });
    markersRef.current[v.no]?.openPopup();
  }

  return (
    <div>
      {/* controls */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold text-[#667085]">โฟกัส:</span>
        {PROVINCE_FOCUS.map((p) => (
          <button
            key={p.th}
            type="button"
            onClick={() => focus(p.center, p.zoom)}
            className="rounded-full border border-[#e7e2d7] bg-white px-3.5 py-1.5 text-sm font-bold text-[#142844] transition hover:border-[#c08a3e] hover:text-[#c08a3e]"
          >
            {p.th}
          </button>
        ))}
        <button
          type="button"
          onClick={fitAll}
          className="rounded-full border border-[#08254c] bg-[#08254c] px-3.5 py-1.5 text-sm font-bold text-[#f1ece1] transition hover:bg-[#0b2e5c]"
        >
          ดูทั้งหมด
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        {/* map */}
        <div className="relative overflow-hidden rounded-2xl border border-[#e7e2d7] shadow-sm">
          <div ref={mapEl} className="h-[460px] w-full bg-[#dfe7ef] sm:h-[560px]" />
          {!ready && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#dfe7ef] text-sm font-bold text-[#667085]">
              กำลังโหลดแผนที่…
            </div>
          )}
        </div>

        {/* side list */}
        <aside className="rounded-2xl border border-[#e7e2d7] bg-white p-4">
          <p className="text-sm font-black text-[#142844]">
            หมู่บ้านบนแผนที่ <span className="text-[#c08a3e]">{located.length}</span>
            <span className="text-xs font-normal text-[#9aa1ad]"> / {VILLAGES.length}</span>
          </p>
          <p className="mt-1 text-xs text-[#9aa1ad]">คลิกเพื่อซูมไปยังหมู่บ้าน</p>
          <ul className="mt-3 max-h-[420px] space-y-1 overflow-y-auto pr-1 sm:max-h-[500px]">
            {located.map((v) => (
              <li key={v.no}>
                <button
                  type="button"
                  onClick={() => goTo(v)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition",
                    active === v.no ? "bg-[#08254c] text-[#f1ece1]" : "hover:bg-[#f7f4ed]"
                  )}
                >
                  <span
                    className={cn(
                      "h-2.5 w-2.5 shrink-0 rounded-full",
                      v.host ? "bg-[#b91528]" : active === v.no ? "bg-[#f3c969]" : "bg-[#08254c]"
                    )}
                  />
                  <span className="flex-1 truncate font-bold">{v.th}</span>
                  <span className={cn("text-xs", active === v.no ? "text-[#f3c969]" : "text-[#9aa1ad]")}>
                    {v.provinceTh}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {missing > 0 && (
            <p className="mt-3 border-t border-[#eee] pt-3 text-xs text-[#9aa1ad]">
              อีก {missing} รายการยังไม่มีพิกัด (สมาคม/หมู่บ้านที่ยังหาตำแหน่งไม่ได้)
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
