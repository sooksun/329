import Link from "next/link";
import { cn } from "@/lib/utils";
import { linkButtonClasses } from "@/lib/button-styles";

const touchBtn = "min-h-[44px] w-full justify-center sm:w-auto";

export function PageStack({ children, className }: React.PropsWithChildren<{ className?: string }>) {
  return <div className={cn("space-y-4 sm:space-y-5", className)}>{children}</div>;
}

export function PageHeader({
  title,
  subtitle,
  actions
}: {
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="space-y-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-black leading-tight text-[#101827] sm:text-3xl">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm leading-relaxed text-[#667085]">{subtitle}</p> : null}
      </div>
      {actions ? <PageActions>{actions}</PageActions> : null}
    </header>
  );
}

export function PageActions({ children }: React.PropsWithChildren) {
  return <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap">{children}</div>;
}

export function PageLink({
  href,
  variant = "default",
  active,
  children,
  className
}: React.PropsWithChildren<{
  href: string;
  variant?: "default" | "gold" | "ghost" | "danger";
  active?: boolean;
  className?: string;
}>) {
  return (
    <Link href={href} className={linkButtonClasses(active ? "gold" : variant, cn(touchBtn, className))}>
      {children}
    </Link>
  );
}

export function FilterChips({ children }: React.PropsWithChildren) {
  return (
    <div className="-mx-0.5 flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
      {children}
    </div>
  );
}

export function FilterChip({
  href,
  active,
  children
}: React.PropsWithChildren<{ href: string; active?: boolean }>) {
  return (
    <Link
      href={href}
      className={linkButtonClasses(active ? "gold" : "default", "shrink-0 snap-start whitespace-nowrap px-4")}
    >
      {children}
    </Link>
  );
}

export function MetricGrid({
  children,
  columns = "responsive"
}: React.PropsWithChildren<{ columns?: "responsive" | "two" | "four" }>) {
  const cols =
    columns === "two"
      ? "grid-cols-2"
      : columns === "four"
        ? "grid-cols-2 md:grid-cols-4"
        : "grid-cols-2 md:grid-cols-4 lg:grid-cols-5";
  return <div className={cn("grid gap-2 sm:gap-3", cols)}>{children}</div>;
}

export function MetricTile({
  label,
  value,
  note
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  note?: React.ReactNode;
}) {
  return (
    <div className="metric-card min-h-0 p-3 sm:min-h-[104px] sm:p-4">
      <p className="text-xs text-[#667085] sm:text-sm">{label}</p>
      <div className="mt-1 break-words text-lg font-black sm:text-2xl lg:text-3xl">{value}</div>
      {note ? <p className="mt-0.5 text-xs text-[#667085]">{note}</p> : null}
    </div>
  );
}

export function CardGrid({
  children,
  cols = 1
}: React.PropsWithChildren<{ cols?: 1 | 2 | 3 | 4 }>) {
  const map = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
  };
  return <div className={cn("grid gap-3 sm:gap-4", map[cols])}>{children}</div>;
}

/** เนื้อหาหลัก + แถบข้าง — บนมือถือเรียงแนวตั้ง (aside ล่างตามค่าเริ่มต้น) */
export function SplitLayout({
  main,
  aside,
  asideFirstOnMobile = false,
  asideWidth = "md"
}: {
  main: React.ReactNode;
  aside?: React.ReactNode;
  asideFirstOnMobile?: boolean;
  asideWidth?: "md" | "lg";
}) {
  if (!aside) return <div className="min-w-0 space-y-4">{main}</div>;

  const lgCols =
    asideWidth === "lg"
      ? "lg:grid-cols-[minmax(0,1fr)_min(100%,360px)]"
      : "lg:grid-cols-[minmax(0,1fr)_min(100%,300px)]";

  return (
    <div className={cn("grid gap-4 lg:gap-5", lgCols)}>
      <div
        className={cn(
          "min-w-0 space-y-4",
          asideFirstOnMobile ? "order-2 lg:order-1" : "order-1"
        )}
      >
        {main}
      </div>
      <aside
        className={cn(
          "min-w-0 space-y-4",
          asideFirstOnMobile ? "order-1 lg:order-2" : "order-2 lg:order-1"
        )}
      >
        {aside}
      </aside>
    </div>
  );
}

export function SectionCard({
  title,
  action,
  children,
  className
}: React.PropsWithChildren<{
  title?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}>) {
  return (
    <section className={cn("card p-4 sm:p-5", className)}>
      {title ? (
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-black sm:text-lg [&_svg]:inline">{title}</h2>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function ChartBox({ children, height = "h-64 sm:h-80" }: React.PropsWithChildren<{ height?: string }>) {
  return <div className={cn("w-full min-w-0", height)}>{children}</div>;
}
