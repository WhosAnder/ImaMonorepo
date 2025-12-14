/**
 * @deprecated This module is deprecated and kept for backward compatibility.
 * Use the new evidences module at /api/evidences/* for presigned URL uploads.
 * This legacy module uses server-side multer/S3 upload.
 */
import { Hono } from "hono";
import { uploadEvidenceController, getEvidenceController } from "./storage.controller";

export const storageRoute = new Hono();

storageRoute.post("/evidences", uploadEvidenceController);
storageRoute.get("/evidences/:key", getEvidenceController);
