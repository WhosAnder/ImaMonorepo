import { WAREHOUSE_URL } from "@/config/env";

// Types matching the Go warehouse microservice model
export interface WarehouseItem {
  id: string; // UUID (not MongoDB ObjectId)
  sku: string;
  name: string;
  description?: string;
  category?: string;
  unit: string;
  stock: number;
  available_qty: number;
  reserved_qty: number;
  version: number;
  active: boolean;
  location: string;
  tags: string[];
  min_quantity: number;
  max_quantity?: number;
  reorder_point: number;
  allow_negative: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
}

export interface WarehouseFilters {
  page?: number;
  limit?: number;
  search?: string;
}

export interface CreateWarehouseItemInput {
  sku: string;
  name: string;
  description?: string;
  category?: string;
  unit?: string;
  stock: number;
  active: boolean;
  location: string;
  tags?: string[];
  min_quantity?: number;
  max_quantity?: number;
  reorder_point?: number;
  allow_negative?: boolean;
}

export interface UpdateWarehouseItemInput {
  sku?: string;
  name?: string;
  description?: string;
  category?: string;
  unit?: string;
  stock?: number;
  active?: boolean;
  location?: string;
  tags?: string[];
  min_quantity?: number;
  max_quantity?: number;
  reorder_point?: number;
  allow_negative?: boolean;
}

// Helper to get auth headers
function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const stored = localStorage.getItem("ima_auth_user");
    if (!stored) return {};
    const user = JSON.parse(stored);
    return {
      "x-user-id": String(user.id || ""),
      "x-user-role": String(user.role || ""),
      "x-user-name": String(user.name || ""),
    };
  } catch (e) {
    return {};
  }
}

// ============================================================================
// API Functions — consuming ima-warehouse-service via gateway
// ============================================================================

export async function fetchWarehouseItems(
  filters: WarehouseFilters = {},
): Promise<WarehouseItem[]> {
  const params = new URLSearchParams();
  if (filters.page !== undefined) params.append("page", String(filters.page));
  if (filters.limit !== undefined)
    params.append("limit", String(filters.limit));

  const qs = params.toString();
  const url = qs ? `${WAREHOUSE_URL}/?${qs}` : `${WAREHOUSE_URL}/`;

  const response = await fetch(url, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch warehouse items");
  }
  const result = await response.json();
  return result.data ?? [];
}

export async function searchWarehouseItems(
  q: string,
  limit: number = 10,
): Promise<{ id: string; sku: string; name: string }[]> {
  const params = new URLSearchParams();
  params.append("q", q);
  params.append("limit", String(limit));

  const response = await fetch(
    `${WAREHOUSE_URL}/search?${params.toString()}`,
    {
      credentials: "include",
    },
  );
  if (!response.ok) {
    throw new Error("Failed to search warehouse items");
  }
  const result = await response.json();
  return result.data ?? [];
}

export async function fetchWarehouseItemById(
  id: string,
): Promise<WarehouseItem> {
  const response = await fetch(`${WAREHOUSE_URL}/${id}`, {
    credentials: "include",
  });
  if (!response.ok) {
    if (response.status === 404) throw new Error("NOT_FOUND");
    throw new Error("Failed to fetch warehouse item");
  }
  const result = await response.json();
  return result.data;
}

export async function createWarehouseItem(
  data: CreateWarehouseItemInput,
): Promise<WarehouseItem> {
  const response = await fetch(`${WAREHOUSE_URL}/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    if (response.status === 409) {
      throw new Error("SKU_ALREADY_EXISTS");
    }
    throw new Error(error.error || "Failed to create warehouse item");
  }
  const result = await response.json();
  return result.data;
}

export async function updateWarehouseItem(
  id: string,
  data: UpdateWarehouseItemInput,
): Promise<WarehouseItem> {
  const response = await fetch(`${WAREHOUSE_URL}/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to update warehouse item");
  }
  const result = await response.json();
  return result.data;
}

export async function deleteWarehouseItem(
  id: string,
): Promise<WarehouseItem> {
  const response = await fetch(`${WAREHOUSE_URL}/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    credentials: "include",
  });
  if (!response.ok) {
    if (response.status === 404) throw new Error("NOT_FOUND");
    throw new Error("Failed to delete warehouse item");
  }
  const result = await response.json();
  return result.data;
}
