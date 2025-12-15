import { ObjectId } from "mongodb";
import { getWorkersCollection } from "../../db/mongo";
import { WorkerRecord } from "./workers.types";

export async function listWorkers(
  search?: string,
  includeInactive: boolean = false
): Promise<WorkerRecord[]> {
  const collection = await getWorkersCollection();
  const query: any = {};

  if (!includeInactive) {
    query.active = true;
  }

  if (search) {
    query.name = { $regex: search, $options: "i" };
  }

  return collection.find(query).sort({ name: 1 }).toArray();
}

export async function createWorker(name: string): Promise<WorkerRecord> {
  const collection = await getWorkersCollection();
  const now = new Date();
  const doc: WorkerRecord = {
    name,
    active: true,
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

export async function updateWorker(
  id: string,
  updates: Partial<Pick<WorkerRecord, "name" | "active">>
): Promise<WorkerRecord | null> {
  const collection = await getWorkersCollection();
  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    {
      $set: {
        ...updates,
        updatedAt: new Date(),
      },
    },
    { returnDocument: "after" }
  );

  return result || null;
}

export async function deactivateWorker(id: string): Promise<WorkerRecord | null> {
  return updateWorker(id, { active: false });
}
