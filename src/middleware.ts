import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/login" }
});

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
