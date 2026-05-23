import path from "node:path";

/** @deprecated Prefer `src/server/storage/object-store` */
export function getUploadDir() {
  const configured = process.env.UPLOAD_DIR ?? "./storage/uploads";
  return path.isAbsolute(configured) ? configured : path.resolve(process.cwd(), configured);
}

export { storageStatus } from "@/server/storage/object-store";
