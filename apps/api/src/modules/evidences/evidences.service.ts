import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import { getS3Client, getS3Bucket, getMaxEvidenceSizeBytes } from "../../config/s3";
import { evidencesRepo } from "./evidences.repo";
import { PresignedUploadResult, PresignedDownloadResult, ReportType, ObjectKeyParts, ReportInfo } from "./evidences.types";
import { getWorkReportCollection, getWarehouseReportCollection } from "../../db/mongo";

// ============================================================================
// SLUG & PATH UTILITIES
// ============================================================================

/**
 * Slugify a subsystem name:
 * - lowercase
 * - remove accents
 * - replace spaces and special chars with dashes
 * - remove non [a-z0-9-]
 */
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    // Remove accents
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    // Replace spaces and underscores with dashes
    .replace(/[\s_]+/g, "-")
    // Remove all non-alphanumeric except dashes
    .replace(/[^a-z0-9-]/g, "")
    // Collapse multiple dashes
    .replace(/-+/g, "-")
    // Remove leading/trailing dashes
    .replace(/^-|-$/g, "")
    // Limit length
    .slice(0, 50);
};

/**
 * Sanitize filename: remove special chars, keep extension
 */
const sanitizeFilename = (name: string): string => {
  const ext = name.split(".").pop() || "";
  const base = name.replace(/\.[^/.]+$/, "");
  const sanitized = base
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
  return ext ? `${sanitized}.${ext.toLowerCase()}` : sanitized;
};

/**
 * Get date parts from ISO string or current date
 * Returns numeric year/month/day for explorer hierarchy
 */
const getDateParts = (isoString?: string): { 
  date: Date; 
  year: number; 
  month: number; 
  day: number; 
  monthKey: string; 
  dayKey: string; 
  datePath: string;
} => {
  const date = isoString ? new Date(isoString) : new Date();
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate(); // 1-31
  const monthKey = `${year}-${String(month).padStart(2, "0")}`; // YYYY-MM
  const dayKey = String(day).padStart(2, "0"); // DD
  
  // CHANGED: Use YYYY/MM/DD format for hierarchy
  const datePath = `${year}/${String(month).padStart(2, "0")}/${dayKey}`; 
  
  return { date, year, month, day, monthKey, dayKey, datePath };
};

// ============================================================================
// REPORT LOOKUP
// ============================================================================

/**
 * Lookup a work report by ID to get subsystem and datetime
 */
export const lookupWorkReport = async (reportId: string): Promise<ReportInfo | null> => {
  try {
    const { ObjectId } = await import("mongodb");
    const collection = await getWorkReportCollection();
    const report = await collection.findOne({ _id: new ObjectId(reportId) });
    if (!report) return null;
    return {
      _id: report._id.toString(),
      subsistema: report.subsistema || "general",
      fechaHoraInicio: report.fechaHoraInicio,
    };
  } catch {
    return null;
  }
};

/**
 * Lookup a warehouse report by ID to get subsystem and datetime
 */
export const lookupWarehouseReport = async (reportId: string): Promise<ReportInfo | null> => {
  try {
    const { ObjectId } = await import("mongodb");
    const collection = await getWarehouseReportCollection();
    const report = await collection.findOne({ _id: new ObjectId(reportId) });
    if (!report) return null;
    return {
      _id: report._id.toString(),
      subsistema: report.subsistema || "general",
      fechaHoraInicio: report.fechaHoraEntrega,
    };
  } catch {
    return null;
  }
};

/**
 * Lookup report based on type
 */
export const lookupReport = async (reportId: string, reportType: ReportType): Promise<ReportInfo | null> => {
  if (reportType === "work") {
    return lookupWorkReport(reportId);
  } else {
    return lookupWarehouseReport(reportId);
  }
};

// ============================================================================
// KEY BUILDING
// ============================================================================

export interface BuildObjectKeyParams {
  reportId: string;
  reportType: ReportType;
  subsystem: string;
  fechaHoraInicio?: string;
  originalName: string;
}

export const buildObjectKey = (params: BuildObjectKeyParams): ObjectKeyParts & { 
  date: Date; 
  year: number; 
  month: number; 
  day: number; 
  monthKey: string; 
  dayKey: string; 
} => {
  const { reportId, reportType, subsystem, fechaHoraInicio, originalName } = params;
  
  const subsystemSlug = slugify(subsystem);
  const { date, year, month, day, monthKey, dayKey, datePath } = getDateParts(fechaHoraInicio);
  const uuid = randomUUID().slice(0, 8);
  const safeFilename = sanitizeFilename(originalName);
  
  // CHANGED: Path format: evidences/{subsystemSlug}/{YYYY}/{MM}/{DD}/{reportType}/{reportId}/{file}
  const key = `evidences/${subsystemSlug}/${datePath}/${reportType}/${reportId}/${uuid}-${safeFilename}`;
  
  return {
    key,
    subsystemSlug,
    datePath,
    safeFilename,
    date,
    year,
    month,
    day,
    monthKey,
    dayKey,
  };
};

