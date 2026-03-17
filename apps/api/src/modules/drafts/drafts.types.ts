import { ObjectId } from "mongodb";

export type DraftReportType = "work" | "warehouse";

export interface DraftRecord {
  _id?: ObjectId;
  userId: string;
  reportType: DraftReportType;
  formData: Record<string, unknown>;
  evidenceRefs?: DraftEvidenceRef[];
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DraftEvidenceRef {
  id: string;
  s3Key?: string;
  phase?: string;
  name?: string;
  size?: number;
  mimeType?: string;
  syncState: "pending" | "synced" | "failed";
}
