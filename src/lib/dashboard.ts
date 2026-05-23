/**
 * @deprecated Use domain loaders under `src/server/project/loaders/*` instead.
 * Kept for backward compatibility during migration.
 */
import { getDashboardPageData } from "@/server/project/loaders/dashboard";

export async function getProjectData() {
  const data = await getDashboardPageData();
  if (!data) return null;
  return {
    ...data,
    currentUser: undefined
  };
}
