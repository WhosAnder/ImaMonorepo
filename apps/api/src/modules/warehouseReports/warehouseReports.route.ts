import { Hono } from "hono";
import {
  createWarehouseReportController,
  getWarehouseReportByIdController,
  listWarehouseReportsController,
  processWarehouseReportReturnController,
  updateWarehouseReportController,
  deleteWarehouseReportController,
} from "./warehouseReports.controller";
import { requireRole } from "../../middleware/roleGuard";

export const warehouseReportsRoute = new Hono();

warehouseReportsRoute.get("/", listWarehouseReportsController);
warehouseReportsRoute.get("/:id", getWarehouseReportByIdController);
warehouseReportsRoute.post("/", createWarehouseReportController);
warehouseReportsRoute.put("/:id", requireRole(["admin"]), updateWarehouseReportController);
warehouseReportsRoute.delete("/:id", requireRole(["admin"]), deleteWarehouseReportController);
warehouseReportsRoute.patch(
  "/:id/return",
  processWarehouseReportReturnController,
);
