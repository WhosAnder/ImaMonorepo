import type { Context } from "hono";
import { randomUUID } from "crypto";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "node:stream";
import { createReadStream, existsSync } from "node:fs";
import { join } from "node:path";
import { createStorageService } from "./storage.service";
import { storagePolicies } from "./storage.policies";
import { createMulterAdapter } from "./adapters/multer-adapter";
import { createS3Adapter } from "./adapters/s3-adapter";
import { getS3Client } from "../../config/s3";
import { getUploadDir } from "../../config/multer";

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

// ... (existing imports)
import { 
  createPresignedUpload, 
  confirmUploadWithVerification, 
  createPresignedDownload,
  listEvidencesByReport
} from "./storage.service";
import { 
  presignUploadRequestSchema, 
  confirmUploadRequestSchema, 
  presignDownloadRequestSchema,
  validateUploadRequest 
} from "./storage.schema";
import { storageRepo } from "./storage.repo";
import { isS3Configured } from "../../config/s3";

// ... (existing code for uploadEvidenceController)

export async function presignUploadController(c: Context) {
  try {
    const body = await c.req.json();
    
    const parseResult = presignUploadRequestSchema.safeParse(body);
    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0];
      return c.json({ error: firstError?.message || "Invalid request" }, 400);
    }
    
    const data = parseResult.data;
    
    const validation = validateUploadRequest(data);
    if (!validation.success) {
      return c.json({ error: validation.error }, 400);
    }
    
    if (!isS3Configured()) {
      return c.json({ error: "Storage not configured" }, 503);
    }
    
    const result = await createPresignedUpload({
      reportId: data.reportId,
      reportType: data.reportType,
      originalName: data.originalName,
      mimeType: data.mimeType,
      size: data.size,
    });
    
    return c.json(result);
  } catch (error) {
    console.error("Error creating presigned upload:", error);
    const message = error instanceof Error ? error.message : "Failed to create upload URL";
    const status = message.includes("not found") ? 404 : 500;
    return c.json({ error: message }, status);
  }
}

export async function confirmUploadController(c: Context) {
  try {
    const body = await c.req.json();
    
    const parseResult = confirmUploadRequestSchema.safeParse(body);
    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0];
      return c.json({ error: firstError?.message || "Invalid request" }, 400);
    }
    
    const { fileId } = parseResult.data;
    
    const success = await confirmUploadWithVerification(fileId);
    
    if (success) {
      const evidence = await storageRepo.findById(fileId);
      return c.json({ 
        success: true,
        evidence: evidence ? {
          id: evidence._id?.toString(),
          key: evidence.key,
          originalName: evidence.originalName,
          status: evidence.status,
        } : null,
      });
    } else {
      return c.json({ error: "Failed to confirm upload" }, 500);
    }
  } catch (error) {
    console.error("Error confirming upload:", error);
    const message = error instanceof Error ? error.message : "Failed to confirm upload";
    return c.json({ error: message }, 500);
  }
}

export async function presignDownloadController(c: Context) {
  try {
    const body = await c.req.json();
    
    const parseResult = presignDownloadRequestSchema.safeParse(body);
    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0];
      return c.json({ error: firstError?.message || "Invalid request" }, 400);
    }
    
    const data = parseResult.data;
    
    if (!isS3Configured()) {
      return c.json({ error: "Storage not configured" }, 503);
    }
    
    const result = await createPresignedDownload({
      fileId: data.fileId,
      key: data.key,
    });
    
    return c.json(result);
  } catch (error) {
    console.error("Error creating presigned download:", error);
    const message = error instanceof Error ? error.message : "Failed to create download URL";
    const status = message === "Evidence not found" ? 404 : 500;
    return c.json({ error: message }, status);
  }
}

