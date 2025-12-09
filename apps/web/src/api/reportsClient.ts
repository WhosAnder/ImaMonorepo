import { WorkReport } from "@/features/reports/types/workReport";
import { WorkReportListItem } from "@/features/reports/types/workReportList";
import { WarehouseReport } from "@/features/almacen/types/warehouseReport";
import { WarehouseReportListItem } from '@/features/almacen/types/warehouseReportList';
import { API_URL } from "../config/env";

// Work reports
export async function fetchWorkReports(): Promise<WorkReportListItem[]> {
  const res = await fetch(`${API_URL}/api/reports`);
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
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
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
export async function fetchWarehouseReports(): Promise<WarehouseReportListItem[]> {
  const res = await fetch(`${API_URL}/api/warehouse-reports`);
  if (!res.ok) throw new Error("Error fetching warehouse reports");
  return res.json();
}

export async function fetchWarehouseReportById(id: string): Promise<WarehouseReport> {
  const res = await fetch(`${API_URL}/api/warehouse-reports/${id}`);
  if (!res.ok) {
    if (res.status === 404) throw new Error("NOT_FOUND");
    throw new Error("Error fetching warehouse report");
  }
  return res.json();
}

export async function createWarehouseReport(data: any): Promise<WarehouseReport> {
  const res = await fetch(`${API_URL}/api/warehouse-reports`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Error creating warehouse report");
  }
  return res.json();
}
