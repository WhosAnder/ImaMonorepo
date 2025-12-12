import type { Context } from "hono";
import { randomUUID } from "crypto";
import { createStorageService } from "./storage.service";
import { storagePolicies } from "./storage.policies";
import { createMulterAdapter } from "./adapters/multer-adapter";
import { createS3Adapter } from "./adapters/s3-adapter";

const shouldUseS3 = () => {
  const env = process.env.NODE_ENV || "development";
  const isProduction = env === "production";
  const hasAwsRegion = Boolean(process.env.AWS_REGION);
  return isProduction && hasAwsRegion;
};

const initializeStorageAdapter = () => {
  const env = process.env.NODE_ENV || "development";
  const hasAwsRegion = Boolean(process.env.AWS_REGION);
  const hasS3Bucket = Boolean(process.env.S3_BUCKET);
  
  console.log(`📦 Storage Module Configuration:`);
  console.log(`   Environment: ${env}`);
  console.log(`   AWS_REGION: ${hasAwsRegion ? process.env.AWS_REGION : "not set"}`);
  console.log(`   S3_BUCKET: ${hasS3Bucket ? process.env.S3_BUCKET : "not set"}`);
  
  if (shouldUseS3()) {
    try {
      const adapter = createS3Adapter();
      console.log(`   ✅ Using: S3 Storage Adapter`);
      return adapter;
    } catch (error) {
      console.warn("   ⚠️  S3 adapter initialization failed, falling back to local storage.", error);
      console.log(`   ✅ Using: Multer (Local) Storage Adapter`);
      return createMulterAdapter();
    }
  } else if (env === "production") {
    console.warn("   ⚠️  AWS credentials missing; using local storage adapter instead of S3.");
  }
  
  console.log(`   ✅ Using: Multer (Local) Storage Adapter`);
  return createMulterAdapter();
};

const storageAdapter = initializeStorageAdapter();

const storageService = createStorageService(storageAdapter);

type UploadEvidenceBody = {
  file: File;
  entityId?: string;
  category?: string;
  order?: string;
};

export async function uploadEvidenceController(c: Context) {
  try {
    const { file, entityId, category, order } = await c.req.parseBody<UploadEvidenceBody>();

    if (!file) {
      return c.json({ error: "File is required" }, 400);
    }

    const policies = storagePolicies();
    const policy = policies.evidence;

    if (file.size > policy.maxSize) {
      return c.json(
        { error: `File is too large. Max allowed size is ${Math.round(policy.maxSize / (1024 * 1024))}MB.` },
        400
      );
    }

    if (policy.allowedTypes.length && !policy.allowedTypes.includes(file.type)) {
      return c.json({ error: "Unsupported file type" }, 400);
    }

    const relationId = typeof entityId === "string" && entityId.trim().length > 0 ? entityId.trim() : randomUUID();
    const storeType = typeof category === "string" && category.trim().length > 0 ? category.trim() : "evidence";
    const index = typeof order === "string" ? Number.parseInt(order, 10) : undefined;

    const { url, fileName } = await storageService.uploadEvidence(file, relationId, storeType, index);

    return c.json({
      key: fileName,
      id: fileName,
      url,
      previewUrl: url,
    });
  } catch (error) {
    console.error("Error uploading evidence:", error);
    return c.json({ error: "File upload failed" }, 500);
  }
}
