import { z } from "zod";
import { getMaxEvidenceSizeBytes, getAllowedEvidenceMimeTypes } from "../../config/s3";

/**
 * Request schema for presigned upload
 * - reportId and reportType are MANDATORY
 * - Only image MIME types allowed for evidences
 */
export const presignUploadRequestSchema = z.object({
  reportId: z.string().min(1, "reportId is required"),
  reportType: z.enum(["work", "warehouse"], {
    errorMap: () => ({ message: "reportType must be 'work' or 'warehouse'" }),
  }),
  originalName: z.string().min(1, "File name is required"),
  mimeType: z.string().min(1, "MIME type is required"),
  size: z.number().positive("Size must be positive"),
});

/**
 * Request schema for presigned download
 */
export const presignDownloadRequestSchema = z.object({
  fileId: z.string().optional(),
  key: z.string().optional(),
}).refine(
  (data) => data.fileId || data.key,
  { message: "Either fileId or key must be provided" }
);

/**
 * Request schema for confirm upload
 */
export const confirmUploadRequestSchema = z.object({
  fileId: z.string().min(1, "fileId is required"),
});

export type PresignUploadRequest = z.infer<typeof presignUploadRequestSchema>;
export type PresignDownloadRequest = z.infer<typeof presignDownloadRequestSchema>;
export type ConfirmUploadRequest = z.infer<typeof confirmUploadRequestSchema>;

/**
 * Validate upload request including MIME and size from env config.
 * Only image MIME types are allowed for evidences.
 */
export const validateUploadRequest = (data: PresignUploadRequest): { success: true } | { success: false; error: string } => {
  // Validate MIME type (only images allowed for evidences)
  const allowedMimes = getAllowedEvidenceMimeTypes();
  if (allowedMimes.length > 0 && !allowedMimes.includes(data.mimeType)) {
    return { 
      success: false, 
      error: `Invalid MIME type '${data.mimeType}'. Allowed: ${allowedMimes.join(", ")}` 
    };
  }
  
  // Validate size
  const maxBytes = getMaxEvidenceSizeBytes();
  if (data.size > maxBytes) {
    const maxMB = Math.round(maxBytes / 1024 / 1024);
    return { 
      success: false, 
      error: `File size ${Math.round(data.size / 1024 / 1024)}MB exceeds maximum of ${maxMB}MB` 
    };
  }
  
  return { success: true };
};
