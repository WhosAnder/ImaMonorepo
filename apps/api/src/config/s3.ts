import { S3Client } from "@aws-sdk/client-s3";

let cachedClient: S3Client | null = null;

/**
 * Get S3 endpoint from various env var names
 */
const getS3Endpoint = () =>
  process.env.S3_ENDPOINT ??
  process.env.AWS_S3_ENDPOINT ??
  process.env.AWS_ENDPOINT;

/**
 * Get S3 region from various env var names
 */
const getS3Region = () =>
  process.env.S3_REGION ??
  process.env.AWS_REGION ??
  "auto";

/**
 * Get S3 credentials from env vars (supports both AWS_* and S3_* naming)
 */
const getS3Credentials = () => ({
  accessKeyId:
    process.env.S3_ACCESS_KEY_ID ??
    process.env.AWS_ACCESS_KEY_ID ??
    "",
  secretAccessKey:
    process.env.S3_SECRET_ACCESS_KEY ??
    process.env.AWS_SECRET_ACCESS_KEY ??
    "",
});

/**
 * Get bucket name from env
 */
export const getS3Bucket = () => process.env.S3_BUCKET ?? "";

/**
 * Check if S3 is properly configured
 */
export const isS3Configured = () => {
  const endpoint = getS3Endpoint();
  const bucket = getS3Bucket();
  const creds = getS3Credentials();
  return Boolean(endpoint && bucket && creds.accessKeyId && creds.secretAccessKey);
};

/**
 * Get or create cached S3Client configured for S3-compatible endpoints (Railway, MinIO, etc.)
 */
export const getS3Client = (): S3Client => {
  if (cachedClient) {
    return cachedClient;
  }

  const region = getS3Region();
  const endpoint = getS3Endpoint();
  
  if (!endpoint) {
    throw new Error("S3 endpoint not configured. Set S3_ENDPOINT or AWS_S3_ENDPOINT env var.");
  }

  const credentials = getS3Credentials();

  cachedClient = new S3Client({
    region,
    endpoint,
    credentials,
    // Required for S3-compatible providers like Railway, MinIO, etc.
    forcePathStyle: true,
  });

  console.log(`✅ S3 Client initialized: ${endpoint} (region: ${region})`);
  return cachedClient;
};

// ============================================================================
// EVIDENCE-SPECIFIC CONFIG
// ============================================================================

/**
 * Get max evidence file size in bytes from env (default 20MB)
 * Uses EVIDENCES_MAX_SIZE_MB, falls back to FILES_MAX_SIZE_MB for backward compat
 */
export const getMaxEvidenceSizeBytes = () => {
  const mb = parseInt(
    process.env.EVIDENCES_MAX_SIZE_MB ?? 
    process.env.FILES_MAX_SIZE_MB ?? 
    "20", 
    10
  );
  return mb * 1024 * 1024;
};

/**
 * Get allowed MIME types for evidences from env (images only by default)
 * Uses EVIDENCES_ALLOWED_MIME, falls back to FILES_ALLOWED_MIME
 */
export const getAllowedEvidenceMimeTypes = (): string[] => {
  const mimes = 
    process.env.EVIDENCES_ALLOWED_MIME ?? 
    process.env.FILES_ALLOWED_MIME ?? 
    "image/png,image/jpeg,image/webp";
  return mimes.split(",").map(m => m.trim()).filter(Boolean);
};

// Legacy aliases for backward compatibility
export const getMaxFileSizeBytes = getMaxEvidenceSizeBytes;
export const getAllowedMimeTypes = getAllowedEvidenceMimeTypes;
