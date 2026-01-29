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

workReportsRoute.get(
  "/",
  requireRole(["admin", "supervisor", "warehouse"]),
  listWorkReportsController,
);
workReportsRoute.get(
  "/:id",
  requireRole(["admin", "supervisor", "warehouse"]),
  getWorkReportByIdController,
);
workReportsRoute.post(
  "/",
  requireRole(["admin", "supervisor", "warehouse"]),
  createWorkReportController,
);
workReportsRoute.put(
  "/:id",
  requireRole(["admin", "supervisor"]),
  updateWorkReportController,
);
workReportsRoute.delete(
  "/:id",
  requireRole(["admin"]),
  deleteWorkReportController,
);
