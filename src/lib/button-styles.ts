import { cn } from "./utils";

/** ปุ่มลิงก์สำหรับ mobile-first — ใส่ w-full ผ่าน className บนมือถือได้ */
export const touchTargetClass = "min-h-[44px]";

export function linkButtonClasses(variant: "default" | "gold" | "ghost" | "danger" = "default", className?: string) {
  return cn(
    "inline-flex min-h-[40px] items-center justify-center gap-2 rounded-md border px-4 text-sm font-bold transition sm:min-h-10",
    variant === "default" && "border-[#d8d1c1] bg-white text-[#101827] hover:bg-[#f7f4ed]",
    variant === "gold" && "border-[#9f7525] bg-[#b68a2e] text-white hover:bg-[#a47925]",
    variant === "ghost" && "border-transparent bg-transparent text-[#123f76] hover:bg-[#eef3f9]",
    variant === "danger" && "border-[#f2bdc4] bg-[#fff5f6] text-[#b91528]",
    className
  );
}
