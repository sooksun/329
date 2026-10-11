import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));

const access = (isGlobalAdmin = false) => ({ committeeIds: ["c1"], isGlobalAdmin });

describe("verify gate (separation of duties)", () => {
  it("lets a reviewer verify someone else's task", async () => {
    const { canVerifyTask } = await import("../src/server/permissions/assert");
    expect(canVerifyTask({ id: "rev", roles: ["Evidence Reviewer"] }, { reviewer_id: null, owner_id: "owner" }, access())).toBe(true);
  });

  it("blocks an owner with evidence:review from verifying their own task or subtask", async () => {
    const { canVerifyTask } = await import("../src/server/permissions/assert");
    const recorder = { id: "u1", roles: ["Data Recorder"] };
    expect(canVerifyTask(recorder, { reviewer_id: null, owner_id: "u1" }, access())).toBe(false);
    expect(canVerifyTask(recorder, { reviewer_id: null, owner_id: "other" }, access(), ["u1"])).toBe(false);
  });

  it("blocks plain editors and allows the project's global admin", async () => {
    const { canVerifyTask } = await import("../src/server/permissions/assert");
    expect(canVerifyTask({ id: "s", roles: ["Task Owner"] }, { reviewer_id: null, owner_id: "x" }, access())).toBe(false);
    expect(canVerifyTask({ id: "d", roles: ["Project Director"] }, { reviewer_id: null, owner_id: "d" }, access(true))).toBe(true);
  });
});
