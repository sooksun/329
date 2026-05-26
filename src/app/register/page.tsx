import Link from "next/link";
import { HeroLogo } from "@/components/landing/hero-logo";
import { RegisterForm } from "@/components/landing/register-form";
import { linkButtonClasses } from "@/lib/button-styles";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#f1ece1] text-[#142844]">
      <header className="border-b border-[#142844]/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link href="/" className="text-sm font-bold hover:text-[#c08a3e]">
            ← กลับหน้าแรก
          </Link>
          <Link href="/login" className={linkButtonClasses("default", "text-sm")}>
            เข้าสู่ระบบ
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-16">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#c08a3e]">ครั้งที่ 31</p>
          <h1 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">
            ลงทะเบียนเข้าร่วม
            <br />
            การแข่งขันกีฬา 329
          </h1>
          <p className="mt-3 text-lg font-bold text-[#142844]/80">ณ บ้านพญาไพร · พญาไพรเกมส์ 2570</p>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-[#667085]">
            แจ้งความประสงค์เข้าร่วมแข่งขันในฐานะหมู่บ้านหรือทีม
            คณะกรรมการจะติดต่อกลับเมื่อเปิดรับลงทะเบียนอย่างเป็นทางการ
          </p>
          <div className="mt-8 hidden justify-center lg:flex">
            <HeroLogo className="h-48 w-48" />
          </div>
        </div>

        <div className="rounded-xl border border-[#e7e2d7] bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-black">แบบฟอร์มแจ้งความประสงค์</h2>
          <p className="mt-1 text-sm text-[#667085]">กรอกข้อมูลเพื่อให้คณะกรรมการติดต่อกลับ</p>
          <div className="mt-6">
            <RegisterForm />
          </div>
        </div>
      </main>
    </div>
  );
}
