import { API_URL } from "@/config/env";

// ============================================================================
// TYPES
// ============================================================================

export interface ReportExplorerNode {
  id: string;
  label: string;
  type: "subsystem" | "year" | "month" | "day" | "report";
  count: number;
  subsystemSlug?: string;
  year?: number;
  month?: number;
  day?: number;
}

export interface ReportItem {
  id: string;
  reportId: string;
  folio: string;
  subsystem: string;
  date: string;
  status: string;
  author?: string;
  description?: string;
}

export interface ReportExplorerParams {
  type: "work" | "warehouse";
  subsystemSlug?: string;
  year?: number;
  month?: number;
  day?: number;
}

export interface ReportExplorerResponse {
  path: ReportExplorerParams;
  folders: ReportExplorerNode[];
  reports: ReportItem[];
}

// ============================================================================
// API CLIENT
// ============================================================================

/**
 * Fetch reports explorer folder contents
 */
export async function fetchReportsExplorer(params: ReportExplorerParams): Promise<ReportExplorerResponse> {
  const url = new URL(`${API_URL}/api/reports-explorer/list`);
  
  url.searchParams.set("type", params.type);
  if (params.subsystemSlug) url.searchParams.set("subsystemSlug", params.subsystemSlug);
  if (params.year !== undefined) url.searchParams.set("year", String(params.year));
  if (params.month !== undefined) url.searchParams.set("month", String(params.month));
  if (params.day !== undefined) url.searchParams.set("day", String(params.day));

  const res = await fetch(url.toString());
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Failed to load" }));
    throw new Error(error.error || "Failed to fetch reports explorer");
  }
  return res.json();
}
