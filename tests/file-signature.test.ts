import { describe, expect, it } from "vitest";
import { detectEvidenceFileType } from "../src/lib/file-signature";

const bytes = (...values: number[]) => Uint8Array.from(values);
const text = (value: string) => new TextEncoder().encode(value);

describe("evidence file signature", () => {
  it("detects real PDF/JPEG/PNG/WEBP regardless of declared MIME", () => {
    expect(detectEvidenceFileType(text("%PDF-1.7 ..."), "application/octet-stream", "a.bin")?.mime).toBe("application/pdf");
    expect(detectEvidenceFileType(bytes(0xff, 0xd8, 0xff, 0xe0), "", "photo")?.ext).toBe(".jpg");
    expect(detectEvidenceFileType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a), "", "x")?.mime).toBe("image/png");
    expect(detectEvidenceFileType(text("RIFF\0\0\0\0WEBPVP8 "), "", "x")?.mime).toBe("image/webp");
  });

  it("rejects HTML/SVG disguised as an allowed type", () => {
    expect(detectEvidenceFileType(text("<html><script>alert(1)</script>"), "image/png", "x.png")).toBeNull();
    expect(detectEvidenceFileType(text("<svg onload=alert(1)>"), "image/svg+xml", "x.svg")).toBeNull();
  });

  it("accepts plain text only when declared as text and free of NUL bytes", () => {
    expect(detectEvidenceFileType(text("บันทึกการประชุม"), "text/plain", "note.txt")?.ext).toBe(".txt");
    expect(detectEvidenceFileType(bytes(0x41, 0x00, 0x42), "text/plain", "note.txt")).toBeNull();
    expect(detectEvidenceFileType(text("hello"), "application/octet-stream", "x.exe")).toBeNull();
  });
});
