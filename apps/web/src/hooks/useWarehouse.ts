import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchWarehouseItems,
  fetchWarehouseItemById,
  createWarehouseItem,
  updateWarehouseItem,
  deleteWarehouseItem,
  searchWarehouseItems,
  WarehouseFilters,
  CreateWarehouseItemInput,
  UpdateWarehouseItemInput,
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
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateWarehouseItemInput;
    }) => updateWarehouseItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WAREHOUSE_KEY });
    },
  });
}

export function useDeleteWarehouseItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteWarehouseItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WAREHOUSE_KEY });
    },
  });
}

export function useWarehouseSearch(q: string, limit: number = 10) {
  return useQuery({
    queryKey: [...WAREHOUSE_KEY, "search", q, limit],
    queryFn: () => searchWarehouseItems(q, limit),
    enabled: q.length >= 2,
  });
}
