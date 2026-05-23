export type StorageDriver = "local" | "s3";

export function getStorageDriver(): StorageDriver {
  return process.env.STORAGE_DRIVER === "s3" ? "s3" : "local";
}

export function isS3Storage() {
  return getStorageDriver() === "s3";
}

export function s3Config() {
  return {
    bucket: process.env.S3_BUCKET ?? "mis-uploads",
    region: process.env.S3_REGION ?? "us-east-1",
    endpoint: process.env.S3_ENDPOINT,
    accessKeyId: process.env.S3_ACCESS_KEY ?? "minioadmin",
    secretAccessKey: process.env.S3_SECRET_KEY ?? "minioadmin",
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== "false"
  };
}

export function evidenceObjectKey(projectId: string, filename: string) {
  return `projects/${projectId}/evidence/${filename}`;
}

export function reportObjectKey(projectId: string, filename: string) {
  return `projects/${projectId}/reports/${filename}`;
}
