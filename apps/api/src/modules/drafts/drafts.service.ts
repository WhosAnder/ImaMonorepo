import { UpsertDraftSchema, UpsertDraftInput } from "./drafts.schema";
import { DraftReportType } from "./drafts.types";
import * as repo from "./drafts.repository";

export async function upsertDraftForUser(
  userId: string,
  input: UpsertDraftInput,
) {
  const parsed = UpsertDraftSchema.parse(input);
  return repo.upsertDraft(userId, parsed.reportType, {
    formData: parsed.formData,
    evidenceRefs: parsed.evidenceRefs,
  });
}

export async function getDraftForUser(
  userId: string,
  reportType: DraftReportType,
) {
  return repo.getDraft(userId, reportType);
}

export async function deleteDraftForUser(
  userId: string,
  reportType: DraftReportType,
) {
  return repo.removeDraft(userId, reportType);
}
