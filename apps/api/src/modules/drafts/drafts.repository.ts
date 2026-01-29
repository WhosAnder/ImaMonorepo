import { ObjectId } from "mongodb";
import { getDraftsCollection } from "../../db/mongo";
import { DraftRecord, DraftReportType } from "./drafts.types";

const TTL_SECONDS = 60 * 60 * 24 * 30;
let indexesCreated = false;

async function ensureIndexes() {
  if (indexesCreated) return;
  const collection = await getDraftsCollection();
  await Promise.all([
    collection.createIndex({ userId: 1, reportType: 1 }, { unique: true }),
    collection.createIndex({ updatedAt: 1 }, { expireAfterSeconds: TTL_SECONDS }),
  ]);
  indexesCreated = true;
  console.log("📊 Drafts indexes created");
}

export async function findDraftByUserAndType(
  userId: string,
  reportType: DraftReportType,
): Promise<DraftRecord | null> {
  await ensureIndexes();
  const collection = await getDraftsCollection();
  return collection.findOne({ userId, reportType });
}

export async function upsertDraftByUserAndType(
  userId: string,
  reportType: DraftReportType,
  data: Omit<DraftRecord, "_id" | "userId" | "reportType" | "createdAt" | "updatedAt">,
): Promise<DraftRecord> {
  await ensureIndexes();
  const collection = await getDraftsCollection();
  const now = new Date();

  const result = await collection.findOneAndUpdate(
    { userId, reportType },
    {
      $set: {
        ...data,
        userId,
        reportType,
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    { returnDocument: "after", upsert: true },
  );

  return result as DraftRecord;
}

export async function updateDraftById(
  id: string,
  userId: string,
  updates: Partial<Omit<DraftRecord, "_id" | "userId" | "reportType" | "createdAt">>,
): Promise<DraftRecord | null> {
  await ensureIndexes();
  const collection = await getDraftsCollection();
  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(id), userId },
    {
      $set: {
        ...updates,
        updatedAt: new Date(),
      },
    },
    { returnDocument: "after" },
  );
  return result as DraftRecord | null;
}

export async function deleteDraftById(
  id: string,
  userId: string,
): Promise<boolean> {
  const collection = await getDraftsCollection();
  const result = await collection.deleteOne({ _id: new ObjectId(id), userId });
  return result.deletedCount === 1;
}
