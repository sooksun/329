/** แสดงระหว่างโหลดหน้า MIS (server component ดึงข้อมูลจาก DB) — เดิมไม่มี ผู้ใช้เห็นหน้าค้าง */
export default function MisLoading() {
  return (
    <div className="grid gap-4" role="status" aria-live="polite">
      <span className="sr-only">กำลังโหลดข้อมูล…</span>
      <div className="h-8 w-56 animate-pulse rounded bg-[#e8e4da]" />
      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((key) => (
          <div key={key} className="h-24 animate-pulse rounded-md bg-[#efece4]" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-md bg-[#efece4]" />
    </div>
  );
}
