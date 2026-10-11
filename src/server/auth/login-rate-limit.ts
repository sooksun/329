/**
 * Rate limiter สำหรับการ login (in-memory, fixed window)
 * - ล็อกต่อ (username + IP): กัน brute force บัญชีที่รู้ชื่อ โดยผู้โจมตีจาก IP อื่น
 *   "ล็อกบัญชีคนอื่น" (เช่น admin) ไม่ได้อีก — เจ้าของบัญชีจาก IP ตัวเองยัง login ได้
 * - จำกัดรวมต่อ IP: กัน credential stuffing ไล่หลายบัญชีจาก IP เดียว
 * - เพียงพอสำหรับ deploy แบบ instance เดียว (PM2 single instance)
 * - หากขยายเป็นหลาย instance ให้ย้ายไปใช้ Redis (src/server/cache/redis.ts)
 */
const WINDOW_MS = 15 * 60 * 1000; // 15 นาที
const MAX_FAILURES = 10; // ครั้งล้มเหลวสูงสุดต่อ username+IP ต่อหน้าต่างเวลา
const MAX_FAILURES_PER_IP = 50; // ครั้งล้มเหลวสูงสุดต่อ IP (ทุกบัญชีรวมกัน)
// เพดานต่อบัญชีไม่ว่ามาจาก IP ใด — กันยิงรหัสผ่านบัญชีเดียวแบบกระจายหลาย IP (สูงพอที่จะไม่ถูกใช้กลั่นแกล้งง่ายๆ)
const MAX_FAILURES_PER_USER_ANY_IP = 50;

type Attempt = { count: number; firstAt: number };
const failures = new Map<string, Attempt>();

function userKey(username: string, ip: string) {
  return `u:${username.trim().toLowerCase()}|${ip}`;
}

function ipKey(ip: string) {
  return `ip:${ip}`;
}

function anyIpKey(username: string) {
  return `ua:${username.trim().toLowerCase()}`;
}

function underLimit(key: string, max: number) {
  const rec = failures.get(key);
  if (!rec) return true;
  if (Date.now() - rec.firstAt > WINDOW_MS) {
    failures.delete(key);
    return true;
  }
  return rec.count < max;
}

function bump(key: string) {
  const now = Date.now();
  const rec = failures.get(key);
  if (!rec || now - rec.firstAt > WINDOW_MS) {
    failures.set(key, { count: 1, firstAt: now });
  } else {
    rec.count += 1;
  }
}

/** true = ยังให้ลองได้, false = ถูกล็อกชั่วคราว */
export function isLoginAllowed(username: string, ip = ""): boolean {
  return (
    underLimit(userKey(username, ip), MAX_FAILURES) &&
    underLimit(anyIpKey(username), MAX_FAILURES_PER_USER_ANY_IP) &&
    (!ip || underLimit(ipKey(ip), MAX_FAILURES_PER_IP))
  );
}

export function recordLoginFailure(username: string, ip = ""): void {
  bump(userKey(username, ip));
  bump(anyIpKey(username));
  if (ip) bump(ipKey(ip));
}

export function resetLoginAttempts(username: string, ip = ""): void {
  failures.delete(userKey(username, ip));
  failures.delete(anyIpKey(username));
}

const firstHeader = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)?.trim();

/**
 * IP ผู้ใช้หลัง reverse proxy (Nginx Proxy Manager ตั้ง X-Real-IP = $remote_addr ทับค่าจาก client เสมอ)
 * ห้ามใช้ค่าแรกของ X-Forwarded-For — client ปลอมได้ (nginx ต่อท้าย IP จริงไว้ "ตัวสุดท้าย")
 */
export function clientIpFromHeaders(headers: Record<string, string | string[] | undefined> | undefined): string {
  const realIp = firstHeader(headers?.["x-real-ip"]);
  if (realIp) return realIp;
  const lastForwarded = firstHeader(headers?.["x-forwarded-for"])?.split(",").pop()?.trim();
  return lastForwarded || "unknown";
}
