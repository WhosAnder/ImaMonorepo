import { ObjectId } from 'mongodb';
import {
  getWarehouseAdjustmentsCollection,
  getWarehouseStockCollection,
} from '../../db/mongo';
import {
  WarehouseStockItem,
  WarehouseStockAdjustment,
  WarehouseStockFilters,
  WarehouseAdjustmentReason,
  WarehouseItemStatus,
} from './warehouse.types';
import { UserRole } from '../../types/auth';

export type NewWarehouseItem = Omit<
  WarehouseStockItem,
  '_id' | 'createdAt' | 'updatedAt' | 'lastAdjustmentAt' | 'lastAdjustmentBy'
>;

export type UpdateWarehouseItemInput = Partial<
  Omit<
    WarehouseStockItem,
    '_id' | 'createdAt' | 'updatedAt' | 'lastAdjustmentAt' | 'lastAdjustmentBy' | 'quantityOnHand'
  >
>;

export interface AdjustmentInput {
  delta: number;
  reason: WarehouseAdjustmentReason;
  note?: string;
  actorId?: string;
  actorName?: string;
  actorRole?: UserRole;
}

export async function findWarehouseItems(
  filters: WarehouseStockFilters = {}
): Promise<WarehouseStockItem[]> {
  const collection = await getWarehouseStockCollection();
  const query: Record<string, unknown> = {};

  if (filters.category) query.category = filters.category;
  if (filters.location) query.location = filters.location;
  if (filters.status) query.status = filters.status;
  if (filters.lowStock) {
    query.$expr = {
      $and: [
        { $ne: ['$minQuantity', null] },
        {
          $lt: ['$quantityOnHand', '$minQuantity'],
        },
      ],
    };
  }

  if (filters.search) {
    query.$or = [
      { name: { $regex: filters.search, $options: 'i' } },
      { sku: { $regex: filters.search, $options: 'i' } },
      { description: { $regex: filters.search, $options: 'i' } },
    ];
  }

  return collection.find(query).sort({ name: 1 }).toArray();
}

export async function findWarehouseItemById(
  id: string
): Promise<WarehouseStockItem | null> {
  const collection = await getWarehouseStockCollection();
  return collection.findOne({ _id: new ObjectId(id) });
}

export async function findWarehouseItemBySku(
  sku: string
): Promise<WarehouseStockItem | null> {
  const collection = await getWarehouseStockCollection();
  return collection.findOne({ sku });
}

export async function insertWarehouseItem(
  data: NewWarehouseItem
): Promise<WarehouseStockItem> {
  const collection = await getWarehouseStockCollection();
  const now = new Date();
  const doc: WarehouseStockItem = {
    ...data,
    status: data.status ?? 'active',
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

export async function updateWarehouseItem(
  id: string,
  updates: UpdateWarehouseItemInput
): Promise<WarehouseStockItem | null> {
  const collection = await getWarehouseStockCollection();
  const updateDoc: Record<string, unknown> = {
    ...updates,
    updatedAt: new Date(),
  };
  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: updateDoc },
    { returnDocument: 'after' }
  );
  return result.value;
}

export async function applyStockAdjustment(
  id: string,
  adjustment: AdjustmentInput
): Promise<{ item: WarehouseStockItem; adjustment: WarehouseStockAdjustment }> {
  const collection = await getWarehouseStockCollection();
  const adjustmentsCollection = await getWarehouseAdjustmentsCollection();
  const objectId = new ObjectId(id);
  const item = await collection.findOne({ _id: objectId });

  if (!item) {
    throw new Error('ITEM_NOT_FOUND');
  }

  const newQuantity = item.quantityOnHand + adjustment.delta;
  if (newQuantity < 0 && !item.allowNegative) {
    throw new Error('NEGATIVE_QUANTITY');
  }

  const now = new Date();
  const updateResult = await collection.findOneAndUpdate(
    { _id: objectId },
    {
      $set: {
        quantityOnHand: newQuantity,
        lastAdjustmentAt: now,
        lastAdjustmentBy: {
          id: adjustment.actorId,
          name: adjustment.actorName,
          role: adjustment.actorRole,
        },
        updatedAt: now,
      },
    },
    { returnDocument: 'after' }
  );

  if (!updateResult.value) {
    throw new Error('ITEM_NOT_FOUND');
  }

  const newAdjustment: WarehouseStockAdjustment = {
    itemId: objectId,
    delta: adjustment.delta,
    reason: adjustment.reason,
    note: adjustment.note,
    actorId: adjustment.actorId,
    actorName: adjustment.actorName,
    actorRole: adjustment.actorRole,
    resultingQuantity: newQuantity,
    createdAt: now,
  };

  const inserted = await adjustmentsCollection.insertOne(newAdjustment);

  return {
    item: updateResult.value,
    adjustment: { ...newAdjustment, _id: inserted.insertedId },
  };
}

export async function listAdjustmentsForItem(
  id: string,
  limit = 50
): Promise<WarehouseStockAdjustment[]> {
  const collection = await getWarehouseAdjustmentsCollection();
  return collection
    .find({ itemId: new ObjectId(id) })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
}

export async function setWarehouseItemStatus(
  id: string,
  status: WarehouseItemStatus
): Promise<WarehouseStockItem | null> {
  return updateWarehouseItem(id, { status });
}
