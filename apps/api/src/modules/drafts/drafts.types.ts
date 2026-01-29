export type DraftReportType = "work" | "warehouse";

export interface DraftEvidenceRef {
  id?: string;
  s3Key?: string;
  syncState?: "pending" | "synced" | "failed";
  isLocked?: boolean;
  phase?: string;
  name?: string;
  size?: number;
  mimeType?: string;
}

export interface DraftRecord {
  _id?: unknown;
  userId: string;
  reportType: DraftReportType;
  formData: Record<string, unknown>;
  evidenceRefs?: DraftEvidenceRef[];
  signatureRefs?: Record<string, unknown>;
  status?: "active" | "completed";
  createdAt: Date;
  updatedAt: Date;
}
