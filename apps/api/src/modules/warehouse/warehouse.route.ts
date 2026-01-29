import { Hono } from "hono";
import {
  createWarehouseAdjustmentController,
  createWarehouseItemController,
  getWarehouseItemController,
  listWarehouseAdjustmentsController,
  listWarehouseItemsController,
  updateWarehouseItemController,
  archiveWarehouseItemController,
} from "./warehouse.controller";
import { requireRole } from "../../middleware/roleGuard";

export const warehouseRoute = new Hono();

warehouseRoute.get(
  "/",
  requireRole(["admin", "supervisor", "warehouse"]),
  listWarehouseItemsController,
);
warehouseRoute.get(
  "/:id",
  requireRole(["admin", "supervisor", "warehouse"]),
  getWarehouseItemController,
);
warehouseRoute.get(
  "/:id/adjustments",
  requireRole(["admin", "supervisor", "warehouse"]),
  listWarehouseAdjustmentsController,
);
warehouseRoute.post(
  "/",
  requireRole(["admin", "warehouse"]),
  createWarehouseItemController,
);
warehouseRoute.patch(
  "/:id",
  requireRole(["admin", "warehouse"]),
  updateWarehouseItemController,
);
warehouseRoute.post(
  "/:id/adjustments",
  requireRole(["admin", "warehouse"]),
  createWarehouseAdjustmentController,
);

warehouseRoute.delete(
  "/:id",
  requireRole(["admin"]),
  archiveWarehouseItemController,
);
