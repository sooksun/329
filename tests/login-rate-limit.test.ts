import { describe, expect, it } from "vitest";
import {
  clientIpFromHeaders,
  isLoginAllowed,
  recordLoginFailure,
  resetLoginAttempts
} from "../src/server/auth/login-rate-limit";

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

describe("login rate limit per IP", () => {
  it("does not let an attacker on one IP lock the owner out on another IP", () => {
    const u = "admin_iptest";
    for (let i = 0; i < 12; i++) recordLoginFailure(u, "203.0.113.9");
    expect(isLoginAllowed(u, "203.0.113.9")).toBe(false);
    expect(isLoginAllowed(u, "198.51.100.7")).toBe(true);
    resetLoginAttempts(u, "203.0.113.9");
  });

  it("caps total failures from one IP across many usernames", () => {
    const ip = "203.0.113.50";
    for (let i = 0; i < 50; i++) recordLoginFailure(`stuff_${i}`, ip);
    expect(isLoginAllowed("someone_new", ip)).toBe(false);
    expect(isLoginAllowed("someone_new", "198.51.100.8")).toBe(true);
  });

  it("reads the client IP from proxy headers", () => {
    expect(clientIpFromHeaders({ "x-real-ip": "198.51.100.2" })).toBe("198.51.100.2");
    expect(clientIpFromHeaders(undefined)).toBe("unknown");
  });

  it("ignores a client-spoofed first X-Forwarded-For hop", () => {
    // nginx ต่อท้าย IP จริงไว้ตัวสุดท้าย — ค่าแรกมาจาก client และปลอมได้
    expect(clientIpFromHeaders({ "x-forwarded-for": "1.2.3.4, 198.51.100.9" })).toBe("198.51.100.9");
  });

  it("caps failures for one account even when the attacker rotates IPs", () => {
    const u = "rotating_target";
    for (let i = 0; i < 50; i++) recordLoginFailure(u, `203.0.113.${i}`);
    expect(isLoginAllowed(u, "198.51.100.77")).toBe(false);
    resetLoginAttempts(u, "198.51.100.77");
    expect(isLoginAllowed(u, "198.51.100.77")).toBe(true);
  });
});
