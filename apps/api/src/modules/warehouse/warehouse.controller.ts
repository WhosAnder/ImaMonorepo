import { Context } from 'hono';
import { ZodError } from 'zod';
import {
  createWarehouseItem,
  getWarehouseItem,
  listWarehouseAdjustments,
  listWarehouseItems,
  updateWarehouseItemDetails,
  adjustWarehouseItemStock,
} from './warehouse.service';
import {
  CreateWarehouseItemSchema,
  UpdateWarehouseItemSchema,
  WarehouseAdjustmentSchema,
} from './warehouse.schema';
import { WarehouseStockFilters } from './warehouse.types';
import { getRequestUser } from '../../middleware/roleGuard';

export async function listWarehouseItemsController(c: Context) {
  const filters: WarehouseStockFilters = {};
  const category = c.req.query('category');
  const location = c.req.query('location');
  const status = c.req.query('status');
  const search = c.req.query('search');
  const lowStock = c.req.query('lowStock');

  if (category) filters.category = category;
  if (location) filters.location = location;
  if (status === 'active' || status === 'inactive') filters.status = status;
  if (search) filters.search = search;
  if (lowStock) filters.lowStock = lowStock === 'true';

  const items = await listWarehouseItems(filters);
  return c.json(items);
}

export async function getWarehouseItemController(c: Context) {
  const id = c.req.param('id');
  try {
    const item = await getWarehouseItem(id);
    if (!item) {
      return c.json({ error: 'Item not found' }, 404);
    }
    return c.json(item);
  } catch (error) {
    console.error('Error fetching warehouse item', error);
    return c.json({ error: 'Invalid ID format' }, 400);
  }
}

export async function createWarehouseItemController(c: Context) {
  try {
    const body = await c.req.json();
    const validated = CreateWarehouseItemSchema.parse(body);
    const newItem = await createWarehouseItem(validated);
    return c.json(newItem, 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return c.json({ error: 'Validation Error', details: error.errors }, 400);
    }
    if (error instanceof Error && error.message === 'SKU_ALREADY_EXISTS') {
      return c.json({ error: 'SKU already exists' }, 409);
    }
    console.error('Error creating warehouse item', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
}

export async function updateWarehouseItemController(c: Context) {
  const id = c.req.param('id');
  try {
    const body = await c.req.json();
    const validated = UpdateWarehouseItemSchema.parse(body);
    const updated = await updateWarehouseItemDetails(id, validated);

    if (!updated) {
      return c.json({ error: 'Item not found' }, 404);
    }

    return c.json(updated);
  } catch (error) {
    if (error instanceof ZodError) {
      return c.json({ error: 'Validation Error', details: error.errors }, 400);
    }
    console.error('Error updating warehouse item', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
}

export async function listWarehouseAdjustmentsController(c: Context) {
  const id = c.req.param('id');
  const limitParam = c.req.query('limit');
  const parsedLimit = limitParam ? parseInt(limitParam, 10) : undefined;
  const limit = Number.isNaN(parsedLimit) ? undefined : parsedLimit;

  try {
    const adjustments = await listWarehouseAdjustments(id, limit);
    return c.json(adjustments);
  } catch (error) {
    console.error('Error listing adjustments', error);
    return c.json({ error: 'Invalid ID format' }, 400);
  }
}

export async function createWarehouseAdjustmentController(c: Context) {
  const id = c.req.param('id');
  try {
    const body = await c.req.json();
    const validated = WarehouseAdjustmentSchema.parse(body);
    const user = getRequestUser(c);

    const result = await adjustWarehouseItemStock(id, {
      ...validated,
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
    });

    return c.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return c.json({ error: 'Validation Error', details: error.errors }, 400);
    }
    if (error instanceof Error) {
      if (error.message === 'ITEM_NOT_FOUND') {
        return c.json({ error: 'Item not found' }, 404);
      }
      if (error.message === 'NEGATIVE_QUANTITY') {
        return c.json({ error: 'Quantity cannot go below zero' }, 400);
      }
    }
    console.error('Error adjusting warehouse item', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
}
