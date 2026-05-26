import type { Metadata } from "next";
import Link from "next/link";
import { VillageMap } from "@/components/teams/village-map";
import { linkButtonClasses } from "@/lib/button-styles";
import { PROVINCES, VILLAGES } from "@/lib/villages";
import { VILLAGE_COORDS } from "@/lib/village-coords";

export const metadata: Metadata = {
  title: "แผนที่หมู่บ้าน — กีฬา 329 ชาวจีนยูนนาน",
  description:
    "แผนที่ที่ตั้งหมู่บ้านชาวจีนยูนนานภาคเหนือที่เข้าร่วมกีฬา 329 — โฟกัสเริ่มต้นที่จังหวัดเชียงราย"
};

const outlineLight =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[#f1ece1]/40 bg-white/5 px-4 text-sm font-bold text-[#f1ece1] backdrop-blur-sm transition hover:bg-white/15";

const locatedCount = VILLAGES.filter((v) => VILLAGE_COORDS[v.no]).length;

export default function VillageMapPage() {
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
            <Link href="/teams" className="hidden rounded-md px-3 py-2 text-sm font-bold text-[#f1ece1]/80 transition hover:text-[#f3c969] sm:inline-block">
              รายชื่อหมู่บ้าน
            </Link>
            <Link href="/" className="hidden rounded-md px-3 py-2 text-sm font-bold text-[#f1ece1]/80 transition hover:text-[#f3c969] sm:inline-block">
              หน้าหลัก
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
            className="lp-aurora pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#c08a3e] blur-3xl"
            style={{ opacity: 0.28 }}
          />
          <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-14">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#f3c969]">แผนที่ที่ตั้ง · 村莊地圖</p>
            <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
              พิกัดหมู่บ้าน<span className="lp-gold-text">ยูนนาน</span>ภาคเหนือ
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#f1ece1]/75">
              ที่ตั้งของหมู่บ้านที่เข้าร่วมกีฬา 329 กระจายตามแนวดอยชายแดน — โฟกัสเริ่มต้น
              ที่จังหวัดเชียงราย ใจกลางของชุมชนยูนนานภาคเหนือ
            </p>

            {/* legend */}
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-bold text-[#f1ece1]/80">
              <span className="inline-flex items-center gap-2">
                <span className="inline-block h-4 w-4 rounded-full border-2 border-[#f3c969] bg-[#b91528] text-center text-[9px] leading-3 text-white">★</span>
                เจ้าภาพ (บ้านพญาไพร)
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full border-2 border-[#f1ece1] bg-[#08254c]" />
                หมู่บ้านอื่น
              </span>
              <Link href="/teams" className={outlineLight}>
                ดูรายชื่อแบบเต็ม →
              </Link>
            </div>
          </div>
        </section>

        {/* ===== Map ===== */}
        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
          <VillageMap />

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {PROVINCES.slice(0, 3).map((p) => (
              <div key={p.th} className="rounded-xl border border-[#e7e2d7] bg-white p-4">
                <div className="text-sm font-black text-[#142844]">
                  {p.th} <span className="font-serif text-[#c08a3e]">{p.zh}</span>
                </div>
                <div className="mt-1 text-xs text-[#667085]">{p.count} หมู่บ้าน/ทีม</div>
              </div>
            ))}
          </div>

          <p className="mt-6 rounded-xl border border-[#e7e2d7] bg-[#fbfaf5] p-4 text-xs leading-relaxed text-[#667085]">
            <b className="text-[#142844]">หมายเหตุ:</b> แสดงพิกัด {locatedCount} จาก {VILLAGES.length} รายการ
            พิกัดรวบรวมจากแหล่งข้อมูลสาธารณะ (แผนที่/วิกิพีเดีย) เป็นค่าโดยประมาณเพื่อการประชาสัมพันธ์
            อาจคลาดเคลื่อนจากตำแหน่งจริง — แก้ไขเพิ่มเติมได้ที่ <code>src/lib/village-coords.ts</code> ·
            แผนที่โดย OpenStreetMap
          </p>
        </section>
      </main>

      {/* ===== Footer ===== */}
      <footer className="bg-[#06203f] px-4 py-8 text-[#f1ece1] sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[#f1ece1]/60">กีฬา 329 ชาวจีนยูนนาน · ครั้งที่ 31 พญาไพรเกมส์ 2570</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-bold">
            <Link href="/teams" className="text-[#f1ece1]/70 hover:text-[#f3c969]">รายชื่อหมู่บ้าน</Link>
            <Link href="/" className="text-[#f1ece1]/70 hover:text-[#f3c969]">หน้าหลัก</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
