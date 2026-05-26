"use client";

import { useEffect } from "react";

/**
 * กู้คืนอัตโนมัติเมื่อเบราว์เซอร์โหลด chunk ไม่สำเร็จ (ChunkLoadError)
 * เกิดได้เมื่อ build hash ใน manifest ของหน้าที่เปิดค้างไม่ตรงกับ chunk ปัจจุบัน
 * (พบบ่อยตอน dev recompile หรือหลัง deploy เวอร์ชันใหม่) — reload หนึ่งครั้งเพื่อโหลด build ล่าสุด
 * มี guard กันการ reload วน (ไม่ reload ซ้ำภายใน 10 วินาที)
 */
const RELOAD_KEY = "__chunk_reload_ts";
const COOLDOWN_MS = 10_000;

function isChunkError(text?: unknown): boolean {
  if (typeof text !== "string") return false;
  return /ChunkLoadError|Loading chunk [\w./-]+ failed|Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed/i.test(
    text
  );
}

function recover() {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? "0");
    if (Date.now() - last < COOLDOWN_MS) return; // กันลูป
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    // sessionStorage อาจใช้ไม่ได้ — ยังคง reload ต่อ
  }
  window.location.reload();
}

export function ChunkErrorRecovery() {
  useEffect(() => {
    function onError(e: ErrorEvent) {
      const err = e.error as { name?: string; message?: string } | undefined;
      if (isChunkError(e.message) || isChunkError(err?.name) || isChunkError(err?.message)) {
        recover();
      }
    }
    function onRejection(e: PromiseRejectionEvent) {
      const r = e.reason as { name?: string; message?: string } | undefined;
      if (isChunkError(r?.name) || isChunkError(r?.message)) {
        recover();
      }
    }
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
