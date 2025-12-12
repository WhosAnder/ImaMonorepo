import { Hono } from "hono";
import { uploadEvidenceController } from "./storage.controller";

export const storageRoute = new Hono();

storageRoute.post("/evidences", uploadEvidenceController);
