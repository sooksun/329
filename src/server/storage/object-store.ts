import { createReadStream } from "node:fs";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client
} from "@aws-sdk/client-s3";
import { getUploadDir } from "@/lib/storage";
import { errors } from "@/lib/messages";
import { evidenceObjectKey, getStorageDriver, isS3Storage, reportObjectKey, s3Config } from "@/server/storage/config";

let s3Client: S3Client | null | undefined;

function getS3() {
  if (s3Client !== undefined) return s3Client;
  if (!isS3Storage()) {
    s3Client = null;
    return s3Client;
  }
  const cfg = s3Config();
  s3Client = new S3Client({
    region: cfg.region,
    endpoint: cfg.endpoint,
    forcePathStyle: cfg.forcePathStyle,
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey
    }
  });
  return s3Client;
}

export type StoredObject = {
  storageKey: string;
  storageProvider: "LOCAL" | "S3";
  byteSize: number;
};

export async function putObject(input: {
  projectId: string;
  kind: "evidence" | "report";
  filename: string;
  bytes: Buffer;
  mimeType: string;
}): Promise<StoredObject> {
  if (isS3Storage()) {
    const s3 = getS3();
    if (!s3) throw new Error(errors.storageUnavailable);
    const key = input.kind === "evidence" ? evidenceObjectKey(input.projectId, input.filename) : reportObjectKey(input.projectId, input.filename);
    const { bucket } = s3Config();
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: input.bytes,
        ContentType: input.mimeType
      })
    );
    return { storageKey: key, storageProvider: "S3", byteSize: input.bytes.length };
  }

  const uploadDir = getUploadDir();
  await mkdir(uploadDir, { recursive: true });
  const diskPath = path.join(uploadDir, input.filename);
  await writeFile(diskPath, input.bytes);
  const storageKey = path.relative(process.cwd(), diskPath).replaceAll("\\", "/");
  return { storageKey, storageProvider: "LOCAL", byteSize: input.bytes.length };
}

export async function readObjectBody(fileAsset: { storage_key: string; storage_provider: string; mime_type?: string }) {
  if (fileAsset.storage_provider === "S3" || (isS3Storage() && !fileAsset.storage_key.includes("\\"))) {
    const s3 = getS3();
    if (!s3) throw new Error(errors.storageUnavailable);
    const response = await s3.send(
      new GetObjectCommand({
        Bucket: s3Config().bucket,
        Key: fileAsset.storage_key
      })
    );
    const bytes = await response.Body?.transformToByteArray();
    if (!bytes) throw new Error(errors.fileEmptyStorage);
    return Buffer.from(bytes);
  }

  const uploadDir = path.resolve(getUploadDir());
  const absolute = path.isAbsolute(fileAsset.storage_key) ? fileAsset.storage_key : path.resolve(process.cwd(), fileAsset.storage_key);
  if (!absolute.startsWith(uploadDir)) throw new Error(errors.fileInvalidStorage);
  return readFile(absolute);
}

export async function openObjectStream(fileAsset: { storage_key: string; storage_provider: string }) {
  if (fileAsset.storage_provider === "S3") {
    const body = await readObjectBody(fileAsset);
    return Readable.toWeb(Readable.from(body)) as ReadableStream;
  }

  const uploadDir = path.resolve(getUploadDir());
  const absolute = path.isAbsolute(fileAsset.storage_key) ? fileAsset.storage_key : path.resolve(process.cwd(), fileAsset.storage_key);
  if (!absolute.startsWith(uploadDir)) throw new Error(errors.fileInvalidStorage);
  const fileStat = await stat(absolute);
  if (!fileStat.isFile()) throw new Error(errors.notAFile);
  return Readable.toWeb(createReadStream(absolute)) as ReadableStream;
}

export function storageStatus() {
  return {
    driver: getStorageDriver(),
    redis: Boolean(process.env.REDIS_URL),
    queue: Boolean(process.env.REDIS_URL) && process.env.REPORT_QUEUE_ENABLED !== "false"
  };
}
