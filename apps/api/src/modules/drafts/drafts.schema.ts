import { z } from "zod";

const DraftEvidenceRefSchema = z.object({
  id: z.string().optional(),
  s3Key: z.string().optional(),
  syncState: z.enum(["pending", "synced", "failed"]).optional(),
  isLocked: z.boolean().optional(),
  phase: z.string().optional(),
  name: z.string().optional(),
  size: z.number().optional(),
  mimeType: z.string().optional(),
});

export const DraftSchema = z.object({
  reportType: z.enum(["work", "warehouse"]),
  formData: z.record(z.string(), z.unknown()),
  evidenceRefs: z.array(DraftEvidenceRefSchema).optional(),
  signatureRefs: z.record(z.string(), z.unknown()).optional(),
  status: z.enum(["active", "completed"]).optional(),
});
