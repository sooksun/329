import { describe, expect, it } from "vitest";
import { formatThaiDate, formatThaiDateLong, formatThaiDateTime } from "../src/lib/format-date";

describe("format-date Buddhist Era", () => {
  const sample = new Date("2027-03-29T14:30:00+07:00");

  it("formats date with BE year", () => {
    expect(formatThaiDate(sample)).toMatch(/2570/);
    expect(formatThaiDateLong(sample)).toMatch(/2570/);
  });

  it("formats datetime with BE year", () => {
    expect(formatThaiDateTime(sample)).toMatch(/2570/);
    expect(formatThaiDateTime(sample)).toMatch(/14:30/);
  });

  it("returns dash for empty", () => {
    expect(formatThaiDate(null)).toBe("—");
  });
});
