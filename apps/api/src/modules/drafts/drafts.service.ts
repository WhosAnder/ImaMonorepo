import { DraftSchema } from "./drafts.schema";
import {
  DraftRecord,
  DraftReportType,
  DraftEvidenceRef,
} from "./drafts.types";
import {
  findDraftByUserAndType,
  upsertDraftByUserAndType,
  updateDraftById,
  deleteDraftById,
} from "./drafts.repository";
import { RequestUser } from "../../types/auth";

function flattenEvidenceRefs(refs?: DraftEvidenceRef[]): DraftEvidenceRef[] {
  return refs || [];
}

function ensureEvidenceImmutability(
  existing: DraftRecord | null,
  incomingEvidenceRefs: DraftEvidenceRef[] | undefined,
  user: RequestUser,
): void {
  if (!existing || user.role === "admin") return;

  const existingLocked = flattenEvidenceRefs(existing.evidenceRefs).filter(
    (ref) => ref.isLocked,
  );
  if (existingLocked.length === 0) return;

  const incoming = flattenEvidenceRefs(incomingEvidenceRefs);
  const incomingMap = new Map(
    incoming.filter((ref) => ref.id).map((ref) => [ref.id as string, ref]),
  );

  for (const locked of existingLocked) {
    if (!locked.id) continue;
    const next = incomingMap.get(locked.id);
    if (!next) {
      throw new Error("Locked evidence cannot be removed");
    }
    if (next.s3Key && locked.s3Key && next.s3Key !== locked.s3Key) {
      throw new Error("Locked evidence cannot be replaced");
    }
    if (next.isLocked === false) {
      throw new Error("Locked evidence cannot be unlocked");
    }
  }
}

export async function getDraftByUserAndType(
  userId: string,
  reportType: DraftReportType,
): Promise<DraftRecord | null> {
  return findDraftByUserAndType(userId, reportType);
}

export async function createOrUpdateDraftByUser(
  user: RequestUser,
  payload: unknown,
): Promise<DraftRecord> {
  const parsed = DraftSchema.parse(payload);
  const reportType = parsed.reportType;
  const existing = await findDraftByUserAndType(user.id || "", reportType);
  ensureEvidenceImmutability(existing, parsed.evidenceRefs, user);

  return upsertDraftByUserAndType(user.id || "", reportType, {
    formData: parsed.formData,
    evidenceRefs: parsed.evidenceRefs,
    signatureRefs: parsed.signatureRefs,
    status: parsed.status || "active",
  });
}

export async function updateDraft(
  user: RequestUser,
  draftId: string,
  payload: unknown,
): Promise<DraftRecord | null> {
  const parsed = DraftSchema.parse(payload);
  const existing = await findDraftByUserAndType(user.id || "", parsed.reportType);
  ensureEvidenceImmutability(existing, parsed.evidenceRefs, user);

  return updateDraftById(draftId, user.id || "", {
    formData: parsed.formData,
    evidenceRefs: parsed.evidenceRefs,
    signatureRefs: parsed.signatureRefs,
    status: parsed.status || "active",
  });
}

export async function deleteDraft(
  user: RequestUser,
  draftId: string,
): Promise<boolean> {
  return deleteDraftById(draftId, user.id || "");
}
