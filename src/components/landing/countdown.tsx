"use client";

import { useEffect, useState } from "react";
import { EVENT_329 } from "@/lib/event-calendar";

type Parts = { days: number; hours: number; minutes: number; seconds: number };

const TARGET = EVENT_329.start.getTime();

function diff(): Parts {
  const ms = Math.max(0, TARGET - Date.now());
  return {
    days: Math.floor(ms / 86_400_000),
    hours: Math.floor((ms / 3_600_000) % 24),
    minutes: Math.floor((ms / 60_000) % 60),
    seconds: Math.floor((ms / 1000) % 60)
  };
}

const units: { key: keyof Parts; label: string }[] = [
  { key: "days", label: "วัน" },
  { key: "hours", label: "ชั่วโมง" },
  { key: "minutes", label: "นาที" },
  { key: "seconds", label: "วินาที" }
];

export function Countdown() {
  const [parts, setParts] = useState<Parts | null>(null);

  useEffect(() => {
    setParts(diff());
    const id = setInterval(() => setParts(diff()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-wrap gap-2 sm:gap-3" aria-label="นับถอยหลังสู่วันเปิดงาน">
      {units.map(({ key, label }) => (
        <div
          key={key}
          className="min-w-16 flex-1 rounded-xl border border-[#c08a3e]/30 bg-white/5 px-3 py-2.5 text-center backdrop-blur-sm sm:min-w-20 sm:px-4 sm:py-3"
        >
          <div className="font-mono text-2xl font-black tabular-nums text-[#f3c969] sm:text-3xl">
            {parts ? String(parts[key]).padStart(2, "0") : "––"}
          </div>
          <div className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-[#f1ece1]/60 sm:text-xs">
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}
