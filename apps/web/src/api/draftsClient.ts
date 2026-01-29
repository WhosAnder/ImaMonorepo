import { API_URL } from "../config/env";

const AUTH_STORAGE_KEY = "ima_auth_user";

export type DraftReportType = "work" | "warehouse";

export interface DraftPayload {
  reportType: DraftReportType;
  formData: Record<string, unknown>;
  evidenceRefs?: Array<Record<string, unknown>>;
  signatureRefs?: Record<string, unknown>;
  status?: "active" | "completed";
}

export interface DraftResponse extends DraftPayload {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};

  const stored = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!stored) return {};

  try {
    const user = JSON.parse(stored);
    return {
      "x-user-id": user.id || "",
      "x-user-name": user.name || "",
      "x-user-role": user.role || "user",
    };
  } catch {
    return {};
  }
}

export async function fetchDraft(
  reportType: DraftReportType,
): Promise<DraftResponse | null> {
  const url = new URL(`${API_URL}/api/drafts`);
  url.searchParams.set("reportType", reportType);
  const res = await fetch(url.toString(), {
    headers: {
      ...getAuthHeaders(),
    },
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error("Error fetching draft");
  }

  return res.json();
}

export async function createDraft(payload: DraftPayload): Promise<DraftResponse> {
  const res = await fetch(`${API_URL}/api/drafts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Error creating draft");
  }

  return res.json();
}

export async function updateDraft(
  id: string,
  payload: DraftPayload,
): Promise<DraftResponse> {
  const res = await fetch(`${API_URL}/api/drafts/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Error updating draft");
  }

  return res.json();
}

export async function deleteDraft(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/drafts/${id}`, {
    method: "DELETE",
    headers: {
      ...getAuthHeaders(),
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Error deleting draft");
  }
}
