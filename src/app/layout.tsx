import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import { ChunkErrorRecovery } from "@/components/providers/chunk-error-recovery";
import "./globals.css";

const sarabun = Sarabun({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-sarabun"
});

export const metadata: Metadata = {
  title: "329 Yunnan Sports — ครั้งที่ 31 ณ บ้านพญาไพร",
  description:
    "การแข่งขันกีฬา 329 ชาวจีนยูนานครั้งที่ 31 ณ บ้านพญาไพร — พญาไพรเกมส์ 2570 · ลงทะเบียนและเข้าสู่ระบบ MIS"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body className={sarabun.variable}>
        <ChunkErrorRecovery />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
