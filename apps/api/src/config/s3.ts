import { S3Client } from "@aws-sdk/client-s3";

let cachedClient: S3Client | null = null;

export const getS3Client = () => {
  if (cachedClient) {
    return cachedClient;
  }

  const region = process.env.AWS_REGION;
  if (!region) {
    throw new Error("AWS_REGION environment variable is required");
  }

  const endpoint =
    process.env.AWS_S3_ENDPOINT ??
    process.env.S3_ENDPOINT ??
    process.env.AWS_ENDPOINT;
  if (!endpoint) {
    throw new Error("AWS_S3_ENDPOINT environment variable is required");
  }

  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  if (!accessKeyId) {
    throw new Error("AWS_ACCESS_KEY_ID environment variable is required");
  }

  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  if (!secretAccessKey) {
    throw new Error("AWS_SECRET_ACCESS_KEY environment variable is required");
  }

  cachedClient = new S3Client({
    region,
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return cachedClient;
};
