import { API_URL } from "@/config/env";

// ============================================================================
// TYPES
// ============================================================================

export interface ExplorerNode {
  id: string;
  label: string;
  type: "subsystem" | "year" | "month" | "day" | "reportType" | "report";
  count: number;
  subsystemSlug?: string;
  year?: number;
  month?: number;
  day?: number;
  reportType?: string;
  reportId?: string;
}

export interface ExplorerFileItem {
  id: string;
  key: string;
  originalName: string;
  mimeType: string;
  size: number;
  date: string;
  createdAt: string;
  createdBy?: string;
  status: string;
  reportId: string;
  reportType: string;
}

export interface ExplorerListParams {
  subsystemSlug?: string;
  year?: number;
  month?: number;
  day?: number;
  reportType?: string;
  reportId?: string;
}

export interface ExplorerListResponse {
  path: ExplorerListParams;
  folders: ExplorerNode[];
  files: ExplorerFileItem[];
}

export interface ExplorerSearchParams {
  q?: string;
  subsystemSlug?: string;
  reportType?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}

export interface SearchResult {
  fileId: string;
  key: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
  reportId: string;
  reportType: string;
  subsystem: string;
  subsystemSlug: string;
  datePath: string;
}

export interface ExplorerSearchResponse {
  query?: string;
  count: number;
  results: SearchResult[];
}

export interface ExplorerStatsResponse {
  totalFiles: number;
  totalSubsystems: number;
  byReportType: { work: number; warehouse: number };
}

// ============================================================================
// API CLIENT
// ============================================================================

/**
 * Fetch explorer folder contents (lazy loading)
 */
export async function fetchExplorerList(params: ExplorerListParams): Promise<ExplorerListResponse> {
  const url = new URL(`${API_URL}/api/evidences/explorer/list`);
  
  if (params.subsystemSlug) url.searchParams.set("subsystemSlug", params.subsystemSlug);
  if (params.year !== undefined) url.searchParams.set("year", String(params.year));
  if (params.month !== undefined) url.searchParams.set("month", String(params.month));
  if (params.day !== undefined) url.searchParams.set("day", String(params.day));
  if (params.reportType) url.searchParams.set("reportType", params.reportType);
  if (params.reportId) url.searchParams.set("reportId", params.reportId);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Failed to load" }));
    throw new Error(error.error || "Failed to fetch explorer list");
  }
  return res.json();
}

/**
 * Search evidences
 */
export async function fetchExplorerSearch(params: ExplorerSearchParams): Promise<ExplorerSearchResponse> {
  const url = new URL(`${API_URL}/api/evidences/explorer/search`);
  
  if (params.q) url.searchParams.set("q", params.q);
  if (params.subsystemSlug) url.searchParams.set("subsystemSlug", params.subsystemSlug);
  if (params.reportType) url.searchParams.set("reportType", params.reportType);
  if (params.dateFrom) url.searchParams.set("dateFrom", params.dateFrom);
  if (params.dateTo) url.searchParams.set("dateTo", params.dateTo);
  if (params.limit) url.searchParams.set("limit", String(params.limit));

  const res = await fetch(url.toString());
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Search failed" }));
    throw new Error(error.error || "Failed to search evidences");
  }
  return res.json();
}

/**
 * Fetch explorer stats
 */
export async function fetchExplorerStats(): Promise<ExplorerStatsResponse> {
  const res = await fetch(`${API_URL}/api/evidences/explorer/stats`);
  if (!res.ok) {
    throw new Error("Failed to fetch stats");
  }
  return res.json();
}
