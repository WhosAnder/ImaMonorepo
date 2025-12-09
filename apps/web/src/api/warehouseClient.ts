import { API_URL } from "@/config/env";

// Types
export interface WarehouseItem {
  _id: string;
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
  status: "active" | "inactive";
  availableQuantity: number;
  isBelowMinimum: boolean;
  isAboveMaximum: boolean;
  needsReorder: boolean;
  lastAdjustmentAt?: string;
  lastAdjustmentBy?: {
    id?: string;
    name?: string;
    role?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseAdjustment {
  _id: string;
  itemId: string;
  delta: number;
  reason: "initial" | "increase" | "decrease" | "correction" | "damage" | "audit";
  note?: string;
  actorId?: string;
  actorName?: string;
  actorRole?: string;
  resultingQuantity: number;
  createdAt: string;
}

export interface WarehouseFilters {
  category?: string;
  location?: string;
  status?: "active" | "inactive";
  search?: string;
  lowStock?: boolean;
}

export interface CreateWarehouseItemInput {
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
}

export interface UpdateWarehouseItemInput {
  sku?: string;
  name?: string;
  description?: string;
  category?: string;
  location?: string;
  unit?: string;
  minQuantity?: number;
  maxQuantity?: number;
  reorderPoint?: number;
  allowNegative?: boolean;
  tags?: string[];
  status?: "active" | "inactive";
}

export interface AdjustmentInput {
  delta: number;
  reason: "initial" | "increase" | "decrease" | "correction" | "damage" | "audit";
  note?: string;
}

// API Functions

export async function fetchWarehouseItems(
  filters: WarehouseFilters = {}
): Promise<WarehouseItem[]> {
  const params = new URLSearchParams();
  if (filters.category) params.append("category", filters.category);
  if (filters.location) params.append("location", filters.location);
  if (filters.status) params.append("status", filters.status);
  if (filters.search) params.append("search", filters.search);
  if (filters.lowStock !== undefined)
    params.append("lowStock", String(filters.lowStock));

  const response = await fetch(`${API_URL}/api/warehouse?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to fetch warehouse items");
  }
  return response.json();
}

export async function fetchWarehouseItemById(id: string): Promise<WarehouseItem> {
  const response = await fetch(`${API_URL}/api/warehouse/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch warehouse item");
  }
  return response.json();
}

export async function createWarehouseItem(
  data: CreateWarehouseItemInput
): Promise<WarehouseItem> {
  const response = await fetch(`${API_URL}/api/warehouse`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    if (response.status === 409) {
      throw new Error("SKU_ALREADY_EXISTS");
    }
    throw new Error(error.error || "Failed to create warehouse item");
  }
  return response.json();
}

export async function updateWarehouseItem(
  id: string,
  data: UpdateWarehouseItemInput
): Promise<WarehouseItem> {
  const response = await fetch(`${API_URL}/api/warehouse/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to update warehouse item");
  }
  return response.json();
}

export async function adjustWarehouseStock(
  id: string,
  adjustment: AdjustmentInput
): Promise<{ item: WarehouseItem; adjustment: WarehouseAdjustment }> {
  const response = await fetch(`${API_URL}/api/warehouse/${id}/adjustments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(adjustment),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to adjust stock");
  }
  return response.json();
}

export async function fetchWarehouseAdjustments(
  id: string,
  limit?: number
): Promise<WarehouseAdjustment[]> {
  const params = new URLSearchParams();
  if (limit) params.append("limit", String(limit));

  const response = await fetch(
    `${API_URL}/api/warehouse/${id}/adjustments?${params.toString()}`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch adjustments");
  }
  return response.json();
}
