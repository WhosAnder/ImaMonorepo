import { Hono } from 'hono';
import {
  createWarehouseAdjustmentController,
  createWarehouseItemController,
  getWarehouseItemController,
  listWarehouseAdjustmentsController,
  listWarehouseItemsController,
  updateWarehouseItemController,
} from './warehouse.controller';
import { requireRole } from '../../middleware/roleGuard';

export const warehouseRoute = new Hono();

warehouseRoute.get('/', listWarehouseItemsController);
warehouseRoute.get('/:id', getWarehouseItemController);
warehouseRoute.get('/:id/adjustments', listWarehouseAdjustmentsController);
warehouseRoute.post(
  '/',
  requireRole(['admin', 'warehouse_admin']),
  createWarehouseItemController
);
warehouseRoute.patch(
  '/:id',
  requireRole(['admin', 'warehouse_admin']),
  updateWarehouseItemController
);
warehouseRoute.post(
  '/:id/adjustments',
  requireRole(['admin', 'warehouse_admin']),
  createWarehouseAdjustmentController
);
