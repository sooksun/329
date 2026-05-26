import Link from "next/link";
import { Countdown } from "@/components/landing/countdown";
import { linkButtonClasses } from "@/lib/button-styles";
import { formatThaiEventPeriod } from "@/lib/event-calendar";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "#about", label: "เกี่ยวกับงาน" },
  { href: "#sports", label: "ชนิดกีฬา" },
  { href: "/teams", label: "หมู่บ้าน/ทีม" },
  { href: "#history", label: "ประวัติ" },
  { href: "#host", label: "เจ้าภาพ" }
];

const TICKER = [
  "ต้านภัยยาเสพติด",
  "ชิงถ้วยพระราชทาน",
  "ฟุตบอล",
  "บาสเกตบอล",
  "วอลเลย์บอล",
  "เซปักตะกร้อ",
  "เทเบิลเทนนิส",
  "เปตอง",
  "มินิมาราธอน",
  "เอ็นดูโร่",
  "ลูกข่างพื้นบ้าน",
  "ชักเย่อ",
  "มรดกวัฒนธรรมจีนยูนนาน"
];

const STATS = [
  { value: "2536", label: "ปีที่ก่อตั้ง", sub: "จัดต่อเนื่องกว่า 30 ปี" },
  { value: "31", label: "ครั้งที่จัดการแข่งขัน", sub: "พญาไพรเกมส์ 2570" },
  { value: "10+", label: "ชนิดกีฬาชิงชัย", sub: "รวมกีฬาพื้นบ้าน" },
  { value: "8", label: "วันแห่งศักดิ์ศรี", sub: "29 มี.ค. – 5 เม.ย." }
];

const SPORTS = [
  { icon: "⚽", name: "ฟุตบอล", tag: "ชิงถ้วย" },
  { icon: "🏀", name: "บาสเกตบอล", tag: "ชิงถ้วย" },
  { icon: "🏐", name: "วอลเลย์บอล", tag: "ชิงถ้วย" },
  { icon: "🤾", name: "เซปักตะกร้อ", tag: "ชิงถ้วย" },
  { icon: "🏓", name: "เทเบิลเทนนิส", tag: "ชิงถ้วย" },
  { icon: "🎯", name: "เปตอง", tag: "ชิงถ้วย" },
  { icon: "🏃", name: "มินิมาราธอน", tag: "มหาชน" },
  { icon: "🏍️", name: "เอ็นดูโร่", tag: "ผจญภัย" },
  { icon: "🌀", name: "ลูกข่างพื้นบ้าน", tag: "พื้นบ้าน" },
  { icon: "🪢", name: "ชักเย่อ", tag: "สาธิต" }
];

const CATEGORIES = ["U15", "U18", "U23", "Open", "อาวุโส 40+", "อาวุโสหญิง 30+"];

const TIMELINE = [
  {
    year: "2536",
    title: "จุดกำเนิด",
    desc: "ก่อตั้งโดยผู้นำชุมชน 3 ท่าน รวมพลังชาวจีนยูนนานภาคเหนือ จัดกีฬาในวันที่ 29 มีนาคม"
  },
  {
    year: "2548",
    title: "พระมหากรุณาธิคุณ",
    desc: "ได้รับพระราชทานถ้วยรางวัลจากสมเด็จพระกนิษฐาธิราชเจ้า กรมสมเด็จพระเทพรัตนราชสุดาฯ"
  },
  {
    year: "2569",
    title: "สันมะกอกหวานเกมส์",
    desc: "การแข่งขันครั้งที่ 30 — ก้าวสู่ยุคดิจิทัลด้วยระบบลงทะเบียนออนไลน์ครั้งแรก"
  },
  {
    year: "2570",
    title: "พญาไพรเกมส์",
    desc: "ครั้งที่ 31 ณ บ้านพญาไพร — ศูนย์กลางออนไลน์เต็มรูปแบบของงานกีฬา 329",
    current: true
  }
];

const outlineLight = "inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-[#f1ece1]/40 bg-white/5 px-6 text-base font-bold text-[#f1ece1] backdrop-blur-sm transition hover:bg-white/15";

