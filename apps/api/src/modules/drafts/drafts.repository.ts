import { getDraftsCollection } from "../../db/mongo";
import { DraftRecord, DraftReportType } from "./drafts.types";

export async function upsertDraft(
  userId: string,
  reportType: DraftReportType,
  data: Partial<DraftRecord>,
): Promise<DraftRecord> {
  const col = await getDraftsCollection();
  const now = new Date();

  const result = await col.findOneAndUpdate(
    { userId, reportType },
    {
      $set: {
        formData: data.formData,
        evidenceRefs: data.evidenceRefs ?? [],
        updatedAt: now,
      },
      $inc: { version: 1 },
      $setOnInsert: {
        userId,
        reportType,
        createdAt: now,
      },
    },
    { upsert: true, returnDocument: "after" },
  );

  return result as unknown as DraftRecord;
}

export async function getDraft(
  userId: string,
  reportType: DraftReportType,
): Promise<DraftRecord | null> {
  const col = await getDraftsCollection();
  return col.findOne({ userId, reportType });
}

export async function removeDraft(
  userId: string,
  reportType: DraftReportType,
): Promise<boolean> {
  const col = await getDraftsCollection();
  const result = await col.deleteOne({ userId, reportType });
  return result.deletedCount > 0;
}
