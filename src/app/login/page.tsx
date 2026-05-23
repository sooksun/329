import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { authOptions } from "@/lib/auth";
import { getSessionUser } from "@/server/auth/session";
import { listAccessibleProjects } from "@/server/tenant/project-access";

type LoginPageProps = {
  searchParams?: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getServerSession(authOptions);
  const user = getSessionUser(session);
  const params = (await searchParams) ?? {};

  if (user && params.error !== "no_project") {
    const projects = await listAccessibleProjects(user);
    if (projects.length > 0) redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[#08254c] text-white">
      <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden flex-col justify-center px-8 py-12 lg:flex lg:px-20">
          <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#b91528] to-[#b68a2e] text-2xl font-black">
            329
          </div>
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-[#d8bd75]">Yunnan Sports MIS</p>
          <h1 className="max-w-2xl text-4xl font-black leading-tight lg:text-6xl">
            ระบบบริหารโครงการงานแข่งขันกีฬา 329 ชาวจีนยูนาน
          </h1>
          <p className="mt-5 max-w-xl text-lg text-blue-100">
            รอบจัดงาน 29 มี.ค. – 5 เม.ย. 2570 · 329 = เดือน 3 วันที่ 29
          </p>
        </section>

        <section className="flex min-h-screen flex-col justify-center bg-[#fbfaf5] px-4 py-8 text-[#101827] sm:px-6 lg:px-10">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#b91528] to-[#b68a2e] text-lg font-black text-white">
              329
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#8a641e]">Yunnan Sports MIS</p>
              <h1 className="text-lg font-black leading-tight">เข้าสู่ระบบ</h1>
            </div>
          </div>

          <div className="mx-auto w-full max-w-md">
            {params.error === "no_project" ? (
              <p className="mb-4 rounded-md border border-[#fecdca] bg-[#fff5f5] px-4 py-3 text-sm font-bold text-[#b42318]">
                บัญชีนี้ยังไม่มีสิทธิ์เข้าถึงโปรเจกต์ — ติดต่อผู้ดูแล หรือรัน npm run db:backfill-phase3
              </p>
            ) : null}
            <LoginForm />
          </div>
        </section>
      </div>
    </main>
  );
}
