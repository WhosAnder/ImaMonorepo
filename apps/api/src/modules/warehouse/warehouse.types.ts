import { ObjectId } from 'mongodb';
import { UserRole } from '../../types/auth';

export type WarehouseItemStatus = 'active' | 'inactive';
export type WarehouseAdjustmentReason =
  | 'initial'
  | 'increase'
  | 'decrease'
  | 'correction'
  | 'damage'
  | 'audit';

export interface WarehouseStockItem {
  _id?: ObjectId;
  sku: string;
  name: string;
  description?: string;
  category?: string;
  location?: string;
  unit?: string;
  quantityOnHand: number;
  minQuantity?: number;
  maxQuantity?: number;
  reorderPoint?: number;
  allowNegative?: boolean;
  tags?: string[];
  status: WarehouseItemStatus;
  lastAdjustmentAt?: Date;
  lastAdjustmentBy?: {
    id?: string;
    name?: string;
    role?: UserRole;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface WarehouseStockAdjustment {
  _id?: ObjectId;
  itemId: ObjectId;
  delta: number;
  reason: WarehouseAdjustmentReason;
  note?: string;
  actorId?: string;
  actorName?: string;
  actorRole?: UserRole;
  resultingQuantity: number;
  createdAt: Date;
}

export interface WarehouseStockFilters {
  search?: string;
  category?: string;
  location?: string;
  status?: WarehouseItemStatus;
  lowStock?: boolean;
}
