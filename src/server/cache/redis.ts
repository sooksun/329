import Redis from "ioredis";

let client: Redis | null | undefined;

export function isRedisEnabled() {
  return Boolean(process.env.REDIS_URL?.trim());
}

export function getRedisClient() {
  if (client !== undefined) return client;
  const url = process.env.REDIS_URL?.trim();
  if (!url) {
    client = null;
    return client;
  }
  client = new Redis(url, {
    maxRetriesPerRequest: 2,
    lazyConnect: true
  });
  return client;
}

export function cacheTtlSeconds() {
  const raw = Number(process.env.CACHE_TTL_SECONDS ?? 120);
  return Number.isFinite(raw) && raw > 0 ? raw : 120;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = getRedisClient();
  if (!redis) return null;
  try {
    if (redis.status !== "ready") await redis.connect();
    const raw = await redis.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = cacheTtlSeconds()) {
  const redis = getRedisClient();
  if (!redis) return false;
  try {
    if (redis.status !== "ready") await redis.connect();
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
    return true;
  } catch {
    return false;
  }
}

export async function cacheDeletePattern(pattern: string) {
  const redis = getRedisClient();
  if (!redis) return;
  try {
    if (redis.status !== "ready") await redis.connect();
    const keys = await redis.keys(pattern);
    if (keys.length) await redis.del(...keys);
  } catch {
    /* optional cache */
  }
}
