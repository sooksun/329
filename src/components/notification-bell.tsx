"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { readApiError } from "@/lib/messages";

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return "";
  }
}

export function NotificationBell({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/notifications", { credentials: "same-origin" });
      if (!response.ok) throw new Error(await readApiError(response, "โหลดแจ้งเตือนไม่สำเร็จ"));
      const body = (await response.json()) as { items: NotificationItem[]; unread: number };
      setItems(body.items ?? []);
      setUnread(body.unread ?? 0);
    } catch {
      setItems([]);
      setUnread(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 60_000);
    const onChanged = () => void load();
    window.addEventListener("mis:notifications-changed", onChanged);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("mis:notifications-changed", onChanged);
    };
  }, [load]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  async function markRead(id: string) {
    const response = await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
    if (response.ok) {
      const body = (await response.json()) as { unread: number };
      setUnread(body.unread ?? 0);
      setItems((current) => current.map((item) => (item.id === id ? { ...item, read_at: new Date().toISOString() } : item)));
    }
  }

  return (
    <div ref={panelRef} className={`relative ${className}`}>
      <button
        type="button"
        className="relative flex h-10 w-10 items-center justify-center rounded-md hover:bg-[#f0eee7] md:h-auto md:w-auto md:p-2"
        title="แจ้งเตือน"
        aria-label="แจ้งเตือน"
        aria-expanded={open}
        onClick={() => {
          setOpen((value) => !value);
          if (!open) load();
        }}
      >
        <Bell size={20} className="md:hidden" />
        <Bell size={18} className="hidden md:block" />
        {unread > 0 ? (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#b91528] px-1 text-[10px] font-black text-white md:right-1 md:top-1">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-1 w-[min(320px,calc(100vw-1.5rem))] rounded-md border border-[#e7e2d7] bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-[#e7e2d7] px-3 py-2">
            <span className="text-sm font-black text-[#101827]">แจ้งเตือน</span>
            <Link href="/tasks?status=DELAYED" className="text-xs font-bold text-[#123f76] hover:underline" onClick={() => setOpen(false)}>
              งานล่าช้า
            </Link>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading && items.length === 0 ? (
              <p className="px-3 py-4 text-sm text-[#667085]">กำลังโหลด...</p>
            ) : items.length === 0 ? (
              <p className="px-3 py-4 text-sm text-[#667085]">ไม่มีแจ้งเตือน</p>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`block w-full border-b border-[#f0eee7] px-3 py-2.5 text-left hover:bg-[#fbfaf5] ${item.read_at ? "opacity-70" : ""}`}
                  onClick={() => {
                    if (!item.read_at) void markRead(item.id);
                  }}
                >
                  <div className="text-sm font-bold text-[#101827]">{item.title}</div>
                  <div className="mt-0.5 text-xs leading-snug text-[#667085]">{item.body}</div>
                  <div className="mt-1 text-[10px] text-[#98a2b3]">{formatWhen(item.created_at)}</div>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
