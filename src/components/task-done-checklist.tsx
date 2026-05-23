import { canMarkDone, taskDoneBlockers, type TaskDoneInput } from "@/lib/rules";

export function TaskDoneChecklist({ input }: { input: TaskDoneInput }) {
  const ready = canMarkDone(input);
  const blockers = taskDoneBlockers(input);

  const items = [
    { ok: input.hasApprovedEvidence, label: "มีหลักฐานอนุมัติแล้วอย่างน้อย 1 รายการ" },
    { ok: input.hasReviewer, label: "มีผู้ตรวจสอบ (reviewer)" },
    { ok: input.verified_progress === 100, label: "ความคืบหน้าที่ตรวจแล้ว = 100%" }
  ];

  return (
    <div className="rounded-md border border-[#e7e2d7] bg-[#fbfaf5] p-3 sm:p-4">
      <h3 className="text-sm font-black text-[#101827]">เงื่อนไขปิดงาน (สถานะ DONE)</h3>
      <p className="mt-1 text-xs text-[#667085]">ภารกิจหลักเท่านั้น — ครบทั้ง 3 ข้อจึงปิดงานได้</p>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item.label} className="flex items-start gap-2 text-sm">
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                item.ok ? "bg-[#107c41] text-white" : "bg-[#e7e2d7] text-[#667085]"
              }`}
              aria-hidden
            >
              {item.ok ? "✓" : "·"}
            </span>
            <span className={item.ok ? "text-[#107c41] font-bold" : "text-[#475467]"}>{item.label}</span>
          </li>
        ))}
      </ul>
      {ready ? (
        <p className="mt-3 text-sm font-bold text-[#107c41]">พร้อมปิดงานแล้ว</p>
      ) : (
        <p className="mt-3 text-sm font-bold text-[#b91528]">{blockers.join(" · ")}</p>
      )}
    </div>
  );
}
