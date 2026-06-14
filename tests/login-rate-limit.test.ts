import { describe, expect, it } from "vitest";
import { isLoginAllowed, recordLoginFailure, resetLoginAttempts } from "../src/server/auth/login-rate-limit";

describe("login rate limit", () => {
  it("allows attempts up to the max then blocks", () => {
    const u = "ratetest_user";
    resetLoginAttempts(u);
    for (let i = 0; i < 10; i++) {
      expect(isLoginAllowed(u)).toBe(true);
      recordLoginFailure(u);
    }
    expect(isLoginAllowed(u)).toBe(false);
    resetLoginAttempts(u);
  });

  it("reset clears the block (e.g. after a successful login)", () => {
    const u = "ratetest_user2";
    for (let i = 0; i < 12; i++) recordLoginFailure(u);
    expect(isLoginAllowed(u)).toBe(false);
    resetLoginAttempts(u);
    expect(isLoginAllowed(u)).toBe(true);
  });

  it("treats usernames case-insensitively", () => {
    const u = "MixedCase";
    resetLoginAttempts(u);
    for (let i = 0; i < 10; i++) recordLoginFailure("mixedcase");
    expect(isLoginAllowed("MIXEDCASE")).toBe(false);
    resetLoginAttempts(u);
  });
});
