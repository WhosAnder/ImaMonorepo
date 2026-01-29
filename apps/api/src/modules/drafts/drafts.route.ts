import { Hono } from "hono";
import {
  createDraftController,
  deleteDraftController,
  getDraftController,
  updateDraftController,
} from "./drafts.controller";
import { requireRole } from "../../middleware/roleGuard";

export const draftsRoute = new Hono();

draftsRoute.get("/", requireRole(["admin", "warehouse_admin", "warehouse", "user"]), getDraftController);
draftsRoute.post("/", requireRole(["admin", "warehouse_admin", "warehouse", "user"]), createDraftController);
draftsRoute.put("/:id", requireRole(["admin", "warehouse_admin", "warehouse", "user"]), updateDraftController);
draftsRoute.delete("/:id", requireRole(["admin", "warehouse_admin", "warehouse", "user"]), deleteDraftController);
