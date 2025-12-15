import { PutObjectCommand } from "@aws-sdk/client-s3";
import { URL } from "node:url";
import { getS3Client } from "../../../config/s3";
import type {
  StorageAdapter,
  UploadResult,
  CreateStorageAdapter,
} from "./storage-interface";

const getS3Endpoint = () =>
  process.env.AWS_S3_ENDPOINT ??
  process.env.S3_ENDPOINT ??
  process.env.AWS_ENDPOINT;

const validateS3Config = () => {
  const bucket = process.env.S3_BUCKET;
  const region = process.env.AWS_REGION;
  const endpoint = getS3Endpoint();

  if (!bucket) {
    throw new Error("S3_BUCKET environment variable is required");
  }
  if (!region) {
    throw new Error("AWS_REGION environment variable is required");
  }
  if (!endpoint) {
    throw new Error("AWS_S3_ENDPOINT environment variable is required");
  }

  return { bucket, endpoint };
};

const uploadFileToS3 = async (
  file: File,
  fileName: string,
  contentType: string,
  bucket: string,
  endpoint: string,
): Promise<UploadResult> => {
  try {
    const s3Client = getS3Client();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const uploadParams = {
      Bucket: bucket,
      Key: fileName,
      Body: buffer,
      ContentType: contentType,
    };

    await s3Client.send(new PutObjectCommand(uploadParams));

    const objectUrl = new URL(endpoint);
    objectUrl.hostname = `${bucket}.${objectUrl.hostname}`;
    const basePath =
      objectUrl.pathname === "/" ? "" : objectUrl.pathname.replace(/\/$/, "");
    objectUrl.pathname = `${basePath}/${fileName}`.replace(/\/{2,}/g, "/");
    const url = objectUrl.toString();

    return {
      url,
      key: fileName,
      size: buffer.length,
    };
  } catch (error) {
    console.error("S3 upload failed:", error);
    throw new Error(
      `S3 upload failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
};

export const createS3Adapter: CreateStorageAdapter = (): StorageAdapter => {
  const { bucket, endpoint } = validateS3Config();

  return {
    uploadFile: (file: File, fileName: string, contentType: string) =>
      uploadFileToS3(file, fileName, contentType, bucket, endpoint),
  };
};
