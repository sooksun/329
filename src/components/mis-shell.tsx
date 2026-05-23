"use client";

import {
  CalendarDays,
  ClipboardList,
  FileImage,
  GanttChartSquare,
  Home,
  ListChecks,
  LogOut,
  Menu,
  Monitor,
  PanelLeftClose,
  PanelLeftOpen,
  PiggyBank,
  Presentation,
  Search,
  Settings,
  ShieldAlert,
  ScrollText,
  Users,
  X,
  Download
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { NotificationBell } from "@/components/notification-bell";
import { ProjectSelector } from "@/components/project-selector";
import { formatBaht } from "@/lib/utils";

type CountKey = "totalTasks" | "evidencePending" | "criticalRisks";

type ShellData = {
  project: {
    id: string;
    name: string;
    edition: string;
    organizationName: string;
  };
  activeProjectId: string;
  accessibleProjects: Array<{
    id: string;
    name: string;
    edition: string;
    organizationName: string;
  }>;
  user: {
    name: string;
    initials: string;
    role: string;
    isAdmin: boolean;
    canViewAudit: boolean;
  };
  summary: {
    overall: number;
    delayedTasks: number;
    criticalRisks: number;
    evidencePending: number;
    totalTasks: number;
    daysRemaining: number;
    budget: {
      actual: number;
      planned: number;
    };
  };
};

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  countKey?: CountKey;
};

const navSections: Array<{ section: string; items: NavItem[] }> = [
  {
    section: "ภาพรวม",
    items: [
      { href: "/dashboard", label: "ภาพรวมโครงการ", icon: Home },
      { href: "/committees", label: "คณะอนุกรรมการ", icon: Users }
    ]
  },
  {
    section: "การปฏิบัติงาน",
    items: [
      { href: "/tasks", label: "บอร์ดภารกิจ", icon: ClipboardList, countKey: "totalTasks" },
      { href: "/tasks/export", label: "ส่งออกภารกิจ", icon: Download },
      { href: "/tasks/detail", label: "รายละเอียดงาน", icon: ListChecks },
      { href: "/evidence", label: "คลังหลักฐาน", icon: FileImage, countKey: "evidencePending" },
      { href: "/timeline", label: "กำหนดการ", icon: GanttChartSquare }
    ]
  },
  {
    section: "การบริหาร",
    items: [
      { href: "/budget", label: "งบประมาณ", icon: PiggyBank },
      { href: "/risks", label: "ความเสี่ยง", icon: ShieldAlert, countKey: "criticalRisks" },
      { href: "/meetings", label: "การประชุม", icon: Monitor },
      { href: "/reports", label: "รายงาน PowerPoint", icon: Presentation }
    ]
  },
  {
    section: "อ้างอิง",
    items: [
      { href: "/profile", label: "โปรไฟล์ของฉัน", icon: Settings },
      { href: "/mobile", label: "ขั้นตอนบนมือถือ", icon: CalendarDays }
    ]
  }
];

function navCount(data: ShellData, countKey?: CountKey) {
  if (!countKey) return undefined;
  return String(data.summary[countKey]);
}

