import { WorkReport } from "@/features/reports/types/workReport";
import { WorkReportListItem } from "@/features/reports/types/workReportList";
import { WarehouseReport } from "@/features/almacen/types/warehouseReport";
import { WarehouseReportListItem } from "@/features/almacen/types/warehouseReportList";
import { API_URL } from "../config/env";

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
  if (pagination?.limit) url.searchParams.set("limit", String(pagination.limit));
  if (pagination?.offset)
    url.searchParams.set("offset", String(pagination.offset));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Error fetching work reports");

  const result: PaginatedResponse<WorkReportListItem> = await res.json();
  return result.data;
}

export async function fetchWorkReportsPaginated(
  pagination?: PaginationParams,
): Promise<PaginatedResponse<WorkReportListItem>> {
  const url = new URL(`${API_URL}/api/reports`);
  if (pagination?.limit) url.searchParams.set("limit", String(pagination.limit));
  if (pagination?.offset)
    url.searchParams.set("offset", String(pagination.offset));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Error fetching work reports");

  return res.json();
}

export async function fetchWorkReportById(id: string): Promise<WorkReport> {
  const res = await fetch(`${API_URL}/api/reports/${id}`);
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
    throw new Error(errorData.error || "Error creating work report");
  }
  return res.json();
}

// Warehouse reports
export async function fetchWarehouseReports(
  pagination?: PaginationParams,
): Promise<WarehouseReportListItem[]> {
  const url = new URL(`${API_URL}/api/warehouse-reports`);
  if (pagination?.limit) url.searchParams.set("limit", String(pagination.limit));
  if (pagination?.offset)
    url.searchParams.set("offset", String(pagination.offset));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Error fetching warehouse reports");

  const result: PaginatedResponse<WarehouseReportListItem> = await res.json();
  return result.data;
}

export async function fetchWarehouseReportsPaginated(
  pagination?: PaginationParams,
): Promise<PaginatedResponse<WarehouseReportListItem>> {
  const url = new URL(`${API_URL}/api/warehouse-reports`);
  if (pagination?.limit) url.searchParams.set("limit", String(pagination.limit));
  if (pagination?.offset)
    url.searchParams.set("offset", String(pagination.offset));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Error fetching warehouse reports");

  return res.json();
}

export async function fetchWarehouseReportById(
  id: string,
): Promise<WarehouseReport> {
  const res = await fetch(`${API_URL}/api/warehouse-reports/${id}`);
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
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Error creating warehouse report");
  }
  return res.json();
}
