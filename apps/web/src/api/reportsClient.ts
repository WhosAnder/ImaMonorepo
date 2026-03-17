import { REPORTS_URL } from "@/config/env";

// ============================================================================
// Types matching the Go reports microservice model
// ============================================================================

export interface ReportResponse {
  id: string;
  reportType: "work" | "warehouse";
  folio: string;
  subsystem: string;
  title: string;
  status: string;
  schemaVersion: number;
  data: Record<string, any>;
  stock?: StockSync;
  createdAt: string;
  updatedAt: string;
}

export interface StockSync {
  reservationId?: string;
  status: string;
  idempotencyKey?: string;
  expiresAt?: string;
  lastError?: {
    code: string;
    message: string;
    timestamp: string;
  };
  updatedAt: string;
}

export interface PaginatedReportsResponse {
  items: ReportResponse[];
  pagination: {
    page?: number;
    limit: number;
    total: number;
    nextCursor?: string | null;
  };
}

export interface ReportListParams {
  page?: number;
  limit?: number;
  cursor?: string;
  folio?: string;
  status?: string;
  // Data filters use dot notation: data.subsistema=value
  [key: string]: string | number | undefined;
}

export interface CreateReportInput {
  title: string;
  subsystem: string;
  status?: string;
  schemaVersion?: number;
  data: Record<string, any>;
  stock?: {
    idempotencyKey?: string;
    ttlMinutes?: number;
    items: { sku: string; qty: number }[];
  };
}

export interface UpdateReportInput {
  title?: string;
  status?: string;
  schemaVersion?: number;
  data?: Record<string, any>;
}

// Backward-compatible aliases for hooks that import old names
export type PaginatedResponse<T> = { items: T[]; pagination: PaginatedReportsResponse["pagination"] };
export type PaginationParams = ReportListParams;

// Helper to get auth headers
function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const stored = localStorage.getItem("ima_auth_user");
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

// ============================================================================
// Work Reports — consuming ima-reports-service via gateway at /reports/work
// ============================================================================

export async function fetchWorkReports(
  params: ReportListParams = {},
): Promise<ReportResponse[]> {
  const url = new URL(`${REPORTS_URL}/work`);
  if (params.page) url.searchParams.set("page", String(params.page));
  if (params.limit) url.searchParams.set("limit", String(params.limit));
  if (params.cursor) url.searchParams.set("cursor", params.cursor);
  if (params.folio) url.searchParams.set("folio", params.folio);
  if (params.status) url.searchParams.set("status", params.status);

  // Forward data filters
  for (const [key, value] of Object.entries(params)) {
    if (key.startsWith("data.") && value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }

  const res = await fetch(url.toString(), {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Error fetching work reports");

  const result: PaginatedReportsResponse = await res.json();
  return result.items;
}

export async function fetchWorkReportsPaginated(
  params: ReportListParams = {},
): Promise<PaginatedReportsResponse> {
  const url = new URL(`${REPORTS_URL}/work`);
  if (params.page) url.searchParams.set("page", String(params.page));
  if (params.limit) url.searchParams.set("limit", String(params.limit));
  if (params.cursor) url.searchParams.set("cursor", params.cursor);
  if (params.folio) url.searchParams.set("folio", params.folio);
  if (params.status) url.searchParams.set("status", params.status);

  for (const [key, value] of Object.entries(params)) {
    if (key.startsWith("data.") && value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }

  const res = await fetch(url.toString(), {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Error fetching work reports");

  return res.json();
}

export async function fetchWorkReportById(
  id: string,
): Promise<ReportResponse> {
  const res = await fetch(`${REPORTS_URL}/work/${id}`, {
    credentials: "include",
  });
  if (!res.ok) {
    if (res.status === 404) throw new Error("NOT_FOUND");
    throw new Error("Error fetching work report");
  }
  return res.json();
}

export async function createWorkReport(
  data: CreateReportInput,
): Promise<ReportResponse> {
  const res = await fetch(`${REPORTS_URL}/work`, {
    method: "POST",
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
  data: UpdateReportInput,
): Promise<ReportResponse> {
  const res = await fetch(`${REPORTS_URL}/work/${id}`, {
    method: "PATCH",
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
  const res = await fetch(`${REPORTS_URL}/work/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
    credentials: "include",
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Error deleting work report");
  }
}

// ============================================================================
// Warehouse Reports — consuming ima-reports-service via gateway at /reports/warehouse
// ============================================================================

export async function fetchWarehouseReports(
  params: ReportListParams = {},
): Promise<ReportResponse[]> {
  const url = new URL(`${REPORTS_URL}/warehouse`);
  if (params.page) url.searchParams.set("page", String(params.page));
  if (params.limit) url.searchParams.set("limit", String(params.limit));
  if (params.cursor) url.searchParams.set("cursor", params.cursor);
  if (params.folio) url.searchParams.set("folio", params.folio);
  if (params.status) url.searchParams.set("status", params.status);

  for (const [key, value] of Object.entries(params)) {
    if (key.startsWith("data.") && value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }

  const res = await fetch(url.toString(), {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Error fetching warehouse reports");

  const result: PaginatedReportsResponse = await res.json();
  return result.items;
}

export async function fetchWarehouseReportsPaginated(
  params: ReportListParams = {},
): Promise<PaginatedReportsResponse> {
  const url = new URL(`${REPORTS_URL}/warehouse`);
  if (params.page) url.searchParams.set("page", String(params.page));
  if (params.limit) url.searchParams.set("limit", String(params.limit));
  if (params.cursor) url.searchParams.set("cursor", params.cursor);
  if (params.folio) url.searchParams.set("folio", params.folio);
  if (params.status) url.searchParams.set("status", params.status);

  for (const [key, value] of Object.entries(params)) {
    if (key.startsWith("data.") && value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }

  const res = await fetch(url.toString(), {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Error fetching warehouse reports");

  return res.json();
}

export async function fetchWarehouseReportById(
  id: string,
): Promise<ReportResponse> {
  const res = await fetch(`${REPORTS_URL}/warehouse/${id}`, {
    credentials: "include",
  });
  if (!res.ok) {
    if (res.status === 404) throw new Error("NOT_FOUND");
    throw new Error("Error fetching warehouse report");
  }
  return res.json();
}

export async function createWarehouseReport(
  data: CreateReportInput,
): Promise<ReportResponse> {
  const res = await fetch(`${REPORTS_URL}/warehouse`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
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
  data: UpdateReportInput,
): Promise<ReportResponse> {
  const res = await fetch(`${REPORTS_URL}/warehouse/${id}`, {
    method: "PATCH",
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
  const res = await fetch(`${REPORTS_URL}/warehouse/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
    credentials: "include",
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Error deleting warehouse report");
  }
}
