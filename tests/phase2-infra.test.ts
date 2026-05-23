import { describe, expect, it } from "vitest";
import { projectDashboardKey, projectShellKey } from "../src/server/cache/keys";
import { getStorageDriver, evidenceObjectKey } from "../src/server/storage/config";
import { isReportQueueEnabled } from "../src/server/queue/report-queue";

describe("Phase 2 infrastructure", () => {
  it("builds stable cache keys", () => {
    expect(projectDashboardKey("p1")).toBe("mis:v1:project:p1:dashboard");
    expect(projectShellKey("p1")).toBe("mis:v1:project:p1:shell");
  });

  it("defaults to local storage driver", () => {
    const prev = process.env.STORAGE_DRIVER;
    delete process.env.STORAGE_DRIVER;
    expect(getStorageDriver()).toBe("local");
    process.env.STORAGE_DRIVER = prev;
  });

  it("builds s3 object keys by project", () => {
    expect(evidenceObjectKey("proj", "a.png")).toBe("projects/proj/evidence/a.png");
  });

  it("disables queue without redis url", () => {
    const prev = process.env.REDIS_URL;
    delete process.env.REDIS_URL;
    expect(isReportQueueEnabled()).toBe(false);
    process.env.REDIS_URL = prev;
  });
});
