import { ObjectId } from "mongodb";
import { getWorkReportCollection } from "../../db/mongo";
import { WorkReport } from "./workReports.types";

export type WorkReportFilters = Partial<
  Pick<WorkReport, "subsistema" | "frecuencia" | "tipoMantenimiento">
>;

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

const DEFAULT_LIMIT = 100;

// Ensure indexes are created for better query performance
let indexesCreated = false;
async function ensureIndexes() {
  if (indexesCreated) return;
  const collection = await getWorkReportCollection();
  await Promise.all([
    collection.createIndex({ createdAt: -1 }),
    collection.createIndex({ subsistema: 1 }),
    collection.createIndex({ fecha: -1 }),
    collection.createIndex({ folio: 1 }, { unique: true }),
  ]);
  indexesCreated = true;
  console.log("📊 Work reports indexes created");
}

export async function findWorkReports(
  filters: WorkReportFilters = {},
  pagination?: PaginationOptions,
): Promise<PaginatedResult<WorkReport>> {
  await ensureIndexes();
  const collection = await getWorkReportCollection();
  const query: Record<string, string> = {};

  if (filters.subsistema) query.subsistema = filters.subsistema;
  if (filters.frecuencia) query.frecuencia = filters.frecuencia;
  if (filters.tipoMantenimiento) {
    query.tipoMantenimiento = filters.tipoMantenimiento;
  }

  const limit = pagination?.limit ?? DEFAULT_LIMIT;
  const offset = pagination?.offset ?? 0;

  // Run count and data queries in parallel for better performance
  const [total, data] = await Promise.all([
    collection.countDocuments(query),
    collection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray(),
  ]);

  return {
    data,
    total,
    limit,
    offset,
  };
}

export async function findWorkReportById(
  id: string,
): Promise<WorkReport | null> {
  const collection = await getWorkReportCollection();
  return collection.findOne({ _id: new ObjectId(id) });
}

async function generateFolio(): Promise<string> {
  const collection = await getWorkReportCollection();
  const lastReport = await collection.findOne({}, { sort: { createdAt: -1 } });

  let nextNum = 1;
  if (lastReport?.folio?.startsWith("FT-")) {
    const parts = lastReport.folio.split("-");
    if (parts.length === 2 && parts[1]) {
      const num = parseInt(parts[1], 10);
      if (!Number.isNaN(num)) {
        nextNum = num + 1;
      }
    }
  }

  return `FT-${nextNum.toString().padStart(4, "0")}`;
}

export type NewWorkReport = Omit<
  WorkReport,
  "_id" | "folio" | "createdAt" | "updatedAt"
>;

export async function insertWorkReport(
  data: NewWorkReport,
): Promise<WorkReport> {
  const collection = await getWorkReportCollection();

  const folio = await generateFolio();
  const now = new Date();

  const newReport: WorkReport = {
    ...data,
    folio,
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(newReport);
  return { ...newReport, _id: result.insertedId };
}

export type UpdateWorkReportInput = Partial<
  Omit<WorkReport, "_id" | "folio" | "createdAt">
>;

export async function updateWorkReportById(
  id: string,
  updates: UpdateWorkReportInput,
): Promise<WorkReport | null> {
  const collection = await getWorkReportCollection();
  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    {
      $set: {
        ...updates,
        updatedAt: new Date(),
      },
    },
    { returnDocument: "after" },
  );

  return result;
}

export async function deleteWorkReportById(
  id: string,
): Promise<boolean> {
  const collection = await getWorkReportCollection();
  const result = await collection.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}
