import { useAuth } from "@/auth/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

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

  const res = await fetch(`${API_URL}/workers?${params.toString()}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch workers");
  return res.json();
}

export async function createWorker(data: CreateWorkerInput): Promise<Worker> {
  const res = await fetch(`${API_URL}/workers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
  const res = await fetch(`${API_URL}/workers/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update worker");
  return res.json();
}

export async function deleteWorker(id: string): Promise<Worker> {
  const res = await fetch(`${API_URL}/workers/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to delete worker");
  return res.json();
}
