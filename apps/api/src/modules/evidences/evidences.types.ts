import { ObjectId } from "mongodb";

export type EvidenceStatus = "pending" | "uploaded" | "deleted";
export type ReportType = "work" | "warehouse";

export interface EvidenceRecord {
  _id?: ObjectId;
  key: string;
  bucket: string;
  originalName: string;
  mimeType: string;
  size: number;
  reportId: string;
  reportType: ReportType;
  subsystem: string;
  subsystemSlug: string;
  // Explorer hierarchy fields
  date: Date;        // Report start date for grouping
  year: number;      // e.g., 2025
  month: number;     // 1-12
  day: number;       // 1-31
  // Legacy fields (kept for compatibility)
  datePath: string;  // e.g., "2025-12/12"
  monthKey: string;  // e.g., "2025-12"
  dayKey: string;    // e.g., "12"
  // Other fields
  createdBy?: string;
  createdAt: Date;
  status: EvidenceStatus;
}

export interface CreateEvidenceRecordInput {
  key: string;
  bucket: string;
  originalName: string;
  mimeType: string;
  size: number;
  reportId: string;
  reportType: ReportType;
  subsystem: string;
  subsystemSlug: string;
  date: Date;
  year: number;
  month: number;
  day: number;
  datePath: string;
  monthKey: string;
  dayKey: string;
  createdBy?: string;
}

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

export interface ObjectKeyParts {
  key: string;
  subsystemSlug: string;
  datePath: string;
  safeFilename: string;
}

export interface ReportInfo {
  _id: string;
  subsistema: string;
  fechaHoraInicio?: string;
}
