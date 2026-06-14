/**
 * Rate limiter สำหรับการ login (in-memory, sliding window ต่อ username)
 * - กัน brute force / credential stuffing บนบัญชีที่รู้ชื่อ (เช่น admin, director)
 * - เพียงพอสำหรับ deploy แบบ instance เดียว (PM2 single instance)
 * - หากขยายเป็นหลาย instance ให้ย้ายไปใช้ Redis (src/server/cache/redis.ts)
 */
const WINDOW_MS = 15 * 60 * 1000; // 15 นาที
const MAX_FAILURES = 10; // ครั้งล้มเหลวสูงสุดต่อหน้าต่างเวลา

type Attempt = { count: number; firstAt: number };
const failures = new Map<string, Attempt>();

function keyOf(username: string) {
  return username.trim().toLowerCase();
}

/** true = ยังให้ลองได้, false = ถูกล็อกชั่วคราว */
export function isLoginAllowed(username: string): boolean {
  const rec = failures.get(keyOf(username));
  if (!rec) return true;
  if (Date.now() - rec.firstAt > WINDOW_MS) {
    failures.delete(keyOf(username));
    return true;
  }
  return rec.count < MAX_FAILURES;
}

export function recordLoginFailure(username: string): void {
  const key = keyOf(username);
  const now = Date.now();
  const rec = failures.get(key);
  if (!rec || now - rec.firstAt > WINDOW_MS) {
    failures.set(key, { count: 1, firstAt: now });
  } else {
    rec.count += 1;
  }
}

export function resetLoginAttempts(username: string): void {
  failures.delete(keyOf(username));
}
