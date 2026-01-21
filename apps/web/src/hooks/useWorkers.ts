import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listWorkers,
  createWorker,
  updateWorker,
  deleteWorker,
  toggleWorkerActive,
  permanentlyDeleteWorker,
  CreateWorkerInput,
  UpdateWorkerInput,
} from "../api/workersClient";

export const WORKERS_KEYS = {
  all: ["workers"] as const,
  lists: () => [...WORKERS_KEYS.all, "list"] as const,
  list: (search?: string, includeInactive?: boolean) =>
    [...WORKERS_KEYS.lists(), { search, includeInactive }] as const,
};

export function useWorkers(search?: string, includeInactive: boolean = false) {
  return useQuery({
    queryKey: WORKERS_KEYS.list(search, includeInactive),
    queryFn: () => listWorkers(search, includeInactive),
  });
}

export function useCreateWorker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateWorkerInput) => createWorker(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKERS_KEYS.lists() });
    },
  });
}

export function useUpdateWorker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWorkerInput }) =>
      updateWorker(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKERS_KEYS.lists() });
    },
  });
}

export function useDeleteWorker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteWorker(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKERS_KEYS.lists() });
    },
  });
}

export function useToggleWorkerActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => toggleWorkerActive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKERS_KEYS.lists() });
    },
  });
}

export function usePermanentlyDeleteWorker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => permanentlyDeleteWorker(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKERS_KEYS.lists() });
    },
  });
}
