import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchWarehouseItems,
  fetchWarehouseItemById,
  createWarehouseItem,
  updateWarehouseItem,
  adjustWarehouseStock,
  fetchWarehouseAdjustments,
  WarehouseFilters,
  CreateWarehouseItemInput,
  UpdateWarehouseItemInput,
  AdjustmentInput,
} from "@/api/warehouseClient";

const WAREHOUSE_KEY = ["warehouse"];

export function useWarehouseItems(filters: WarehouseFilters = {}) {
  return useQuery({
    queryKey: [...WAREHOUSE_KEY, "items", filters],
    queryFn: () => fetchWarehouseItems(filters),
  });
}

export function useWarehouseItem(id: string | undefined) {
  return useQuery({
    queryKey: [...WAREHOUSE_KEY, "item", id],
    queryFn: () => fetchWarehouseItemById(id!),
    enabled: !!id,
  });
}

export function useCreateWarehouseItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateWarehouseItemInput) => createWarehouseItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WAREHOUSE_KEY });
    },
  });
}

export function useUpdateWarehouseItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWarehouseItemInput }) =>
      updateWarehouseItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WAREHOUSE_KEY });
    },
  });
}

export function useAdjustWarehouseStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, adjustment }: { id: string; adjustment: AdjustmentInput }) =>
      adjustWarehouseStock(id, adjustment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WAREHOUSE_KEY });
    },
  });
}

export function useWarehouseAdjustments(id: string | undefined, limit?: number) {
  return useQuery({
    queryKey: [...WAREHOUSE_KEY, "adjustments", id, limit],
    queryFn: () => fetchWarehouseAdjustments(id!, limit),
    enabled: !!id,
  });
}

// Helper hooks for specific filters
export function useLowStockItems() {
  return useWarehouseItems({ lowStock: true });
}

export function useWarehouseItemsByCategory(category: string) {
  return useWarehouseItems({ category });
}

export function useActiveWarehouseItems() {
  return useWarehouseItems({ status: "active" });
}
