import { cacheGet, cacheSet } from "@/server/cache/redis";

export async function withCache<T>(key: string, loader: () => Promise<T>): Promise<T> {
  const cached = await cacheGet<T>(key);
  if (cached !== null) return cached;
  const fresh = await loader();
  await cacheSet(key, fresh);
  return fresh;
}
