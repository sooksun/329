import type { Metadata } from "next";
import Link from "next/link";
import { TeamsExplorer } from "@/components/teams/teams-explorer";
import { linkButtonClasses } from "@/lib/button-styles";
import { cn } from "@/lib/utils";
import {
  ASSOCIATION_COUNT,
  HOST_VILLAGE,
  PROVINCE_COUNT,
  PROVINCES,
  VILLAGE_COUNT,
  VILLAGES
} from "@/lib/villages";

export const metadata: Metadata = {
  title: "หมู่บ้าน / ทีม — กีฬา 329 ชาวจีนยูนนาน",
  description:
    "รวมรายชื่อหมู่บ้านและทีมที่เข้าร่วมการแข่งขันกีฬา 329 ชาวจีนยูนนานภาคเหนือ — ค้นหาตามจังหวัด พร้อมชื่อไทย-จีนและข้อมูลติดต่อ"
};

const outlineLight =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[#f1ece1]/40 bg-white/5 px-4 text-sm font-bold text-[#f1ece1] backdrop-blur-sm transition hover:bg-white/15";

const STATS = [
  { value: VILLAGES.length, label: "หมู่บ้าน / ทีม" },
  { value: VILLAGE_COUNT, label: "หมู่บ้าน" },
  { value: ASSOCIATION_COUNT, label: "สมาคม" },
  { value: PROVINCE_COUNT, label: "จังหวัด" }
];

export default function TeamsPage() {
  return (
    <div className="min-h-screen bg-[#f1ece1] text-[#142844]">
      {/* ===== Header ===== */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#08254c]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-3 text-[#f1ece1]">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#c08a3e] text-sm font-black text-[#f3c969]">
              31
            </span>
            <div className="leading-tight">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#c08a3e]">Thai · Yunnan Games</p>
              <p className="text-sm font-black">กีฬา 329 ชาวจีนยูนนาน</p>
            </div>
          </Link>
          <nav className="flex flex-wrap items-center gap-1 sm:gap-2">
            <Link href="/" className="hidden rounded-md px-3 py-2 text-sm font-bold text-[#f1ece1]/80 transition hover:text-[#f3c969] sm:inline-block">
              หน้าหลัก
            </Link>
            <Link href="/login" className={outlineLight}>
              เข้าสู่ระบบ
            </Link>
            <Link href="/register" className={linkButtonClasses("gold", "text-sm")}>
              ลงทะเบียน
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* ===== Hero ===== */}
        <section className="relative overflow-hidden bg-[#08254c] text-[#f1ece1]">
          <div
            aria-hidden
            className="lp-aurora pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-[#c08a3e] blur-3xl"
            style={{ opacity: 0.3 }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.05]"
            style={{ backgroundImage: "radial-gradient(#f3c969 1px, transparent 1px)", backgroundSize: "26px 26px" }}
          />
          <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#f3c969]">หมู่บ้าน / ทีม · 各村名單</p>
            <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">
              ครอบครัวยูนนาน<span className="lp-gold-text">ทั่วไทย</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#f1ece1]/75 sm:text-lg">
              กีฬา 329 รวมพลังหมู่บ้านและสมาคมชาวไทยเชื้อสายจีนยูนนาน — ชุมชนที่ตั้งรกราก
              ตามดอยและหุบเขาภาคเหนือมากว่าครึ่งศตวรรษ สืบสานภาษา อาหาร และวัฒนธรรมยูนนาน
              แต่ละหมู่บ้านส่งทีมนักกีฬาเข้าร่วมชิงถ้วยพระราชทานเป็นประจำทุกปี
            </p>

            <dl className="mt-9 grid max-w-2xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/5 sm:grid-cols-4">
              {STATS.map((s) => (
                <div key={s.label} className="bg-[#08254c]/40 px-4 py-5 text-center">
                  <dt className="font-serif text-3xl font-black text-[#f3c969]">{s.value}</dt>
                  <dd className="mt-1 text-xs font-bold text-[#f1ece1]/70">{s.label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ===== Host highlight ===== */}
        {HOST_VILLAGE ? (
          <section className="border-b border-[#142844]/10 bg-gradient-to-r from-[#fbfaf5] to-[#f1ece1]">
            <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex items-center gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-[#c08a3e] bg-white font-serif text-xl font-black text-[#142844]">
                  31
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#b91528]">★ เจ้าภาพครั้งที่ 31</p>
                  <p className="text-xl font-black text-[#142844]">
                    {HOST_VILLAGE.th} <span className="font-serif text-[#c08a3e]">{HOST_VILLAGE.zh}</span>
                  </p>
                  <p className="text-sm text-[#667085]">
                    พญาไพรเกมส์ 2570 · {HOST_VILLAGE.provinceTh}
                  </p>
                </div>
              </div>
              <Link href="/register" className={linkButtonClasses("gold", "min-h-11 px-6")}>
                ลงทะเบียนทีมเข้าร่วม
              </Link>
            </div>
          </section>
        ) : null}

        {/* ===== Explorer ===== */}
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black sm:text-3xl">ค้นหาหมู่บ้าน / ทีม</h2>
              <p className="mt-2 text-sm text-[#667085]">
                เลือกกรองตามจังหวัด หรือพิมพ์ชื่อหมู่บ้าน (ไทย/จีน) เพื่อค้นหา · เรียงตามบัญชีรายชื่อทางการ
              </p>
            </div>
            <Link href="/teams/map" className={linkButtonClasses("default", "min-h-10 border-[#08254c] px-4")}>
              🗺 ดูบนแผนที่
            </Link>
          </div>
          <TeamsExplorer />
        </section>

        {/* ===== Province summary ===== */}
        <section className="border-t border-[#142844]/10 bg-[#fbfaf5] py-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-xl font-black">กระจายตัวตามจังหวัด</h2>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {PROVINCES.map((p) => (
                <div key={p.th} className="rounded-xl border border-[#e7e2d7] bg-white p-4 text-center">
                  <div className="font-serif text-2xl font-black text-[#08254c]">{p.count}</div>
                  <div className="mt-1 text-sm font-bold text-[#142844]">{p.th}</div>
                  <div className="text-xs text-[#c08a3e]">{p.zh}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* ===== Footer ===== */}
      <footer className="bg-[#06203f] px-4 py-10 text-[#f1ece1] sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-md text-sm leading-relaxed text-[#f1ece1]/60">
            รายชื่อหมู่บ้าน/ทีม รวบรวมจากบัญชีทางการของคณะกรรมการกีฬา 329 — อาจมีการปรับปรุง
            ในแต่ละครั้งของการแข่งขัน
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-bold">
            <Link href="/" className={cn("text-[#f1ece1]/70 hover:text-[#f3c969]")}>
              หน้าหลัก
            </Link>
            <Link href="/register" className="text-[#f1ece1]/70 hover:text-[#f3c969]">
              ลงทะเบียน
            </Link>
            <Link href="/login" className="text-[#f1ece1]/70 hover:text-[#f3c969]">
              เข้าสู่ระบบ MIS
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
