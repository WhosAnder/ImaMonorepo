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

warehouseReportsRoute.get(
  "/",
  requireRole(["admin", "supervisor", "warehouse"]),
  listWarehouseReportsController,
);
warehouseReportsRoute.get(
  "/:id",
  requireRole(["admin", "supervisor", "warehouse"]),
  getWarehouseReportByIdController,
);
warehouseReportsRoute.post(
  "/",
  requireRole(["admin", "supervisor", "warehouse"]),
  createWarehouseReportController,
);
warehouseReportsRoute.put(
  "/:id",
  requireRole(["admin", "warehouse"]),
  updateWarehouseReportController,
);
warehouseReportsRoute.delete(
  "/:id",
  requireRole(["admin", "warehouse"]),
  deleteWarehouseReportController,
);
warehouseReportsRoute.patch(
  "/:id/return",
  requireRole(["admin", "warehouse"]),
  processWarehouseReportReturnController,
);
