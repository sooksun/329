import { cacheDeletePattern } from "@/server/cache/redis";
import { projectCachePattern } from "@/server/cache/keys";

export async function invalidateProjectCache(projectId: string) {
  await cacheDeletePattern(projectCachePattern(projectId));
}
