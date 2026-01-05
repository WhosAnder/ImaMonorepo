import { API_URL } from "@/config/env";

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
      "x-user-role": user.role || "user",
    };
  } catch {
    return {};
  }
}

export interface Worker {
  _id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkerInput {
  name: string;
}

export interface UpdateWorkerInput {
  name?: string;
  active?: boolean;
}

export async function listWorkers(
  search?: string,
  includeInactive: boolean = false
): Promise<Worker[]> {
  const params = new URLSearchParams();
  if (search) params.append("q", search);
  if (includeInactive) params.append("includeInactive", "true");

  const res = await fetch(`${API_URL}/api/workers?${params.toString()}`, {
    credentials: "include",
    headers: {
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) {
    const errorText = await res.text();
    console.error("Failed to fetch workers:", res.status, errorText);
    throw new Error(`Failed to fetch workers: ${res.status} ${errorText}`);
  }
  return res.json();
}

export async function createWorker(data: CreateWorkerInput): Promise<Worker> {
  const res = await fetch(`${API_URL}/api/workers`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create worker");
  return res.json();
}

export async function updateWorker(
  id: string,
  data: UpdateWorkerInput
): Promise<Worker> {
  const res = await fetch(`${API_URL}/api/workers/${id}`, {
    method: "PATCH",
    headers: { 
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update worker");
  return res.json();
}

export async function deleteWorker(id: string): Promise<Worker> {
  const res = await fetch(`${API_URL}/api/workers/${id}`, {
    method: "DELETE",
    headers: {
      ...getAuthHeaders(),
    },
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to delete worker");
  return res.json();
}
