"use client";

import { cn } from "@/lib/utils";

export function Card({ className, children }: React.PropsWithChildren<{ className?: string }>) {
  return <section className={cn("card", className)}>{children}</section>;
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "gold" | "ghost" | "danger";
};

export function buttonClasses(variant: ButtonProps["variant"] = "default", className?: string, disabled?: boolean) {
  return cn(
    "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md border px-4 text-sm font-bold transition sm:min-h-10",
    variant === "default" && "border-[#d8d1c1] bg-white text-[#101827] hover:bg-[#f7f4ed]",
    variant === "gold" && "border-[#9f7525] bg-[#b68a2e] text-white hover:bg-[#a47925]",
    variant === "ghost" && "border-transparent bg-transparent text-[#123f76] hover:bg-[#eef3f9]",
    variant === "danger" && "border-[#f2bdc4] bg-[#fff5f6] text-[#b91528]",
    disabled && "cursor-not-allowed opacity-60",
    className
  );
}

export function Button({ className, children, variant = "default", type = "button", ...props }: ButtonProps) {
  return (
    <button type={type} className={buttonClasses(variant, className, props.disabled)} {...props}>
      {children}
    </button>
  );
}

export function ProgressBar({ value, color = "#123f76" }: { value: number; color?: string }) {
  return (
    <div className="progress-track">
      <div className="progress-fill" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }} />
    </div>
  );
}

export function Badge({ children, tone = "neutral" }: React.PropsWithChildren<{ tone?: "neutral" | "green" | "red" | "gold" | "blue" }>) {
  return (
    <span
      className={cn(
        "badge",
        tone === "neutral" && "bg-[#f3f1ea] text-[#475467]",
        tone === "green" && "bg-[#e9f8ef] text-[#107c41]",
        tone === "red" && "bg-[#fff1f3] text-[#b91528]",
        tone === "gold" && "bg-[#fbf3dc] text-[#8a641e]",
        tone === "blue" && "bg-[#eaf2fb] text-[#123f76]"
      )}
    >
      {children}
    </span>
  );
}
