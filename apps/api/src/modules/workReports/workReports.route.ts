import { Hono } from "hono";
import {
  createWorkReportController,
  getWorkReportByIdController,
  listWorkReportsController,
  updateWorkReportController,
  deleteWorkReportController,
} from "./workReports.controller";
import { requireRole } from "../../middleware/roleGuard";
import { idempotencyMiddleware } from "../../middleware/idempotency";

export const workReportsRoute = new Hono();

// Apply idempotency middleware to all routes
workReportsRoute.use("/*", idempotencyMiddleware);

workReportsRoute.get("/", listWorkReportsController);
workReportsRoute.get("/:id", getWorkReportByIdController);
workReportsRoute.post("/", createWorkReportController);
workReportsRoute.put(
  "/:id",
  requireRole(["admin"]),
  updateWorkReportController,
);
workReportsRoute.delete(
  "/:id",
  requireRole(["admin"]),
  deleteWorkReportController,
);
