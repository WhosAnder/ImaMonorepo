import type { UserRole } from "@/features/auth/types/roles";

const AUTH_BASE_URL =
  process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:5001/auth";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  mustChangePassword: boolean;
  createdAt: string;
};

export type CreateUserPayload = {
  name: string;
  email: string;
  role: UserRole;
  tempPassword: string;
};

export type UpdateUserPayload = Partial<{
  name: string;
  role: UserRole;
  active: boolean;
  mustChangePassword: boolean;
}>;

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const response = await fetch(`${AUTH_BASE_URL}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include", // Important for BetterAuth session cookies
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}

export const adminUsersClient = {
  fetchUsers: async (): Promise<User[]> => {
    return fetchWithAuth("/admin/users");
  },

  createUser: async (payload: CreateUserPayload): Promise<User> => {
    return fetchWithAuth("/admin/users", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  updateUser: async (id: string, payload: UpdateUserPayload): Promise<User> => {
    return fetchWithAuth(`/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  deleteUser: async (id: string): Promise<void> => {
    return fetchWithAuth(`/admin/users/${id}`, {
      method: "DELETE",
    });
  },
};
