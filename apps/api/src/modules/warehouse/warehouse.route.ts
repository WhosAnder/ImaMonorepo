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

warehouseRoute.get("/", listWarehouseItemsController);
warehouseRoute.get("/:id", getWarehouseItemController);
warehouseRoute.get("/:id/adjustments", listWarehouseAdjustmentsController);
warehouseRoute.post(
  "/",
  requireRole(["admin", "warehouse_admin", "warehouse"]),
  createWarehouseItemController,
);
warehouseRoute.patch(
  "/:id",
  requireRole(["admin", "warehouse_admin", "warehouse"]),
  updateWarehouseItemController,
);
warehouseRoute.post(
  "/:id/adjustments",
  requireRole(["admin", "warehouse_admin", "warehouse"]),
  createWarehouseAdjustmentController,
);

warehouseRoute.delete(
  "/:id",
  requireRole(["admin", "warehouse_admin"]),
  archiveWarehouseItemController,
);
