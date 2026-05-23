import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import "./globals.css";

const sarabun = Sarabun({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-sarabun"
});

export const metadata: Metadata = {
  title: "329 Yunnan Sports MIS",
  description: "ระบบบริหารงานแข่งขันกีฬา 329 ชาวจีนยูนาน — จัดทุกปี 29 มี.ค. – 5 เม.ย. (329 = มีนาคม วันที่ 29)"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body className={sarabun.variable}>{children}</body>
    </html>
  );
}