function SidebarPanel({
  data,
  collapsed,
  expandedLabels,
  onNavigate,
  onToggleCollapse,
  showCollapseToggle,
  mobileHeader
}: {
  data: ShellData;
  collapsed: boolean;
  expandedLabels: boolean;
  onNavigate?: () => void;
  onToggleCollapse?: () => void;
  showCollapseToggle: boolean;
  mobileHeader?: React.ReactNode;
}) {
  const pathname = usePathname();
  const adminNav: NavItem[] = [
    ...(data.user.isAdmin ? [{ href: "/admin/users", label: "จัดการผู้ใช้", icon: Users }] : []),
    ...(data.user.canViewAudit ? [{ href: "/audit-log", label: "Audit Log", icon: ScrollText }] : [])
  ];

  return (
    <>
      {mobileHeader}
      <div className="flex items-center gap-3 border-b border-white/10 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#b91528] to-[#b68a2e] text-sm font-black">
          329
        </div>
        {expandedLabels ? (
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-black">329 Yunnan Sports</div>
            <div className="truncate text-xs text-blue-100">MIS · {data.project.edition}</div>
          </div>
        ) : null}
      </div>

      {expandedLabels && data.accessibleProjects.length > 1 ? (
        <div className="border-b border-white/10 px-3 py-3 md:hidden">
          <p className="mb-2 px-1 text-xs font-bold text-blue-200">โปรเจกต์</p>
          <ProjectSelector variant="drawer" projects={data.accessibleProjects} activeProjectId={data.activeProjectId} />
        </div>
      ) : null}

      {showCollapseToggle ? (
        <div className="hidden px-3 pt-3 md:block">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-white/10 bg-white/5 text-sm font-bold text-blue-50 hover:bg-white/10"
            title={collapsed ? "ขยายเมนู" : "ยุบเมนู"}
            aria-label={collapsed ? "ขยายเมนูด้านซ้าย" : "ยุบเมนูด้านซ้าย"}
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            {!collapsed ? <span>ยุบเมนู</span> : null}
          </button>
        </div>
      ) : null}

      <nav className="flex-1 overflow-auto p-3">
        {navSections.map((section) => (
          <div key={section.section}>
            {expandedLabels ? (
              <div className="mt-4 px-2 text-xs text-blue-200">{section.section}</div>
            ) : (
              <div className="mt-4 border-t border-white/10" />
            )}
            {section.items.map((item) => {
              const count = navCount(data, item.countKey);
              const active =
                pathname === item.href ||
                (item.href !== "/tasks" && pathname.startsWith(`${item.href}/`)) ||
                (item.href === "/tasks/detail" && pathname.startsWith("/tasks/detail"));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  title={!expandedLabels ? item.label : undefined}
                  className={`mt-1 flex min-h-[44px] items-center gap-3 rounded-md px-3 text-sm font-bold text-blue-50 hover:bg-white/10 ${
                    active ? "bg-white/15" : ""
                  }`}
                >
                  <item.icon size={18} className="shrink-0" />
                  {expandedLabels ? <span className="min-w-0 flex-1 truncate">{item.label}</span> : null}
                  {expandedLabels && count ? <span className="rounded-full bg-white/10 px-2 text-xs">{count}</span> : null}
                  {!expandedLabels && count ? <span className="ml-auto h-2 w-2 rounded-full bg-[#b91528]" /> : null}
                </Link>
              );
            })}
          </div>
        ))}
        {adminNav.length ? (
          <div>
            {expandedLabels ? <div className="mt-4 px-2 text-xs text-blue-200">ผู้ดูแลระบบ</div> : <div className="mt-4 border-t border-white/10" />}
            {adminNav.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={`mt-1 flex min-h-[44px] items-center gap-3 rounded-md px-3 text-sm font-bold text-blue-50 hover:bg-white/10 ${
                    active ? "bg-white/15" : ""
                  }`}
                >
                  <item.icon size={18} className="shrink-0" />
                  {expandedLabels ? <span className="min-w-0 flex-1 truncate">{item.label}</span> : null}
                </Link>
              );
            })}
          </div>
        ) : null}
      </nav>

      <div className="m-3 space-y-2 rounded-md bg-white/8 p-3">
        <Link
          href="/profile"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-md hover:bg-white/10"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#b68a2e] font-black">
            {data.user.initials}
          </div>
          {expandedLabels ? (
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold">{data.user.name}</div>
              <div className="truncate text-xs text-blue-100">{data.user.role}</div>
            </div>
          ) : null}
        </Link>
        {expandedLabels ? (
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-md border border-white/15 text-sm font-bold text-blue-50 hover:bg-white/10"
          >
            <LogOut size={15} /> ออกจากระบบ
          </button>
        ) : null}
      </div>
    </>
  );
}

