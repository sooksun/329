import { beforeEach, describe, expect, it, vi } from "vitest";

/** ข้อมูลจำลอง 2 องค์กร: director สังกัด org-a เท่านั้น */
const projects = [
  { id: "p-a", name: "A", edition: "2570", slug: "edition-2570", organization_id: "org-a", deleted_at: null },
  { id: "p-a2", name: "A2", edition: "2571", slug: "a2", organization_id: "org-a", deleted_at: null },
  { id: "p-b", name: "B", edition: "2570", slug: "b", organization_id: "org-b", deleted_at: null }
];
let orgMembers: { user_id: string; organization_id: string }[] = [];
let requestedCookie: string | undefined;

function toListRow(p: (typeof projects)[number]) {
  return { ...p, organization: { id: p.organization_id, slug: p.organization_id, name: p.organization_id } };
}

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => (requestedCookie ? { value: requestedCookie } : undefined) })
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    organizationMember: {
      findMany: async ({ where }: { where: { user_id: string } }) =>
        orgMembers.filter((m) => m.user_id === where.user_id)
    },
    committeeMember: { findMany: async () => [] },
    project: {
      findMany: async ({ where }: { where: { organization_id?: { in: string[] } } }) =>
        projects
          .filter((p) => !where.organization_id || where.organization_id.in.includes(p.organization_id))
          .map(toListRow),
      findFirst: async ({ where }: { where: { id: string } }) => projects.find((p) => p.id === where.id) ?? null
    }
  }
}));

const director = { id: "dir", roles: ["Project Director"] };

describe("tenant isolation", () => {
  beforeEach(() => {
    orgMembers = [{ user_id: "dir", organization_id: "org-a" }];
    requestedCookie = undefined;
  });

  it("grants global-admin powers only inside the director's own organization", async () => {
    const { getCommitteeAccessContext } = await import("../src/server/auth/committee-access");
    expect((await getCommitteeAccessContext(director, "p-a")).isGlobalAdmin).toBe(true);
    expect((await getCommitteeAccessContext(director, "p-b")).isGlobalAdmin).toBe(false);
  });

  it("gives a director without any organization no projects", async () => {
    orgMembers = [];
    const { listAccessibleProjects } = await import("../src/server/tenant/project-access");
    expect(await listAccessibleProjects({ id: "dir", roles: ["Project Director"] })).toEqual([]);
  });

  it("honors the project selection cookie when the project is accessible", async () => {
    requestedCookie = "p-a2";
    const { getActiveProjectForUser } = await import("../src/server/tenant/project-access");
    expect((await getActiveProjectForUser(director))?.id).toBe("p-a2");
  });

  it("ignores a selection cookie pointing at another tenant", async () => {
    requestedCookie = "p-b";
    const { getActiveProjectForUser } = await import("../src/server/tenant/project-access");
    expect((await getActiveProjectForUser(director))?.id).toBe("p-a");
  });
});
