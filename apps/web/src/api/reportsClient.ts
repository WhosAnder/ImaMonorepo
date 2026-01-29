import { WorkReport } from "@/features/reports/types/workReport";
import { WorkReportListItem } from "@/features/reports/types/workReportList";
import { WarehouseReport } from "@/features/almacen/types/warehouseReport";
import { WarehouseReportListItem } from "@/features/almacen/types/warehouseReportList";
import { API_URL } from "../config/env";

const AUTH_STORAGE_KEY = "ima_auth_user";

// Helper to get auth headers for protected requests
function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};

  const stored = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!stored) return {};

  try {
    const user = JSON.parse(stored);
    return {
      "x-user-id": user.id || "",
      "x-user-name": user.name || "",
      "x-user-role": user.role || "warehouse",
    };
  } catch {
    return {};
  }
}

// Pagination types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

// Work reports
export async function fetchWorkReports(
  pagination?: PaginationParams,
): Promise<WorkReportListItem[]> {
  const url = new URL(`${API_URL}/api/reports`);
  if (pagination?.limit)
    url.searchParams.set("limit", String(pagination.limit));
  if (pagination?.offset)
    url.searchParams.set("offset", String(pagination.offset));

  const res = await fetch(url.toString(), {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Error fetching work reports");

  const result: PaginatedResponse<WorkReportListItem> = await res.json();
  return result.data;
}

export async function fetchWorkReportsPaginated(
  pagination?: PaginationParams,
): Promise<PaginatedResponse<WorkReportListItem>> {
  const url = new URL(`${API_URL}/api/reports`);
  if (pagination?.limit)
    url.searchParams.set("limit", String(pagination.limit));
  if (pagination?.offset)
    url.searchParams.set("offset", String(pagination.offset));

  const res = await fetch(url.toString(), {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Error fetching work reports");

  return res.json();
}

export async function fetchWorkReportById(id: string): Promise<WorkReport> {
  const res = await fetch(`${API_URL}/api/reports/${id}`, {
    credentials: "include",
  });
  if (!res.ok) {
    if (res.status === 404) throw new Error("NOT_FOUND");
    throw new Error("Error fetching work report");
  }
  return res.json();
}

export async function createWorkReport(data: any): Promise<WorkReport> {
  const res = await fetch(`${API_URL}/api/reports`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("API Error:", res.status, res.statusText, errorText);
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch (e) {
      errorData = { error: errorText || "Unknown error" };
    }

    // Create enhanced error with code and status
    const error: any = new Error(
      errorData.error || "Error creating work report",
    );
    error.code = errorData.code;
    error.status = res.status;
    error.retryAfter = errorData.retryAfter;
    error.message = errorData.message || error.message;
    throw error;
  }
  return res.json();
}

export async function updateWorkReport(
  id: string,
  data: Partial<WorkReport>,
): Promise<WorkReport> {
  const res = await fetch(`${API_URL}/api/reports/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("API Error:", res.status, res.statusText, errorText);
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch (e) {
      errorData = { error: errorText || "Unknown error" };
    }
    throw new Error(errorData.error || "Error updating work report");
  }
  return res.json();
}

export async function deleteWorkReport(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/reports/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
    credentials: "include",
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Error deleting work report");
  }
}

// Warehouse reports
export async function fetchWarehouseReports(
  pagination?: PaginationParams,
): Promise<WarehouseReportListItem[]> {
  const url = new URL(`${API_URL}/api/warehouse-reports`);
  if (pagination?.limit)
    url.searchParams.set("limit", String(pagination.limit));
  if (pagination?.offset)
    url.searchParams.set("offset", String(pagination.offset));

  const res = await fetch(url.toString(), {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Error fetching warehouse reports");

  const result: PaginatedResponse<WarehouseReportListItem> = await res.json();
  return result.data;
}

export async function fetchWarehouseReportsPaginated(
  pagination?: PaginationParams,
): Promise<PaginatedResponse<WarehouseReportListItem>> {
  const url = new URL(`${API_URL}/api/warehouse-reports`);
  if (pagination?.limit)
    url.searchParams.set("limit", String(pagination.limit));
  if (pagination?.offset)
    url.searchParams.set("offset", String(pagination.offset));

  const res = await fetch(url.toString(), {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Error fetching warehouse reports");

  return res.json();
}

export async function fetchWarehouseReportById(
  id: string,
): Promise<WarehouseReport> {
  const res = await fetch(`${API_URL}/api/warehouse-reports/${id}`, {
    credentials: "include",
  });
  if (!res.ok) {
    if (res.status === 404) throw new Error("NOT_FOUND");
    throw new Error("Error fetching warehouse report");
  }
  return res.json();
}

export async function createWarehouseReport(
  data: any,
): Promise<WarehouseReport> {
  const res = await fetch(`${API_URL}/api/warehouse-reports`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Error creating warehouse report");
  }
  return res.json();
}

export async function updateWarehouseReport(
  id: string,
  data: Partial<WarehouseReport>,
): Promise<WarehouseReport> {
  const res = await fetch(`${API_URL}/api/warehouse-reports/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Error updating warehouse report");
  }
  return res.json();
}

export async function deleteWarehouseReport(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/warehouse-reports/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
    credentials: "include",
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Error deleting warehouse report");
  }
}
