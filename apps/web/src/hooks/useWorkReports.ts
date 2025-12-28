import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchWorkReports,
  fetchWorkReportsPaginated,
  fetchWorkReportById,
  createWorkReport,
  updateWorkReport,
  deleteWorkReport,
  PaginatedResponse,
  PaginationParams,
} from "../api/reportsClient";
import { WorkReportListItem } from "@/features/reports/types/workReportList";
import { WorkReport } from "@/features/reports/types/workReport";

interface UseWorkReportsQueryOptions {
  enabled?: boolean;
  pagination?: PaginationParams;
}

export function useWorkReportsQuery(options?: UseWorkReportsQueryOptions) {
  return useQuery({
    queryKey: ["workReports", options?.pagination],
    queryFn: () => fetchWorkReports(options?.pagination),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: options?.enabled ?? true,
  });
}

export function useWorkReportsPaginatedQuery(
  pagination?: PaginationParams,
  options?: { enabled?: boolean },
) {
  return useQuery<PaginatedResponse<WorkReportListItem>>({
    queryKey: ["workReports", "paginated", pagination],
    queryFn: () => fetchWorkReportsPaginated(pagination),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: options?.enabled ?? true,
  });
}

export function useWorkReportQuery(id: string) {
  return useQuery({
    queryKey: ["workReports", id],
    queryFn: () => fetchWorkReportById(id),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5, // 5 minutes
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
    mutationFn: ({ id, data }: { id: string; data: Partial<WorkReport> }) =>
      updateWorkReport(id, data),
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
      // Invalidate all workReports queries with immediate refetch
      queryClient.invalidateQueries({ 
        queryKey: ["workReports"],
        refetchType: 'all'
      });
    },
  });
}
