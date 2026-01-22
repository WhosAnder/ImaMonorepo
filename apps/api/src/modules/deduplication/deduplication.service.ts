import { createHash } from "crypto";
import { ObjectId } from "mongodb";
import { getClient } from "../../db/mongo";

export interface DeduplicationRecord {
  _id?: ObjectId;
  requestHash: string;
  endpoint: string;
  method: string;
  status: "in_progress" | "completed" | "failed";
  resultId: string | null;
  resultData: any | null;
  error: string | null;
  createdAt: Date;
  expiresAt: Date;
}

/**
 * Generate a SHA-256 hash from normalized request data
 * This creates a consistent hash for duplicate detection
 */
export function generateRequestHash(data: any): string {
  try {
    // Normalize data by extracting key fields that define a unique work report
    // Exclude auto-generated fields (folio, timestamps) and mutable data
    const normalized = {
      subsistema: data.subsistema?.trim() || "",
      ubicacion: data.ubicacion?.trim() || "",
      fechaHoraInicio: data.fechaHoraInicio?.trim() || "",
      turno: data.turno || "",
      nombreResponsable: data.nombreResponsable?.trim() || "",
      trabajadores: (data.trabajadores || [])
        .map((t: any) => ({
          nombre: t.nombre?.trim() || "",
          puesto: t.puesto?.trim() || "",
        }))
        .sort((a: any, b: any) => a.nombre.localeCompare(b.nombre)),
      actividadesRealizadas: (data.actividadesRealizadas || [])
        .map((a: any) => a.nombre?.trim() || "")
        .sort(),
      tipoMantenimiento: data.tipoMantenimiento?.trim() || "",
      frecuencia: data.frecuencia?.trim() || "",
    };

    const jsonString = JSON.stringify(normalized);
    return createHash("sha256").update(jsonString).digest("hex");
  } catch (error) {
    console.error("Error generating request hash:", error);
    // Fallback: use timestamp-based hash if normalization fails
    return createHash("sha256")
      .update(JSON.stringify(data) + Date.now())
      .digest("hex");
  }
}

/**
 * Check if a request with this hash already exists
 */
export async function checkDuplication(
  requestHash: string,
  endpoint: string,
  method: string,
): Promise<DeduplicationRecord | null> {
  try {
    const client = await getClient();
    const dbName = process.env.MONGODB_DB_NAME || "ima_templates";
    const db = client.db(dbName);
    const collection = db.collection<DeduplicationRecord>(
      "request_deduplication",
    );

    // Ensure indexes exist
    await collection.createIndex({ requestHash: 1 }, { unique: true });
    await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    await collection.createIndex({ status: 1 });

    return await collection.findOne({ requestHash, endpoint, method });
  } catch (error) {
    console.error("Error checking duplication:", error);
    return null;
  }
}

/**
 * Mark a request as in-progress
 */
export async function markInProgress(
  requestHash: string,
  endpoint: string,
  method: string,
): Promise<void> {
  try {
    const client = await getClient();
    const dbName = process.env.MONGODB_DB_NAME || "ima_templates";
    const db = client.db(dbName);
    const collection = db.collection<DeduplicationRecord>(
      "request_deduplication",
    );

    const now = new Date();
    const ttlHours = Number(process.env.DEDUPLICATION_TTL_HOURS) || 24;
    const expiresAt = new Date(now.getTime() + ttlHours * 60 * 60 * 1000);

    await collection.insertOne({
      requestHash,
      endpoint,
      method,
      status: "in_progress",
      resultId: null,
      resultData: null,
      error: null,
      createdAt: now,
      expiresAt,
    });
  } catch (error) {
    // If duplicate key error, request was already marked by another concurrent request
    if ((error as any).code === 11000) {
      console.log("Request already marked as in-progress:", requestHash);
      return;
    }
    console.error("Error marking request in-progress:", error);
    throw error;
  }
}

/**
 * Mark a request as completed with result data
 */
export async function markCompleted(
  requestHash: string,
  resultId: string,
  resultData: any,
): Promise<void> {
  try {
    const client = await getClient();
    const dbName = process.env.MONGODB_DB_NAME || "ima_templates";
    const db = client.db(dbName);
    const collection = db.collection<DeduplicationRecord>(
      "request_deduplication",
    );

    await collection.updateOne(
      { requestHash },
      {
        $set: {
          status: "completed",
          resultId,
          resultData,
        },
      },
    );
  } catch (error) {
    console.error("Error marking request completed:", error);
    // Don't throw - this shouldn't block the response
  }
}

/**
 * Mark a request as failed with error message
 */
export async function markFailed(
  requestHash: string,
  error: string,
): Promise<void> {
  try {
    const client = await getClient();
    const dbName = process.env.MONGODB_DB_NAME || "ima_templates";
    const db = client.db(dbName);
    const collection = db.collection<DeduplicationRecord>(
      "request_deduplication",
    );

    await collection.updateOne(
      { requestHash },
      {
        $set: {
          status: "failed",
          error,
        },
      },
    );
  } catch (err) {
    console.error("Error marking request failed:", err);
    // Don't throw - this shouldn't block error handling
  }
}