const outlineNavy = "inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-[#142844] bg-transparent px-6 text-base font-bold text-[#142844] transition hover:bg-[#142844] hover:text-[#f1ece1]";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f1ece1] text-[#142844]">
      {/* ===== Header ===== */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#08254c]/85 backdrop-blur-md">
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
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="hidden rounded-md px-3 py-2 text-sm font-bold text-[#f1ece1]/80 transition hover:text-[#f3c969] md:inline-block"
              >
                {item.label}
              </a>
            ))}
            <Link href="/login" className={cn(outlineLight, "min-h-9 px-3 py-1.5 text-sm")}>
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
          {/* aurora glows */}
          <div
            aria-hidden
            className="lp-aurora pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#c08a3e] blur-3xl"
            style={{ opacity: 0.35 }}
          />
          <div
            aria-hidden
            className="lp-aurora pointer-events-none absolute -bottom-40 right-0 h-[28rem] w-[28rem] rounded-full bg-[#b91528] blur-3xl"
            style={{ opacity: 0.22, animationDelay: "2s" }}
          />
          {/* dot grid */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: "radial-gradient(#f3c969 1px, transparent 1px)",
              backgroundSize: "26px 26px"
            }}
          />
          {/* giant watermark numeral */}
          <span
            aria-hidden
            className="lp-float pointer-events-none absolute -right-6 top-1/2 hidden -translate-y-1/2 select-none font-serif text-[22rem] font-black leading-none text-white/[0.04] lg:block"
          >
            31
          </span>

          <div className="relative mx-auto flex min-h-[88vh] max-w-6xl flex-col justify-center px-4 py-16 sm:px-6 lg:py-24">
            <div className="max-w-3xl">
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#c08a3e]/40 bg-white/5 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-[#f3c969] backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="lp-ring absolute inline-flex h-full w-full rounded-full bg-[#f3c969]" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#f3c969]" />
                </span>
                ครั้งที่ 31 · พญาไพรเกมส์ 2570
              </p>

              <h1 className="font-black leading-[0.95] tracking-tight">
                <span className="block text-2xl text-[#f1ece1]/80 sm:text-3xl">การแข่งขันกีฬา</span>
                <span className="lp-gold-text block text-7xl sm:text-8xl lg:text-[9rem]">329</span>
                <span className="block text-3xl sm:text-4xl lg:text-5xl">ชาวจีนยูนนานภาคเหนือ</span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#f1ece1]/75 sm:text-lg">
                กีฬาต้านภัยยาเสพติด <span className="font-bold text-[#f3c969]">ชิงถ้วยพระราชทาน</span>
                สมเด็จพระกนิษฐาธิราชเจ้า กรมสมเด็จพระเทพรัตนราชสุดาฯ สยามบรมราชกุมารี —
                มรดกวัฒนธรรมที่ส่งต่อมากว่า 3 ทศวรรษ
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-bold text-[#f1ece1]/80">
                <span className="inline-flex items-center gap-2">
                  <span className="text-[#f3c969]">◷</span> {formatThaiEventPeriod()}
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="text-[#f3c969]">◉</span> ณ บ้านพญาไพร · ภาคเหนือ
                </span>
              </div>

              <div className="mt-8">
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#f1ece1]/50">
                  นับถอยหลังสู่พิธีเปิด 29 มีนาคม
                </p>
                <Countdown />
              </div>

              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="/register" className={linkButtonClasses("gold", "min-h-12 px-7 text-base")}>
                  ลงทะเบียนทีม / เข้าร่วม
                </Link>
                <a href="#about" className={outlineLight}>
                  รู้จักงานนี้ก่อน
                </a>
              </div>
            </div>
          </div>

          {/* scroll cue */}
          <div aria-hidden className="lp-cue absolute bottom-5 left-1/2 -translate-x-1/2 text-2xl text-[#f3c969]/60">
            ⌄
          </div>
        </section>

        {/* ===== Ticker ===== */}
        <div className="overflow-hidden border-y border-[#c08a3e]/30 bg-[#0b2e5c] py-3">
          <div className="lp-marquee-track">
            {[0, 1].map((dup) => (
              <ul key={dup} className="flex shrink-0 items-center gap-8 px-4" aria-hidden={dup === 1}>
                {TICKER.map((word, i) => (
                  <li key={i} className="flex items-center gap-8 text-sm font-bold tracking-wide text-[#f1ece1]/85">
                    <span>{word}</span>
                    <span className="text-[#c08a3e]">✦</span>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>

        {/* ===== Stats ===== */}
        <section className="lp-reveal border-b border-[#142844]/10 bg-[#fbfaf5]">
          <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-y divide-[#142844]/10 px-4 sm:px-6 lg:grid-cols-4 lg:divide-y-0">
            {STATS.map((s) => (
              <div key={s.label} className="px-3 py-7 text-center sm:px-6 sm:py-9">
                <div className="font-serif text-4xl font-black text-[#142844] sm:text-5xl">{s.value}</div>
                <div className="mt-2 text-sm font-black text-[#c08a3e]">{s.label}</div>
                <div className="mt-1 text-xs text-[#667085]">{s.sub}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ===== About ===== */}
        <section id="about" className="lp-reveal scroll-mt-20 py-16 sm:py-24">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#c08a3e]">เกี่ยวกับงาน</p>
              <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
                บ้านดิจิทัลของ<br className="hidden sm:block" />
                กีฬา 329
              </h2>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-[#142844]/80 sm:text-lg">
                กีฬา 329 คือมรดกทางวัฒนธรรมของชาวไทยเชื้อสายจีนยูนนานในภาคเหนือ
                จัดขึ้นเพื่อส่งเสริมสุขภาพ สานสัมพันธ์ระหว่างหมู่บ้าน และต่อต้านยาเสพติด
                ในชุมชนชายแดน ครั้งที่ 31 หมู่บ้านบ้านพญาไพรรับหน้าที่เป็นเจ้าภาพ
                ภายใต้ชื่อ <span className="font-bold">พญาไพรเกมส์ 2570</span>
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/register" className={linkButtonClasses("gold", "min-h-12 px-6 text-base")}>
                  สนใจเข้าร่วม
                </Link>
                <Link href="/login" className={outlineNavy}>
                  เข้าสู่ระบบ MIS
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-[#c08a3e]/30 bg-gradient-to-br from-[#08254c] to-[#123f76] p-7 text-[#f1ece1] shadow-xl sm:p-9">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f3c969]">ที่มาของชื่อ</p>
              <div className="mt-3 flex items-baseline gap-3">
                <span className="lp-gold-text font-serif text-6xl font-black sm:text-7xl">329</span>
                <span className="text-sm font-bold text-[#f1ece1]/70">= 29 มีนาคม</span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-[#f1ece1]/80">
                เลข <b className="text-[#f3c969]">3</b> หมายถึงเดือนมีนาคม และ
                <b className="text-[#f3c969]"> 29</b> คือวันที่จัดงานทุกปี
                อันเป็นวันรวมพลังของชุมชนยูนนานทั่วภาคเหนือ
              </p>
              <hr className="my-6 border-white/10" />
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f3c969]">เกียรติสูงสุด</p>
              <p className="mt-2 text-sm leading-relaxed text-[#f1ece1]/85">
                ชิงถ้วยพระราชทานจากสมเด็จพระกนิษฐาธิราชเจ้า
                กรมสมเด็จพระเทพรัตนราชสุดาฯ สยามบรมราชกุมารี ตั้งแต่ พ.ศ. 2548
              </p>
            </div>
          </div>
        </section>

        {/* ===== Sports ===== */}
        <section id="sports" className="lp-reveal scroll-mt-20 bg-[#08254c] py-16 text-[#f1ece1] sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#c08a3e]">สนามแห่งศักดิ์ศรี</p>
                <h2 className="mt-2 text-3xl font-black sm:text-4xl">10 ชนิดกีฬาชิงชัย</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <span
                    key={c}
                    className="rounded-full border border-[#f1ece1]/20 bg-white/5 px-3 py-1 text-xs font-bold text-[#f1ece1]/80"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
              {SPORTS.map((sport) => (
                <article
                  key={sport.name}
                  className="group rounded-xl border border-white/10 bg-white/[0.04] p-5 text-center transition duration-300 hover:-translate-y-1 hover:border-[#c08a3e]/60 hover:bg-white/[0.08]"
                >
                  <div className="text-4xl transition duration-300 group-hover:scale-110">{sport.icon}</div>
                  <h3 className="mt-3 text-sm font-black sm:text-base">{sport.name}</h3>
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-[#f3c969]/70">
                    {sport.tag}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ===== Timeline ===== */}
        <section id="history" className="lp-reveal scroll-mt-20 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#c08a3e]">เส้นทาง 30 กว่าปี</p>
            <h2 className="mt-2 text-3xl font-black sm:text-4xl">จากวันก่อตั้ง สู่พญาไพรเกมส์</h2>

            <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {TIMELINE.map((node, i) => (
                <li
                  key={node.year}
                  className={cn(
                    "relative rounded-2xl border p-6 transition",
                    node.current
                      ? "border-[#c08a3e] bg-gradient-to-br from-[#08254c] to-[#123f76] text-[#f1ece1] shadow-xl"
                      : "border-[#e7e2d7] bg-white shadow-sm"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full text-xs font-black",
                        node.current ? "bg-[#c08a3e] text-[#08254c]" : "bg-[#142844] text-[#f1ece1]"
                      )}
                    >
                      {i + 1}
                    </span>
                    <span
                      className={cn(
                        "font-serif text-2xl font-black",
                        node.current ? "text-[#f3c969]" : "text-[#142844]"
                      )}
                    >
                      {node.year}
                    </span>
                  </div>
                  <h3 className={cn("mt-4 text-lg font-black", node.current && "text-[#f3c969]")}>
                    {node.title}
                  </h3>
                  <p
                    className={cn(
                      "mt-2 text-sm leading-relaxed",
                      node.current ? "text-[#f1ece1]/80" : "text-[#667085]"
                    )}
                  >
                    {node.desc}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ===== Host ===== */}
        <section id="host" className="lp-reveal scroll-mt-20 border-y border-[#142844]/10 bg-[#fbfaf5] py-16 sm:py-24">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div className="flex justify-center">
              <div className="relative flex h-48 w-48 items-center justify-center rounded-full border-4 border-[#c08a3e] bg-white shadow-lg sm:h-60 sm:w-60">
                <span className="font-serif text-7xl font-black text-[#142844] sm:text-8xl">31</span>
                <span className="absolute -bottom-3 rounded-full bg-[#142844] px-4 py-1 text-xs font-bold text-[#f1ece1]">
                  เจ้าภาพ 2570
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#c08a3e]">เจ้าภาพครั้งที่ 31</p>
              <h2 className="mt-2 text-3xl font-black sm:text-4xl">บ้านพญาไพร — พญาไพรเกมส์ 2570</h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-[#142844]/80">
                หมู่บ้านบ้านพญาไพรรับธงเจ้าภาพต่อจากสันมะกอกหวานเกมส์ พร้อมต้อนรับนักกีฬา
                ผู้นำทีม และครอบครัวชาวยูนนานจากทั่วภาคเหนือ ร่วมเฉลิมฉลองมิตรภาพ
                ศักดิ์ศรี และเจตนารมณ์ต้านภัยยาเสพติด ระหว่าง {formatThaiEventPeriod()}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/register" className={linkButtonClasses("gold", "min-h-12 px-6 text-base")}>
                  ลงทะเบียนเข้าร่วม
                </Link>
                <Link href="/login" className={outlineNavy}>
                  คณะกรรมการ / เจ้าหน้าที่
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ===== Final CTA ===== */}
        <section className="lp-reveal relative overflow-hidden bg-[#08254c] py-20 text-center text-[#f1ece1]">
          <div
            aria-hidden
            className="lp-aurora pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-[#c08a3e] blur-3xl"
            style={{ opacity: 0.25 }}
          />
          <div className="relative mx-auto max-w-2xl px-4 sm:px-6">
            <h2 className="text-3xl font-black sm:text-4xl">พร้อมเป็นส่วนหนึ่งของประวัติศาสตร์?</h2>
            <p className="mx-auto mt-4 max-w-xl text-[#f1ece1]/75">
              หัวหน้าทีมและผู้สนใจ — ลงทะเบียนแจ้งความประสงค์เข้าร่วม ·
              คณะกรรมการ — เข้าสู่ระบบ MIS เพื่อบริหารงานภายใน
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/register" className={linkButtonClasses("gold", "min-h-12 px-8 text-base")}>
                ลงทะเบียน
              </Link>
              <Link href="/login" className={outlineLight}>
                เข้าสู่ระบบ
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ===== Footer ===== */}
      <footer className="bg-[#06203f] px-4 py-10 text-[#f1ece1] sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#c08a3e] text-sm font-black text-[#f3c969]">
                31
              </span>
              <p className="font-black">การแข่งขันกีฬา 329 ชาวจีนยูนนาน</p>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-[#f1ece1]/60">
              ครั้งที่ 31 · พญาไพรเกมส์ 2570 ณ บ้านพญาไพร — กีฬาต้านภัยยาเสพติด
              ชิงถ้วยพระราชทานฯ
            </p>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm font-bold">
            <a href="#about" className="text-[#f1ece1]/70 hover:text-[#f3c969]">เกี่ยวกับงาน</a>
            <a href="#sports" className="text-[#f1ece1]/70 hover:text-[#f3c969]">ชนิดกีฬา</a>
            <Link href="/teams" className="text-[#f1ece1]/70 hover:text-[#f3c969]">หมู่บ้าน/ทีม</Link>
            <a href="#history" className="text-[#f1ece1]/70 hover:text-[#f3c969]">ประวัติ</a>
            <Link href="/register" className="text-[#f1ece1]/70 hover:text-[#f3c969]">ลงทะเบียน</Link>
            <Link href="/login" className="text-[#f1ece1]/70 hover:text-[#f3c969]">เข้าสู่ระบบ MIS</Link>
          </div>
        </div>
        <div className="mx-auto mt-8 max-w-6xl border-t border-white/10 pt-5 text-xs text-[#f1ece1]/40">
          © {new Date().getFullYear() + 543} คณะกรรมการกีฬา 329 ชาวจีนยูนนานภาคเหนือ · สงวนลิขสิทธิ์
        </div>
      </footer>
    </div>
  );
}
