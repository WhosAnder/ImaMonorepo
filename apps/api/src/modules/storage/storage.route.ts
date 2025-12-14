import { Hono } from "hono";
import { 
  uploadEvidenceController, 
  getEvidenceController,
  presignUploadController,
  confirmUploadController,
  presignDownloadController,
  listEvidencesController
} from "./storage.controller";

export const storageRoute = new Hono();

// Legacy endpoint (keep for now)
storageRoute.post("/evidences", uploadEvidenceController);
storageRoute.get("/evidences/:key", getEvidenceController);

// New endpoints for presigned URL flow
storageRoute.post("/presign-upload", presignUploadController);
storageRoute.post("/confirm-upload", confirmUploadController);
storageRoute.post("/presign-download", presignDownloadController);
storageRoute.get("/report/:reportId", listEvidencesController);

