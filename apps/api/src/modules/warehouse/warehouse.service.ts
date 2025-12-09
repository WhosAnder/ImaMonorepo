import {
  AdjustmentInput,
  NewWarehouseItem,
  UpdateWarehouseItemInput,
  applyStockAdjustment,
  findWarehouseItemById,
  findWarehouseItemBySku,
  findWarehouseItems,
  insertWarehouseItem,
  listAdjustmentsForItem,
  setWarehouseItemStatus,
  updateWarehouseItem,
} from './warehouse.repository';
import {
  WarehouseStockFilters,
  WarehouseStockItem,
  WarehouseStockAdjustment,
} from './warehouse.types';
import { RequestUser } from '../../types/auth';

export function mapStockItem(item: WarehouseStockItem) {
  const minQuantity = item.minQuantity ?? null;
  const maxQuantity = item.maxQuantity ?? null;
  const reorderPoint = item.reorderPoint ?? null;
  const quantity = item.quantityOnHand;

  return {
    ...item,
    availableQuantity: quantity,
    isBelowMinimum:
      typeof minQuantity === 'number' ? quantity < minQuantity : false,
    isAboveMaximum:
      typeof maxQuantity === 'number' ? quantity > maxQuantity : false,
    needsReorder:
      typeof reorderPoint === 'number' ? quantity <= reorderPoint : false,
  };
}

export async function listWarehouseItems(filters: WarehouseStockFilters = {}) {
  const items = await findWarehouseItems(filters);
  return items.map(mapStockItem);
}

export async function getWarehouseItem(id: string) {
  const item = await findWarehouseItemById(id);
  return item ? mapStockItem(item) : null;
}

export async function createWarehouseItem(data: NewWarehouseItem) {
  const existing = await findWarehouseItemBySku(data.sku);
  if (existing) {
    const error = new Error('SKU_ALREADY_EXISTS');
    throw error;
  }
  const item = await insertWarehouseItem(data);
  return mapStockItem(item);
}

export async function updateWarehouseItemDetails(
  id: string,
  updates: UpdateWarehouseItemInput
) {
  const item = await updateWarehouseItem(id, updates);
  return item ? mapStockItem(item) : null;
}

export async function archiveWarehouseItem(id: string) {
  const item = await setWarehouseItemStatus(id, 'inactive');
  return item ? mapStockItem(item) : null;
}

export async function reactivateWarehouseItem(id: string) {
  const item = await setWarehouseItemStatus(id, 'active');
  return item ? mapStockItem(item) : null;
}

export async function adjustWarehouseItemStock(
  id: string,
  adjustment: AdjustmentInput
): Promise<{
  item: ReturnType<typeof mapStockItem>;
  adjustment: WarehouseStockAdjustment;
}> {
  const { item, adjustment: createdAdjustment } = await applyStockAdjustment(
    id,
    adjustment
  );

  return {
    item: mapStockItem(item),
    adjustment: createdAdjustment,
  };
}

export async function listWarehouseAdjustments(id: string, limit = 50) {
  return listAdjustmentsForItem(id, limit);
}

type AdjustmentKind = 'delivery' | 'return';

interface ReportAdjustmentParams {
  sku: string;
  units: number;
  reportFolio: string;
  actor: RequestUser;
}

export interface StockAdjustmentOutcome {
  success: boolean;
  failureReason?: string;
  code?: 'NOT_FOUND' | 'INSUFFICIENT_STOCK' | 'NEGATIVE_NOT_ALLOWED' | 'UNKNOWN';
}

async function adjustStockForReportAction(
  kind: AdjustmentKind,
  params: ReportAdjustmentParams
): Promise<StockAdjustmentOutcome> {
  const { sku, units, reportFolio, actor } = params;
  const normalizedUnits = Math.abs(units);
  if (normalizedUnits === 0) {
    return { success: true };
  }

  const stockItem = await findWarehouseItemBySku(sku);
  if (!stockItem || !stockItem._id) {
    return {
      success: false,
      code: 'NOT_FOUND',
      failureReason: 'Stock item not found',
    };
  }

  if (
    kind === 'delivery' &&
    !stockItem.allowNegative &&
    stockItem.quantityOnHand < normalizedUnits
  ) {
    return {
      success: false,
      code: 'INSUFFICIENT_STOCK',
      failureReason: `Insufficient stock. Available ${stockItem.quantityOnHand}, requested ${normalizedUnits}`,
    };
  }

  try {
    const delta = kind === 'delivery' ? -normalizedUnits : normalizedUnits;
    await applyStockAdjustment(stockItem._id.toString(), {
      delta,
      reason: kind === 'delivery' ? 'decrease' : 'increase',
      note: `${kind === 'delivery' ? 'Delivery' : 'Return'} via warehouse report ${reportFolio}`,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
    });

    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message === 'NEGATIVE_QUANTITY') {
      return {
        success: false,
        code: 'NEGATIVE_NOT_ALLOWED',
        failureReason: 'Negative stock not allowed for this item',
      };
    }

    console.error('Unexpected error adjusting stock for warehouse report', {
      sku,
      reportFolio,
      error,
    });
    return {
      success: false,
      code: 'UNKNOWN',
      failureReason: 'Unexpected error when applying stock adjustment',
    };
  }
}

export function adjustStockForReportDelivery(
  sku: string,
  units: number,
  reportFolio: string,
  actor: RequestUser
): Promise<StockAdjustmentOutcome> {
  return adjustStockForReportAction('delivery', { sku, units, reportFolio, actor });
}

export function adjustStockForReportReturn(
  sku: string,
  units: number,
  reportFolio: string,
  actor: RequestUser
): Promise<StockAdjustmentOutcome> {
  return adjustStockForReportAction('return', { sku, units, reportFolio, actor });
}
