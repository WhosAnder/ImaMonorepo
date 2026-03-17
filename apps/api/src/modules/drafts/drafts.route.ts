import { Hono } from "hono";
import {
  getDraftController,
  upsertDraftController,
  deleteDraftController,
} from "./drafts.controller";
import { requireRole } from "../../middleware/roleGuard";

export const draftsRoute = new Hono();

const roles = ["admin", "supervisor", "warehouse"] as const;

draftsRoute.get("/", requireRole([...roles]), getDraftController);
draftsRoute.put("/", requireRole([...roles]), upsertDraftController);
draftsRoute.delete("/", requireRole([...roles]), deleteDraftController);
