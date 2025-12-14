import { Collection, ObjectId } from "mongodb";
import { getClient } from "../../db/mongo";
import { EvidenceRecord, CreateEvidenceRecordInput, EvidenceStatus } from "./evidences.types";

const DB_NAME = process.env.MONGODB_DB_NAME || "ima";
const COLLECTION_NAME = "evidences";

let collection: Collection<EvidenceRecord> | null = null;

async function getCollection(): Promise<Collection<EvidenceRecord>> {
  if (!collection) {
    const client = await getClient();
    const db = client.db(DB_NAME);
    collection = db.collection<EvidenceRecord>(COLLECTION_NAME);
    
    // Create indexes for common queries
    await collection.createIndex({ key: 1 }, { unique: true });
    await collection.createIndex({ reportId: 1, status: 1 });
    await collection.createIndex({ createdAt: -1 });
    await collection.createIndex({ subsystemSlug: 1 });
  }
  return collection;
}

export const evidencesRepo = {
  /**
   * Create a new evidence record
   */
  async create(input: CreateEvidenceRecordInput): Promise<EvidenceRecord> {
    const col = await getCollection();
    const record: EvidenceRecord = {
      ...input,
      createdAt: new Date(),
      status: "pending",
    };
    const result = await col.insertOne(record);
    return { ...record, _id: result.insertedId };
  },

  /**
   * Find evidence by ID
   */
  async findById(id: string): Promise<EvidenceRecord | null> {
    const col = await getCollection();
    try {
      return col.findOne({ _id: new ObjectId(id) });
    } catch {
      return null;
    }
  },

  /**
   * Find evidence by S3 key
   */
  async findByKey(key: string): Promise<EvidenceRecord | null> {
    const col = await getCollection();
    return col.findOne({ key });
  },

  /**
   * List evidences for a report
   * @param includePending - if true, include pending evidences (for admin/debug)
   */
  async listByReport(reportId: string, includePending = false): Promise<EvidenceRecord[]> {
    const col = await getCollection();
    const filter = includePending
      ? { reportId, status: { $ne: "deleted" as const } }
      : { reportId, status: "uploaded" as const };
    return col.find(filter).sort("createdAt", -1).toArray();
  },

  /**
   * Update evidence status
   */
  async updateStatus(id: string, status: EvidenceStatus): Promise<boolean> {
    const col = await getCollection();
    try {
      const result = await col.updateOne(
        { _id: new ObjectId(id) },
        { $set: { status } }
      );
      return result.modifiedCount > 0;
    } catch {
      return false;
    }
  },

  /**
   * Mark evidence as uploaded (confirms upload completed)
   */
  async markUploaded(key: string): Promise<boolean> {
    const col = await getCollection();
    const result = await col.updateOne(
      { key },
      { $set: { status: "uploaded" as EvidenceStatus } }
    );
    return result.modifiedCount > 0;
  },

  /**
   * Delete evidence record (soft delete)
   */
  async softDelete(id: string): Promise<boolean> {
    return this.updateStatus(id, "deleted");
  },

  /**
   * Get evidence count by report
   */
  async countByReport(reportId: string): Promise<number> {
    const col = await getCollection();
    return col.countDocuments({ reportId, status: { $ne: "deleted" } });
  },
};
