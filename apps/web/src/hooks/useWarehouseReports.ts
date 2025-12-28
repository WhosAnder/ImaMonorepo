import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchWarehouseReports,
  fetchWarehouseReportsPaginated,
  fetchWarehouseReportById,
  createWarehouseReport,
  updateWarehouseReport,
  deleteWarehouseReport,
  PaginatedResponse,
  PaginationParams,
} from "../api/reportsClient";
import { WarehouseReportListItem } from "@/features/almacen/types/warehouseReportList";
import { WarehouseReport } from "@/features/almacen/types/warehouseReport";

interface UseWarehouseReportsQueryOptions {
  enabled?: boolean;
  pagination?: PaginationParams;
}

export function useWarehouseReportsQuery(
  options?: UseWarehouseReportsQueryOptions,
) {
  return useQuery({
    queryKey: ["warehouseReports", options?.pagination],
    queryFn: () => fetchWarehouseReports(options?.pagination),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: options?.enabled ?? true,
  });
}

export function useWarehouseReportsPaginatedQuery(
  pagination?: PaginationParams,
  options?: { enabled?: boolean },
) {
  return useQuery<PaginatedResponse<WarehouseReportListItem>>({
    queryKey: ["warehouseReports", "paginated", pagination],
    queryFn: () => fetchWarehouseReportsPaginated(pagination),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: options?.enabled ?? true,
  });
}

export function useWarehouseReportQuery(id: string) {
  return useQuery({
    queryKey: ["warehouseReports", id],
    queryFn: () => fetchWarehouseReportById(id),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useCreateWarehouseReportMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createWarehouseReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouseReports"] });
    },
  });
}

export function useUpdateWarehouseReportMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<WarehouseReport> }) =>
      updateWarehouseReport(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["warehouseReports"] });
      queryClient.invalidateQueries({ queryKey: ["warehouseReports", variables.id] });
    },
  });
}

export function useDeleteWarehouseReportMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteWarehouseReport(id),
    onSuccess: () => {
      // Invalidate all warehouseReports queries with immediate refetch
      queryClient.invalidateQueries({ 
        queryKey: ["warehouseReports"],
        refetchType: 'all'
      });
    },
  });
}
