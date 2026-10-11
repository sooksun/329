import Link from "next/link";

/** ไม่พบข้อมูล (เช่น id ภารกิจผิด หรืออยู่โปรเจกต์อื่น) — เดิมแสดงหน้าว่าง */
export default function MisNotFound() {
  return (
    <div className="mx-auto grid max-w-lg gap-3 rounded-md border p-6 text-center">
      <h1 className="text-lg font-black text-[#123f76]">ไม่พบข้อมูลที่ต้องการ</h1>
      <p className="text-sm text-[#667085]">รายการนี้อาจถูกลบ อยู่ในโปรเจกต์อื่น หรือคุณไม่มีสิทธิ์เข้าถึง</p>
      <Link href="/dashboard" className="mx-auto font-bold text-[#123f76] underline">
        กลับหน้าภาพรวม
      </Link>
    </div>
  );
}
