import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/shared/lib/auth";
import type { UserRole } from "@/features/auth/types/roles";

export const ADMIN_USERS_KEY = ["admin-users"];

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole | null;
  banned: boolean | null;
  banReason: string | null;
  banExpires: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateUserPayload = {
  name: string;
  email: string;
  password: string;
  role?: string;
};

export type UpdateUserPayload = {
  name?: string;
  role?: string;
};

export function useAdminUsers() {
  return useQuery({
    queryKey: ADMIN_USERS_KEY,
    queryFn: async () => {
      const response = await authClient.admin.listUsers({
        query: { limit: 100 },
      });
      if (response.error) {
        throw new Error(response.error.message || "Error fetching users");
      }
      return response.data?.users || [];
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateUserPayload) => {
      const response = await authClient.admin.createUser({
        email: payload.email,
        password: payload.password,
        name: payload.name,
        role: (payload.role || "warehouse") as "admin" | "user",
      });
      if (response.error) {
        throw new Error(response.error.message || "Error creating user");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_USERS_KEY });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateUserPayload }) => {
      const response = await authClient.admin.updateUser({
        userId: id,
        data: payload,
      });
      if (response.error) {
        throw new Error(response.error.message || "Error updating user");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_USERS_KEY });
    },
  });
}

export function useSetUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const response = await authClient.admin.setRole({
        userId,
        role: role as "admin" | "user",
      });
      if (response.error) {
        throw new Error(response.error.message || "Error setting role");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_USERS_KEY });
    },
  });
}

export function useBanUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, banReason }: { userId: string; banReason?: string }) => {
      const response = await authClient.admin.banUser({
        userId,
        banReason,
      });
      if (response.error) {
        throw new Error(response.error.message || "Error banning user");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_USERS_KEY });
    },
  });
}

export function useUnbanUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await authClient.admin.unbanUser({ userId });
      if (response.error) {
        throw new Error(response.error.message || "Error unbanning user");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_USERS_KEY });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await authClient.admin.removeUser({ userId });
      if (response.error) {
        throw new Error(response.error.message || "Error removing user");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_USERS_KEY });
    },
  });
}

export function useImpersonateUser() {
  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await authClient.admin.impersonateUser({ userId });
      if (response.error) {
        throw new Error(response.error.message || "Error impersonating user");
      }
      return response.data;
    },
    onSuccess: () => {
      // Reload the page to reflect new session
      window.location.href = "/dashboard";
    },
  });
}

export function useStopImpersonating() {
  return useMutation({
    mutationFn: async () => {
      const response = await authClient.admin.stopImpersonating();
      if (response.error) {
        throw new Error(response.error.message || "Error stopping impersonation");
      }
      return response.data;
    },
    onSuccess: () => {
      // Reload the page to return to admin session
      window.location.href = "/admin/users";
    },
  });
}
