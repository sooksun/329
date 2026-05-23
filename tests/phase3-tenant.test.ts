import { describe, expect, it } from "vitest";
import { MIS_PROJECT_COOKIE, MIS_PROJECT_COOKIE_MAX_AGE } from "../src/lib/tenant-cookies";
import { isGlobalTaskAdmin } from "../src/server/auth/committee-access";
import { pickDefaultProjectId, sortAccessibleProjects } from "../src/server/tenant/project-access";

describe("Phase 3 multi-tenant", () => {
  it("defines stable project cookie name", () => {
    expect(MIS_PROJECT_COOKIE).toBe("mis_project_id");
    expect(MIS_PROJECT_COOKIE_MAX_AGE).toBeGreaterThan(0);
  });

  it("treats director as global task admin", () => {
    expect(isGlobalTaskAdmin({ id: "u1", roles: ["Project Director"] })).toBe(true);
  });

  it("does not treat data recorder as global admin", () => {
    expect(isGlobalTaskAdmin({ id: "u2", roles: ["Data Recorder", "Task Owner"] })).toBe(false);
  });

  it("treats project secretary as global task admin", () => {
    expect(isGlobalTaskAdmin({ id: "u3", roles: ["Project Secretary"] })).toBe(true);
  });

  it("prefers edition-2570 over demo project for default selection", () => {
    const projects = sortAccessibleProjects([
      {
        id: "demo",
        slug: "edition-2571-demo",
        name: "Demo",
        edition: "2571",
        organization: { id: "o1", slug: "org", name: "Org" }
      },
      {
        id: "main",
        slug: "edition-2570",
        name: "Main",
        edition: "2570",
        organization: { id: "o1", slug: "org", name: "Org" }
      }
    ]);
    expect(projects[0]?.slug).toBe("edition-2570");
    expect(pickDefaultProjectId(projects)).toBe("main");
  });
});
