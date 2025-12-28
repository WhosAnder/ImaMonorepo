import { Hono } from "hono";
import {
  createWorkReportController,
  getWorkReportByIdController,
  listWorkReportsController,
  updateWorkReportController,
  deleteWorkReportController,
} from "./workReports.controller";
import { requireRole } from "../../middleware/roleGuard";

export const workReportsRoute = new Hono();

workReportsRoute.get("/", listWorkReportsController);
workReportsRoute.get("/:id", getWorkReportByIdController);
workReportsRoute.post("/", createWorkReportController);
workReportsRoute.put("/:id", requireRole(["admin"]), updateWorkReportController);
workReportsRoute.delete("/:id", requireRole(["admin"]), deleteWorkReportController);
