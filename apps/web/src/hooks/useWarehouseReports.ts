import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchWarehouseReports,
  fetchWarehouseReportsPaginated,
  fetchWarehouseReportById,
  createWarehouseReport,
  updateWarehouseReport,
  deleteWarehouseReport,
  ReportResponse,
  PaginatedReportsResponse,
  ReportListParams,
} from "../api/reportsClient";

export function useWarehouseReportsQuery(
  options?: { enabled?: boolean; pagination?: ReportListParams },
) {
  return useQuery({
    queryKey: ["warehouseReports", options?.pagination],
    queryFn: () => fetchWarehouseReports(options?.pagination),
    staleTime: 1000 * 60 * 5,
    enabled: options?.enabled ?? true,
  });
}

export function useWarehouseReportsPaginatedQuery(
  pagination?: ReportListParams,
  options?: { enabled?: boolean },
) {
  return useQuery<PaginatedReportsResponse>({
    queryKey: ["warehouseReports", "paginated", pagination],
    queryFn: () => fetchWarehouseReportsPaginated(pagination),
    staleTime: 1000 * 60 * 5,
    enabled: options?.enabled ?? true,
  });
}

export function useWarehouseReportQuery(id: string) {
  return useQuery({
    queryKey: ["warehouseReports", id],
    queryFn: () => fetchWarehouseReportById(id),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5,
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
    mutationFn: ({ id, data }: { id: string; data: Record<string, any> }) =>
      updateWarehouseReport(id, { data }),
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
      queryClient.invalidateQueries({ 
        queryKey: ["warehouseReports"],
        refetchType: 'all'
      });
    },
  });
}