// ============================================================================
// PRESIGNED UPLOAD
// ============================================================================

export interface CreatePresignedUploadParams {
  reportId: string;
  reportType: ReportType;
  originalName: string;
  mimeType: string;
  size: number;
  createdBy?: string;
}

/**
 * Create presigned POST for direct browser upload of evidence images.
 * - Looks up report to get subsystem and date
 * - Builds hierarchical key
 * - Creates pending evidence record
 * - Generates presigned POST
 */
export const createPresignedUpload = async (
  params: CreatePresignedUploadParams
): Promise<PresignedUploadResult> => {
  const bucket = getS3Bucket();
  if (!bucket) {
    throw new Error("S3_BUCKET not configured");
  }

  // Lookup report to get subsystem and date
  const report = await lookupReport(params.reportId, params.reportType);
  if (!report) {
    throw new Error(`Report not found: ${params.reportId}`);
  }

  // Build hierarchical key
  const keyParts = buildObjectKey({
    reportId: params.reportId,
    reportType: params.reportType,
    subsystem: report.subsistema,
    fechaHoraInicio: report.fechaHoraInicio,
    originalName: params.originalName,
  });

  const maxSize = getMaxEvidenceSizeBytes();

  // Create evidence metadata record (status: pending)
  const evidenceRecord = await evidencesRepo.create({
    key: keyParts.key,
    bucket,
    originalName: params.originalName,
    mimeType: params.mimeType,
    size: params.size,
    reportId: params.reportId,
    reportType: params.reportType,
    subsystem: report.subsistema,
    subsystemSlug: keyParts.subsystemSlug,
    date: keyParts.date,
    year: keyParts.year,
    month: keyParts.month,
    day: keyParts.day,
    datePath: keyParts.datePath,
    monthKey: keyParts.monthKey,
    dayKey: keyParts.dayKey,
    createdBy: params.createdBy,
  });

  // Generate presigned POST
  const client = getS3Client();
  const { url, fields } = await createPresignedPost(client, {
    Bucket: bucket,
    Key: keyParts.key,
    Conditions: [
      ["content-length-range", 0, maxSize],
      ["eq", "$Content-Type", params.mimeType],
    ],
    Fields: {
      "Content-Type": params.mimeType,
    },
    Expires: 300, // 5 minutes
  });

  return {
    fileId: evidenceRecord._id!.toString(),
    key: keyParts.key,
    bucket,
    upload: { url, fields },
  };
};

// ============================================================================
// CONFIRM UPLOAD
// ============================================================================

/**
 * Confirm upload by checking S3 HEAD and marking as uploaded
 */
export const confirmUploadWithVerification = async (fileId: string): Promise<boolean> => {
  const evidenceRecord = await evidencesRepo.findById(fileId);
  if (!evidenceRecord) {
    throw new Error("Evidence record not found");
  }

  if (evidenceRecord.status === "uploaded") {
    return true; // Already confirmed
  }

  // HEAD object to verify it exists in S3
  const bucket = getS3Bucket();
  const client = getS3Client();
  
  try {
    await client.send(new HeadObjectCommand({
      Bucket: bucket,
      Key: evidenceRecord.key,
    }));
  } catch (error: any) {
    if (error.$metadata?.httpStatusCode === 404) {
      throw new Error("Evidence not found in storage. Upload may have failed.");
    }
    throw error;
  }

  // Mark as uploaded
  return evidencesRepo.updateStatus(fileId, "uploaded");
};

// ============================================================================
// PRESIGNED DOWNLOAD
// ============================================================================

export interface CreatePresignedDownloadParams {
  fileId?: string;
  key?: string;
}

/**
 * Create presigned GET URL for secure evidence download
 */
export const createPresignedDownload = async (
  params: CreatePresignedDownloadParams
): Promise<PresignedDownloadResult> => {
  const bucket = getS3Bucket();
  if (!bucket) {
    throw new Error("S3_BUCKET not configured");
  }

  // Find evidence record
  let evidenceRecord;
  if (params.fileId) {
    evidenceRecord = await evidencesRepo.findById(params.fileId);
  } else if (params.key) {
    evidenceRecord = await evidencesRepo.findByKey(params.key);
  }

  if (!evidenceRecord) {
    throw new Error("Evidence not found");
  }

  if (evidenceRecord.status === "deleted") {
    throw new Error("Evidence has been deleted");
  }

  // Generate presigned GET URL
  const client = getS3Client();
  const expiresInSeconds = 300;
  
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: evidenceRecord.key,
  });

  const url = await getSignedUrl(client, command, { expiresIn: expiresInSeconds });

  return { url, expiresInSeconds };
};

// ============================================================================
// LIST EVIDENCES
// ============================================================================

/**
 * List evidences for a report
 */
export const listEvidencesByReport = async (reportId: string, includePending = false) => {
  return evidencesRepo.listByReport(reportId, includePending);
};
