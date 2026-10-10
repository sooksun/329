/**
 * ตรวจชนิดไฟล์หลักฐานจาก "เนื้อไฟล์" (magic bytes) — ไม่เชื่อ MIME/นามสกุลที่ client ส่งมา
 * คืน null ถ้าไม่ใช่ PDF / JPEG / PNG / WEBP / ข้อความล้วน
 */
export type DetectedFileType = { mime: string; ext: string };

function startsWith(bytes: Uint8Array, signature: number[], offset = 0) {
  if (bytes.length < offset + signature.length) return false;
  return signature.every((byte, index) => bytes[offset + index] === byte);
}

const ascii = (text: string) => [...text].map((ch) => ch.charCodeAt(0));

export function detectEvidenceFileType(bytes: Uint8Array, declaredMime: string, filename: string): DetectedFileType | null {
  if (startsWith(bytes, ascii("%PDF-"))) return { mime: "application/pdf", ext: ".pdf" };
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return { mime: "image/jpeg", ext: ".jpg" };
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { mime: "image/png", ext: ".png" };
  if (startsWith(bytes, ascii("RIFF")) && startsWith(bytes, ascii("WEBP"), 8)) return { mime: "image/webp", ext: ".webp" };

  // ข้อความล้วน: ต้องประกาศเป็น text/plain หรือ .txt และไม่มี NUL byte (ไฟล์ไบนารีปลอมตัว)
  const claimsText = declaredMime === "text/plain" || filename.toLowerCase().endsWith(".txt");
  if (claimsText && !bytes.subarray(0, 8192).includes(0)) return { mime: "text/plain", ext: ".txt" };

  return null;
}
