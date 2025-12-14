import { Hono } from "hono";
import {
  createPresignedUpload,
  createPresignedDownload,
  listEvidencesByReport,
  confirmUploadWithVerification,
} from "./evidences.service";
import {
  presignUploadRequestSchema,
  presignDownloadRequestSchema,
  confirmUploadRequestSchema,
  validateUploadRequest,
} from "./evidences.schema";
import { isS3Configured } from "../../config/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getS3Client, getS3Bucket } from "../../config/s3";
import { Readable } from "node:stream";
import { evidencesRepo } from "./evidences.repo";
import { explorerList, explorerSearch, explorerStats } from "./evidences.explorer";

export const evidencesRoute = new Hono();

/**
 * GET /api/evidences/health
 * Health check for evidences module
 */
evidencesRoute.get("/health", (c) => {
  return c.json({
    ok: true,
    s3Configured: isS3Configured(),
    bucket: getS3Bucket() ? "configured" : "missing",
  });
});

/**
 * POST /api/evidences/presign-upload
 * Request a presigned POST URL for direct browser upload of evidence images.
 * 
 * Request: { reportId, reportType, originalName, mimeType, size }
 * - reportId and reportType are MANDATORY
 * - Server looks up report to get subsystem and date
 * - Builds hierarchical key: evidences/{type}/{subsystem}/{date}/{reportId}/{uuid}-{file}
 * - Only image/* MIME types allowed
 */
evidencesRoute.post("/presign-upload", async (c) => {
  try {
    const body = await c.req.json();
    
    // Validate request structure
    const parseResult = presignUploadRequestSchema.safeParse(body);
    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0];
      return c.json({ error: firstError?.message || "Invalid request" }, 400);
    }
    
    const data = parseResult.data;
    
    // Validate MIME type and size (only images allowed)
    const validation = validateUploadRequest(data);
    if (!validation.success) {
      return c.json({ error: validation.error }, 400);
    }
    
    // Check S3 configuration
    if (!isS3Configured()) {
      return c.json({ error: "Storage not configured" }, 503);
    }
    
    // Create presigned upload (includes report lookup and key building)
    const result = await createPresignedUpload({
      reportId: data.reportId,
      reportType: data.reportType,
      originalName: data.originalName,
      mimeType: data.mimeType,
      size: data.size,
      // TODO: Get createdBy from auth context
    });
    
    return c.json(result);
  } catch (error) {
    console.error("Error creating presigned upload:", error);
    const message = error instanceof Error ? error.message : "Failed to create upload URL";
    const status = message.includes("not found") ? 404 : 500;
    return c.json({ error: message }, status);
  }
});

/**
 * POST /api/evidences/confirm-upload
 * Confirm that an evidence upload completed successfully.
 * - Verifies file exists in S3 via HEAD
 * - Marks record as "uploaded"
 */
evidencesRoute.post("/confirm-upload", async (c) => {
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
      const evidence = await evidencesRepo.findById(fileId);
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
});

/**
 * POST /api/evidences/presign-download
 * Request a presigned GET URL for secure evidence download.
 */
evidencesRoute.post("/presign-download", async (c) => {
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
});

/**
 * GET /api/evidences/report/:reportId
 * List all uploaded evidences for a specific report.
 * Query: ?includePending=true to include pending evidences (admin only)
 */
evidencesRoute.get("/report/:reportId", async (c) => {
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
});

/**
 * GET /api/evidences/proxy/*
 * Proxy endpoint to stream evidence from S3 with auth.
 */
evidencesRoute.get("/proxy/*", async (c) => {
  try {
    const key = c.req.path.replace("/api/evidences/proxy/", "");
    
    if (!key) {
      return c.json({ error: "Evidence key is required" }, 400);
    }
    
    const evidenceRecord = await evidencesRepo.findByKey(key);
    if (!evidenceRecord || evidenceRecord.status === "deleted") {
      return c.json({ error: "Evidence not found" }, 404);
    }
    
    const bucket = getS3Bucket();
    if (!bucket) {
      return c.json({ error: "Storage not configured" }, 503);
    }
    
    const client = getS3Client();
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    
    const result = await client.send(command);
    
    if (!result.Body) {
      return c.json({ error: "Evidence not found in storage" }, 404);
    }
    
    const headers: Record<string, string> = {
      "Content-Type": evidenceRecord.mimeType || "application/octet-stream",
      "Cache-Control": "private, max-age=300",
      "Content-Disposition": `inline; filename="${evidenceRecord.originalName}"`,
    };
    
    if (result.ContentLength) {
      headers["Content-Length"] = String(result.ContentLength);
    }
    
    if (result.Body instanceof Readable) {
      return new Response(Readable.toWeb(result.Body) as ReadableStream, { headers });
    }
    
    if (typeof (result.Body as any).transformToWebStream === "function") {
      return new Response((result.Body as any).transformToWebStream(), { headers });
    }
    
    const buffer = await (result.Body as any).transformToByteArray();
    return new Response(buffer, { headers });
  } catch (error) {
    console.error("Error proxying evidence:", error);
    const status = (error as any)?.$metadata?.httpStatusCode;
    if (status === 404) {
      return c.json({ error: "Evidence not found" }, 404);
    }
    return c.json({ error: "Failed to fetch evidence" }, 500);
  }
});

// ============================================================================
// EXPLORER ENDPOINTS
// ============================================================================

/**
 * GET /api/evidences/explorer/list
 * Lazy-load folder contents based on navigation path.
 * Query: subsystemSlug?, year?, month?, day?, reportType?, reportId?
 */
evidencesRoute.get("/explorer/list", async (c) => {
  try {
    const yearStr = c.req.query("year");
    const monthStr = c.req.query("month");
    const dayStr = c.req.query("day");

    const params = {
      subsystemSlug: c.req.query("subsystemSlug") || undefined,
      year: yearStr ? parseInt(yearStr, 10) : undefined,
      month: monthStr ? parseInt(monthStr, 10) : undefined,
      day: dayStr ? parseInt(dayStr, 10) : undefined,
      reportType: c.req.query("reportType") || undefined,
      reportId: c.req.query("reportId") || undefined,
    };

    const result = await explorerList(params);
    return c.json(result);
  } catch (error) {
    console.error("Error in explorer list:", error);
    return c.json({ error: "Failed to list items" }, 500);
  }
});

/**
 * GET /api/evidences/explorer/search
 * Search evidences across all folders.
 * Query: q, subsystemSlug?, reportType?, dateFrom?, dateTo?
 */
evidencesRoute.get("/explorer/search", async (c) => {
  try {
    const params = {
      q: c.req.query("q") || undefined,
      subsystemSlug: c.req.query("subsystemSlug") || undefined,
      reportType: c.req.query("reportType") || undefined,
      dateFrom: c.req.query("dateFrom") || undefined,
      dateTo: c.req.query("dateTo") || undefined,
      limit: parseInt(c.req.query("limit") || "50", 10),
    };

    const result = await explorerSearch(params);
    return c.json(result);
  } catch (error) {
    console.error("Error in explorer search:", error);
    return c.json({ error: "Search failed" }, 500);
  }
});

/**
 * GET /api/evidences/explorer/stats
 * Get summary counts for dashboard.
 */
evidencesRoute.get("/explorer/stats", async (c) => {
  try {
    const stats = await explorerStats();
    return c.json(stats);
  } catch (error) {
    console.error("Error in explorer stats:", error);
    return c.json({ error: "Failed to get stats" }, 500);
  }
});
