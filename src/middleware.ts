import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

const isApiPath = (pathname: string) => pathname.startsWith("/api/");

export default withAuth(
  function middleware(req) {
    // API ไม่มี session → 401 JSON (ไม่ redirect ไปหน้า login — client/แอปมือถือจะได้รู้ว่าต้อง login ใหม่)
    if (isApiPath(req.nextUrl.pathname) && (!req.nextauth.token || req.nextauth.token.revoked)) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }
    return NextResponse.next();
  },
  {
    pages: { signIn: "/login" },
    callbacks: {
      // หน้าเว็บที่ไม่มี token → redirect ไป /login; API ปล่อยเข้า middleware ด้านบนเพื่อตอบ 401
      authorized: ({ token, req }) => isApiPath(req.nextUrl.pathname) || Boolean(token && !token.revoked)
    }
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/tasks/:path*",
    "/evidence/:path*",
    "/budget/:path*",
    "/risks/:path*",
    "/meetings/:path*",
    "/committees/:path*",
    "/timeline/:path*",
    "/reports/:path*",
    "/audit-log/:path*",
    "/mobile/:path*",
    "/profile/:path*",
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/evidence/:path*",
    "/api/budget/:path*",
    "/api/committees/:path*",
    "/api/notifications/:path*",
    "/api/users/:path*",
    "/api/projects/:path*",
    "/api/tasks/:path*",
    "/api/subtasks/:path*",
    "/api/snapshots/:path*",
    "/api/reports/:path*",
    "/api/reports/jobs/:path*",
    "/api/files/:path*",
    "/api/risks/:path*",
    "/api/meetings/:path*",
    "/api/audit-logs/:path*"
  ]
};
