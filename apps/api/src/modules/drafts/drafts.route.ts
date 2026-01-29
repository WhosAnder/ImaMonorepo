import { Hono } from "hono";
import {
  createDraftController,
  deleteDraftController,
  getDraftController,
  updateDraftController,
} from "./drafts.controller";
import { requireRole } from "../../middleware/roleGuard";

export const draftsRoute = new Hono();

draftsRoute.get(
  "/",
  requireRole(["admin", "supervisor", "warehouse"]),
  getDraftController,
);
draftsRoute.post(
  "/",
  requireRole(["admin", "supervisor", "warehouse"]),
  createDraftController,
);
draftsRoute.put(
  "/:id",
  requireRole(["admin", "supervisor", "warehouse"]),
  updateDraftController,
);
draftsRoute.delete(
  "/:id",
  requireRole(["admin", "supervisor", "warehouse"]),
  deleteDraftController,
);
