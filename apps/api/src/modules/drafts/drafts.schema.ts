import { z } from "zod";

const DraftEvidenceRefSchema = z.object({
  id: z.string(),
  s3Key: z.string().optional(),
  phase: z.string().optional(),
  name: z.string().optional(),
  size: z.number().optional(),
  mimeType: z.string().optional(),
  syncState: z.enum(["pending", "synced", "failed"]).default("pending"),
});

export const UpsertDraftSchema = z.object({
  reportType: z.enum(["work", "warehouse"]),
  formData: z.record(z.string(), z.unknown()),
  evidenceRefs: z.array(DraftEvidenceRefSchema).optional(),
  version: z.number().optional(),
});

export type UpsertDraftInput = z.infer<typeof UpsertDraftSchema>;