export async function listEvidencesController(c: Context) {
  try {
    const reportId = c.req.param("reportId");
    const includePending = c.req.query("includePending") === "true";
    
    if (!reportId) {
      return c.json({ error: "reportId is required" }, 400);
    }
    
    const evidences = await listEvidencesByReport(reportId, includePending);
    
    return c.json({
      reportId,
      count: evidences.length,
      evidences: evidences.map((e) => ({
        id: e._id?.toString(),
        key: e.key,
        originalName: e.originalName,
        mimeType: e.mimeType,
        size: e.size,
        subsystem: e.subsystem,
        datePath: e.datePath,
        status: e.status,
        createdAt: e.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error listing evidences:", error);
    return c.json({ error: "Failed to list evidences" }, 500);
  }
}

// ============================================================================
// HELPERS
// ============================================================================

const contentTypeMap: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  mp4: "video/mp4",
  mpeg: "video/mpeg",
  mov: "video/quicktime",
  avi: "video/x-msvideo",
};

const resolveContentType = (filename: string, fallback?: string) => {
  if (fallback) {
    return fallback;
  }
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  return contentTypeMap[ext] || "application/octet-stream";
};

const toWebStream = (body: unknown) => {
  if (!body) {
    return null;
  }
  if (body instanceof Readable) {
    return Readable.toWeb(body);
  }
  if (typeof (body as any).transformToWebStream === "function") {
    return (body as any).transformToWebStream();
  }
  return null;
};

const bodyToUint8Array = async (body: unknown) => {
  if (!body) {
    return null;
  }
  if (body instanceof Uint8Array) {
    return body;
  }
  if (Buffer.isBuffer(body)) {
    return new Uint8Array(body);
  }
  if (typeof body === "string") {
    return new TextEncoder().encode(body);
  }
  if (body instanceof Readable) {
    const chunks: Uint8Array[] = [];
    for await (const chunk of body) {
      chunks.push(typeof chunk === "string" ? new TextEncoder().encode(chunk) : chunk);
    }
    return new Uint8Array(Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))));
  }
  if (typeof (body as any).arrayBuffer === "function") {
    const buffer = await (body as any).arrayBuffer();
    return new Uint8Array(buffer);
  }
  if (typeof (body as any).transformToByteArray === "function") {
    const data = await (body as any).transformToByteArray();
    return data instanceof Uint8Array ? data : new Uint8Array(data);
  }
  return null;
};

const buildDownloadHeaders = (key: string, contentType?: string, contentLength?: number | bigint) => {
  const headers: Record<string, string> = {
    "Content-Type": resolveContentType(key, contentType),
    "Cache-Control": "public, max-age=300",
  };

  if (typeof contentLength === "number") {
    headers["Content-Length"] = String(contentLength);
  } else if (typeof contentLength === "bigint") {
    headers["Content-Length"] = contentLength.toString();
  }

  return headers;
};

export async function getEvidenceController(c: Context) {
  const key = c.req.param("key");
  if (!key) {
    return c.json({ error: "Evidence key is required" }, 400);
  }

  if (shouldUseS3()) {
    try {
      const bucket = process.env.S3_BUCKET;
      if (!bucket) {
        throw new Error("S3_BUCKET environment variable is required");
      }
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });
      const result = await getS3Client().send(command);

      if (!result.Body) {
        return c.json({ error: "Evidence not found" }, 404);
      }

      const headers = buildDownloadHeaders(key, result.ContentType, result.ContentLength);
      const stream = toWebStream(result.Body);
      if (stream) {
        return new Response(stream, { headers });
      }

      const buffer = await bodyToUint8Array(result.Body);
      if (!buffer) {
        return c.json({ error: "Evidence not found" }, 404);
      }
      return new Response(buffer, { headers });
    } catch (error) {
      console.error("Error fetching S3 evidence:", error);
      const status = (error as any)?.$metadata?.httpStatusCode;
      if (status === 404) {
        return c.json({ error: "Evidence not found" }, 404);
      }
      return c.json({ error: "Unable to fetch evidence" }, 500);
    }
  }

  const filePath = join(getUploadDir(), key);
  if (!existsSync(filePath)) {
    return c.json({ error: "Evidence not found" }, 404);
  }

  const stream = createReadStream(filePath);
  const headers = buildDownloadHeaders(key);
  return new Response(Readable.toWeb(stream) as ReadableStream, { headers });
}

