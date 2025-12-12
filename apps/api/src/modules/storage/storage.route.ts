import { Hono } from "hono";
import { uploadEvidenceController, getEvidenceController } from "./storage.controller";

export const storageRoute = new Hono();

storageRoute.post("/evidences", uploadEvidenceController);
storageRoute.get("/evidences/:key", getEvidenceController);