export function MisShell({ children, data }: { children: React.ReactNode; data: ShellData }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const saved = window.localStorage.getItem("329-sidebar-collapsed");
    if (saved) setCollapsed(saved === "true");
  }, []);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen]);

  function toggleSidebar() {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem("329-sidebar-collapsed", String(next));
      return next;
    });
  }

  function goToSearch() {
    const params = new URLSearchParams();
    const keyword = search.trim();
    if (keyword) params.set("search", keyword);
    router.push(`/tasks${params.toString() ? `?${params.toString()}` : ""}`);
  }

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    goToSearch();
  }

  return (
    <div
      className={`min-h-screen bg-[#fbfaf5] max-md:block md:grid ${
        collapsed ? "md:[grid-template-columns:76px_minmax(0,1fr)]" : "md:[grid-template-columns:232px_minmax(0,1fr)]"
      }`}
    >
        {/* Desktop sidebar */}
        <aside className="sticky top-0 z-30 hidden h-screen flex-col bg-[#0b2e5c] text-white transition-[width] duration-200 md:flex">
          <SidebarPanel
            data={data}
            collapsed={collapsed}
            expandedLabels={!collapsed}
            onToggleCollapse={toggleSidebar}
            showCollapseToggle
          />
        </aside>

        {/* Mobile drawer */}
        {mobileNavOpen ? (
          <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="เมนูหลัก">
            <button
              type="button"
              className="absolute inset-0 bg-[#101827]/50"
              aria-label="ปิดเมนู"
              onClick={() => setMobileNavOpen(false)}
            />
            <aside className="absolute inset-y-0 left-0 flex w-[min(288px,88vw)] flex-col bg-[#0b2e5c] text-white shadow-xl">
              <SidebarPanel
                data={data}
                collapsed={false}
                expandedLabels
                showCollapseToggle={false}
                onNavigate={() => setMobileNavOpen(false)}
                mobileHeader={
                  <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
                    <span className="text-sm font-black">เมนู</span>
                    <button
                      type="button"
                      className="flex h-10 w-10 items-center justify-center rounded-md hover:bg-white/10"
                      aria-label="ปิดเมนู"
                      onClick={() => setMobileNavOpen(false)}
                    >
                      <X size={20} />
                    </button>
                  </div>
                }
              />
            </aside>
          </div>
        ) : null}

        <div className="min-w-0">
          {/* Mobile: แถบบาง — เมนู + ชื่องาน + งานล่าช้า */}
          <header className="sticky top-0 z-20 border-b border-[#e7e2d7] bg-white md:hidden">
            <div
              className="flex h-12 items-center gap-2 px-3"
              style={{ paddingTop: "max(0px, env(safe-area-inset-top))" }}
            >
              <button
                type="button"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-[#123f76] hover:bg-[#f0eee7]"
                aria-label="เปิดเมนู"
                onClick={() => setMobileNavOpen(true)}
              >
                <Menu size={22} />
              </button>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-black text-[#101827]">329 Yunnan Sports MIS</div>
                <div className="truncate text-[11px] text-[#667085]">{data.project.edition}</div>
              </div>
              <NotificationBell className="shrink-0" />
            </div>
          </header>

          {/* Desktop: header เต็ม */}
          <header className="sticky top-0 z-20 hidden border-b border-[#e7e2d7] bg-white md:block">
            <div className="flex h-[60px] items-center gap-4 px-6">
              <ProjectSelector projects={data.accessibleProjects} activeProjectId={data.activeProjectId} />
              <form onSubmit={submitSearch} className="relative max-w-md flex-1">
                <button
                  type="submit"
                  className="absolute left-2 top-2 rounded p-0.5 text-[#98a2b3] hover:text-[#123f76]"
                  title="ค้นหา"
                  aria-label="ค้นหา"
                >
                  <Search size={16} />
                </button>
                <input
                  className="h-10 w-full rounded-md border border-[#e7e2d7] bg-[#fbfaf5] pl-9 pr-4 text-sm"
                  placeholder="ค้นหาภารกิจ, หลักฐาน, หรือผู้รับผิดชอบ..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      goToSearch();
                    }
                  }}
                />
              </form>
              <NotificationBell />
              <Link href="/committees" className="rounded-md p-2 hover:bg-[#f0eee7]" title="ตั้งค่าฝ่ายงาน" aria-label="ตั้งค่าฝ่ายงาน">
                <Settings size={18} />
              </Link>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-bold"
              >
                <LogOut size={15} /> ออกจากระบบ
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 border-t border-[#e7e2d7] bg-[#123f76] px-6 py-3 text-sm text-white lg:grid-cols-5">
              <b className="col-span-2 lg:col-span-1">
                {data.project.name} · {data.project.edition}
              </b>
              <span>
                คืบหน้า <b>{data.summary.overall}%</b>
              </span>
              <span>
                ล่าช้า <b className="text-[#ffb3bf]">{data.summary.delayedTasks} งาน</b>
              </span>
              <span>
                งบใช้{" "}
                <b>
                  {formatBaht(data.summary.budget.actual)} / {formatBaht(data.summary.budget.planned)}
                </b>
              </span>
              <span>
                วันงาน <b className="text-[#d8bd75]">{data.summary.daysRemaining} วัน</b>
              </span>
            </div>
          </header>

          <main className="p-3 pb-6 sm:p-5 md:p-6">{children}</main>
        </div>
    </div>
  );
}
