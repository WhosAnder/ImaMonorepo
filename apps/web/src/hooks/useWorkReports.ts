import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchWorkReports,
  fetchWorkReportsPaginated,
  fetchWorkReportById,
  createWorkReport,
  updateWorkReport,
  deleteWorkReport,
  ReportResponse,
  PaginatedReportsResponse,
  ReportListParams,
} from "../api/reportsClient";

export function useWorkReportsQuery(
  options?: { enabled?: boolean; pagination?: ReportListParams },
) {
  return useQuery({
    queryKey: ["workReports", options?.pagination],
    queryFn: () => fetchWorkReports(options?.pagination),
    staleTime: 1000 * 60 * 5,
    enabled: options?.enabled ?? true,
  });
}

export function useWorkReportsPaginatedQuery(
  pagination?: ReportListParams,
  options?: { enabled?: boolean },
) {
  return useQuery<PaginatedReportsResponse>({
    queryKey: ["workReports", "paginated", pagination],
    queryFn: () => fetchWorkReportsPaginated(pagination),
    staleTime: 1000 * 60 * 5,
    enabled: options?.enabled ?? true,
  });
}

export function useWorkReportQuery(id: string) {
  return useQuery({
    queryKey: ["workReports", id],
    queryFn: () => fetchWorkReportById(id),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateWorkReportMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createWorkReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workReports"] });
    },
  });
}

export function useUpdateWorkReportMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, any> }) =>
      updateWorkReport(id, { data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["workReports"] });
      queryClient.invalidateQueries({ queryKey: ["workReports", variables.id] });
    },
  });
}

export function useDeleteWorkReportMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteWorkReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["workReports"],
        refetchType: 'all'
      });
    },
  });
}
