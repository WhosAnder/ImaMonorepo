import { API_URL, S3_PRESIGNER_BASE } from "@/config/env";

const buildStorageEvidenceUrl = (key: string) => {
  const filename = key.split("/").pop() || key;
  console.log("filename", filename);
  return `${S3_PRESIGNER_BASE}/${filename}`;
};

const buildUploadUrl = (filename: string) => `${API_URL}/upload/${filename}`;

const extractUploadFilename = (value: string) => {
  const uploadIndex = value.indexOf("/upload/");
  if (uploadIndex !== -1) {
    return value.substring(uploadIndex + "/upload/".length);
  }
  return value.replace(/^\/+upload\//i, "");
};

const looksLikeUploadPath = (value: string) =>
  value.includes("/upload/") || value.startsWith("/upload/");

const isHttpUrl = (value: string) => /^https?:\/\//i.test(value);

const extractS3KeyFromUrl = (value: string) => {
  try {
    const parsed = new URL(value);
    const host = parsed.hostname.toLowerCase();
    const isBucketHost =
      host.includes(".s3.") ||
      host.endsWith(".storage.railway.app") ||
      host === "storage.railway.app";

    if (!isBucketHost) {
      return null;
    }

    let path = decodeURIComponent(parsed.pathname || "");
    path = path.replace(/^\/+/, "");
    return path || null;
  } catch {
    return null;
  }
};

const resolveValue = (value?: string): string | undefined => {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return trimmed;
  }

  if (looksLikeUploadPath(trimmed)) {
    const filename = extractUploadFilename(trimmed);
    return buildUploadUrl(filename);
  }

  if (isHttpUrl(trimmed)) {
    const s3Key = extractS3KeyFromUrl(trimmed);
    if (s3Key) {
      return buildStorageEvidenceUrl(s3Key);
    }
    return trimmed;
  }

  return buildStorageEvidenceUrl(trimmed);
};

export type EvidenceLike =
  | string
  | { id?: string; url?: string; previewUrl?: string; key?: string };

export const resolveEvidenceUrl = (item: EvidenceLike): string | undefined => {
  if (typeof item === "string") {
    return resolveValue(item);
  }

  if (item.key) {
    return buildStorageEvidenceUrl(item.key);
  }

  if (item.id) {
    return buildStorageEvidenceUrl(item.id);
  }

  const previewCandidate = resolveValue(item.previewUrl);
  if (previewCandidate) {
    return previewCandidate;
  }

  return resolveValue(item.url);
};
