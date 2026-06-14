import { describe, expect, it } from "vitest";
import { canEditCommitteeTask } from "../src/server/auth/committee-access";

const access = { committeeIds: ["c1"], isGlobalAdmin: false };
const task = { committee_id: "c1", owner_id: "u9" };

describe("canEditCommitteeTask", () => {
  it("allows a committee lead (task:manage) on tasks in their committee", () => {
    expect(canEditCommitteeTask({ id: "u1", roles: ["Committee Lead"] }, task, access)).toBe(true);
  });

  it("allows a task owner (task:update-own) on tasks in their committee", () => {
    expect(canEditCommitteeTask({ id: "u2", roles: ["Task Owner"] }, task, access)).toBe(true);
  });

  it("denies a committee member that holds no edit permission (e.g. Viewer)", () => {
    // behaviour change: committee membership alone no longer grants edit
    expect(canEditCommitteeTask({ id: "u3", roles: ["Viewer"] }, task, access)).toBe(false);
    expect(canEditCommitteeTask({ id: "u3b", roles: ["Finance Officer"] }, task, access)).toBe(false);
  });

  it("denies editing tasks outside the user's committees", () => {
    expect(
      canEditCommitteeTask({ id: "u4", roles: ["Committee Lead"] }, { committee_id: "other", owner_id: null }, access)
    ).toBe(false);
  });

  it("allows a global admin regardless of committee scope", () => {
    expect(
      canEditCommitteeTask({ id: "u5", roles: ["Super Admin"] }, { committee_id: "x", owner_id: null }, { committeeIds: [], isGlobalAdmin: true })
    ).toBe(true);
  });
});
