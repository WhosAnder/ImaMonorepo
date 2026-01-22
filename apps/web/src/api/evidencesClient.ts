import { API_URL } from "@/config/env";

export type ReportType = "work" | "warehouse";

export interface PresignUploadParams {
  reportId: string;
  reportType: ReportType;
  file: File;
  // Optional params for pre-report uploads
  subsystem?: string;
  fechaHoraInicio?: string;
  skipDbRecord?: boolean;
}

export interface PresignUploadResult {
  fileId: string;
  key: string;
  bucket: string;
  upload: {
    url: string;
    fields: Record<string, string>;
  };
}

export interface PresignDownloadResult {
  url: string;
  expiresInSeconds: number;
}

export interface EvidenceInfo {
  id: string;
  key: string;
  originalName: string;
  mimeType: string;
  size: number;
  subsystem?: string;
  datePath?: string;
  status: string;
  createdAt: string;
}

export interface ListEvidencesResult {
  reportId: string;
  count: number;
  evidences: EvidenceInfo[];
}

/**
 * Request a presigned POST URL for direct upload of evidence to S3.
 * Can optionally provide subsystem/date to upload before report exists.
 */
export async function presignUpload(
  params: PresignUploadParams,
): Promise<PresignUploadResult> {
  const {
    file,
    reportId,
    reportType,
    subsystem,
    fechaHoraInicio,
    skipDbRecord,
  } = params;

  const res = await fetch(`${API_URL}/api/storage/presign-upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      reportId,
      reportType,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      subsystem,
      fechaHoraInicio,
      skipDbRecord,
    }),
  });

  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ error: "Upload request failed" }));
    throw new Error(error.error || "Failed to get upload URL");
  }

  return res.json();
}

/**
 * Upload evidence file directly to S3 using presigned POST fields.
 */
export async function uploadEvidenceDirect(
  presignedData: PresignUploadResult,
  file: File,
): Promise<void> {
  const formData = new FormData();

  // Add all presigned fields first (order matters!)
  Object.entries(presignedData.upload.fields).forEach(([key, value]) => {
    formData.append(key, value);
  });

  // Add the file last
  formData.append("file", file);

  const res = await fetch(presignedData.upload.url, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Upload failed: ${res.status} ${text}`);
  }
}

/**
 * Confirm that evidence upload completed successfully.
 * Server will verify file exists in S3 and mark as uploaded.
 */
export async function confirmUpload(
  fileId: string,
): Promise<{ success: boolean; evidence?: EvidenceInfo }> {
  const res = await fetch(`${API_URL}/api/storage/confirm-upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileId }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Confirm failed" }));
    throw new Error(error.error || "Failed to confirm upload");
  }

  return res.json();
}

/**
 * Get a presigned download URL for an evidence file.
 */
export async function presignDownload(params: {
  fileId?: string;
  key?: string;
}): Promise<PresignDownloadResult> {
  const res = await fetch(`${API_URL}/api/storage/presign-download`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ error: "Download request failed" }));
    throw new Error(error.error || "Failed to get download URL");
  }

  return res.json();
}

/**
 * List all evidences for a report.
 */
export async function listEvidencesByReport(
  reportId: string,
  includePending = false,
): Promise<ListEvidencesResult> {
  const url = new URL(`${API_URL}/api/storage/report/${reportId}`);
  if (includePending) {
    url.searchParams.set("includePending", "true");
  }

  const res = await fetch(url.toString());

  if (!res.ok) {
    throw new Error("Failed to list evidences");
  }

  return res.json();
}

/**
 * Upload an evidence with full flow: presign -> upload to S3 -> confirm (if DB record exists).
 * Returns evidence info on success.
 */
export async function uploadEvidence(
  params: PresignUploadParams,
): Promise<EvidenceInfo> {
  // 1. Get presigned upload URL
  const presigned = await presignUpload(params);

  // 2. Upload directly to S3
  await uploadEvidenceDirect(presigned, params.file);

  // 3. Confirm upload completed (only if DB record was created)
  if (!params.skipDbRecord) {
    const { evidence } = await confirmUpload(presigned.fileId);

    if (!evidence) {
      throw new Error("Upload confirmed but evidence info not returned");
    }

    return evidence;
  }

  // For temp uploads (no DB record), return minimal info
  return {
    id: presigned.fileId,
    key: presigned.key,
    originalName: params.file.name,
    mimeType: params.file.type,
    size: params.file.size,
    status: "uploaded",
    createdAt: new Date().toISOString(),
  };
}
