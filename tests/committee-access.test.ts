import { describe, expect, it } from "vitest";
import { canManageCommitteesGlobally } from "../src/server/committees/access";

describe("committee management access", () => {
  it("allows admin and secretary to manage committees globally", () => {
    expect(canManageCommitteesGlobally({ id: "a", roles: ["Super Admin"] })).toBe(true);
    expect(canManageCommitteesGlobally({ id: "s", roles: ["Project Secretary"] })).toBe(true);
    expect(canManageCommitteesGlobally({ id: "d", roles: ["Project Director"] })).toBe(true);
  });

  it("denies committee lead without global permission", () => {
    expect(canManageCommitteesGlobally({ id: "l", roles: ["Committee Lead"] })).toBe(false);
    expect(canManageCommitteesGlobally({ id: "t", roles: ["Task Owner"] })).toBe(false);
  });
});
