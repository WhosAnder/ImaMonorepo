import type { StorageAdapter } from "./adapters/storage-interface";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import {
  getS3Client,
  getS3Bucket,
  getMaxEvidenceSizeBytes,
} from "../../config/s3";
import { storageRepo } from "./storage.repo";
import {
  getWorkReportCollection,
  getWarehouseReportCollection,
} from "../../db/mongo";

export type ReportType = "work" | "warehouse";

export interface PresignedUploadResult {
  fileId: string;
  key: string;
  bucket: string;
  upload: {
    url: string;
    fields: Record<string, string>;
  };
}

export interface PresignedDownloadResult {
  url: string;
  expiresInSeconds: number;
}

export interface ReportInfo {
  _id: string;
  subsistema: string;
  fechaHoraInicio?: string;
}

export interface ObjectKeyParts {
  key: string;
  subsystemSlug: string;
  datePath: string;
  safeFilename: string;
}

// ============================================================================
// UTILITIES
// ============================================================================

const getFileExtension = (mimeType: string): string => {
  if (!mimeType) {
    return "bin";
  }
  return mimeType.includes("jpeg") ? "jpg" : mimeType.split("/")[1] || "bin";
};

const generateFileName = (
  relationId: string,
  index: number,
  storeType: string,
  fileExtension: string,
): string => {
  return `${relationId}-${index}-${storeType}.${fileExtension}`;
};

export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
};

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

const getDateParts = (isoString?: string) => {
  const date = isoString ? new Date(isoString) : new Date();
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const monthKey = `${year}-${String(month).padStart(2, "0")}`;
  const dayKey = String(day).padStart(2, "0");
  const datePath = `${year}/${String(month).padStart(2, "0")}/${dayKey}`;

  return { date, year, month, day, monthKey, dayKey, datePath };
};

// ============================================================================
// REPORT LOOKUP
// ============================================================================

export const lookupWorkReport = async (
  reportId: string,
): Promise<ReportInfo | null> => {
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

export const lookupWarehouseReport = async (
  reportId: string,
): Promise<ReportInfo | null> => {
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

export const lookupReport = async (
  reportId: string,
  reportType: ReportType,
): Promise<ReportInfo | null> => {
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

export const buildObjectKey = (params: BuildObjectKeyParams) => {
  const { reportId, reportType, subsystem, fechaHoraInicio, originalName } =
    params;

  const subsystemSlug = slugify(subsystem);
  const { date, year, month, day, monthKey, dayKey, datePath } =
    getDateParts(fechaHoraInicio);
  const uuid = randomUUID().slice(0, 8);
  const safeFilename = sanitizeFilename(originalName);

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
// SERVICE FUNCTIONS
// ============================================================================

const uploadEvidence =
  (storageAdapter: StorageAdapter) =>
  async (
    file: File,
    relationId: string,
    storeType: string,
    index?: number,
  ): Promise<{ url: string; fileName: string }> => {
    const type = file.type || "application/octet-stream";
    const fileExtension = getFileExtension(type);
    const normalizedIndex =
      typeof index === "number" && Number.isFinite(index) ? index : Date.now();
    const fileName = generateFileName(
      relationId,
      normalizedIndex,
      storeType,
      fileExtension,
    );

    const result = await storageAdapter.uploadFile(file, fileName, type);

    return {
      url: result.url,
      fileName: result.key,
    };
  };

export interface CreatePresignedUploadParams {
  reportId: string;
  reportType: ReportType;
  originalName: string;
  mimeType: string;
  size: number;
  createdBy?: string;
}

export const createPresignedUpload = async (
  params: CreatePresignedUploadParams,
): Promise<PresignedUploadResult> => {
  const bucket = getS3Bucket();
  if (!bucket) {
    throw new Error("S3_BUCKET not configured");
  }

  const report = await lookupReport(params.reportId, params.reportType);
  if (!report) {
    throw new Error(`Report not found: ${params.reportId}`);
  }

  const keyParts = buildObjectKey({
    reportId: params.reportId,
    reportType: params.reportType,
    subsystem: report.subsistema,
    fechaHoraInicio: report.fechaHoraInicio,
    originalName: params.originalName,
  });

  const maxSize = getMaxEvidenceSizeBytes();

  const evidenceRecord = await storageRepo.create({
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
    Expires: 300,
  });

  return {
    fileId: evidenceRecord._id!.toString(),
    key: keyParts.key,
    bucket,
    upload: { url, fields },
  };
};

export const confirmUploadWithVerification = async (
  fileId: string,
): Promise<boolean> => {
  const evidenceRecord = await storageRepo.findById(fileId);
  if (!evidenceRecord) {
    throw new Error("Evidence record not found");
  }

  if (evidenceRecord.status === "uploaded") {
    return true;
  }

  const bucket = getS3Bucket();
  const client = getS3Client();

  try {
    await client.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: evidenceRecord.key,
      }),
    );
  } catch (error: any) {
    if (error.$metadata?.httpStatusCode === 404) {
      throw new Error("Evidence not found in storage. Upload may have failed.");
    }
    throw error;
  }

  return storageRepo.updateStatus(fileId, "uploaded");
};

export interface CreatePresignedDownloadParams {
  fileId?: string;
  key?: string;
}

export const createPresignedDownload = async (
  params: CreatePresignedDownloadParams,
): Promise<PresignedDownloadResult> => {
  const bucket = getS3Bucket();
  if (!bucket) {
    throw new Error("S3_BUCKET not configured");
  }

  let evidenceRecord;
  if (params.fileId) {
    evidenceRecord = await storageRepo.findById(params.fileId);
  } else if (params.key) {
    evidenceRecord = await storageRepo.findByKey(params.key);
  }

  if (!evidenceRecord) {
    throw new Error("Evidence not found");
  }

  if (evidenceRecord.status === "deleted") {
    throw new Error("Evidence has been deleted");
  }

  const client = getS3Client();
  const expiresInSeconds = 300;

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: evidenceRecord.key,
  });

  const url = await getSignedUrl(client, command, {
    expiresIn: expiresInSeconds,
  });

  return { url, expiresInSeconds };
};

export const listEvidencesByReport = async (
  reportId: string,
  includePending = false,
) => {
  return storageRepo.listByReport(reportId, includePending);
};

export const createStorageService = (storageAdapter: StorageAdapter) => ({
  uploadEvidence: (
    file: File,
    relationId: string,
    storeType: string,
    index?: number,
  ) => uploadEvidence(storageAdapter)(file, relationId, storeType, index),
});

export type StorageService = ReturnType<typeof createStorageService>;
