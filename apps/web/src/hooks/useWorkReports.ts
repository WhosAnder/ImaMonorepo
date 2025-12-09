import { useQuery } from "@tanstack/react-query";
import { fetchWorkReports, fetchWorkReportById } from "../api/reportsClient";

export function useWorkReportsQuery() {
  return useQuery({
    queryKey: ["workReports"],
    queryFn: fetchWorkReports,
  });
}

export function useWorkReportQuery(id: string) {
  return useQuery({
    queryKey: ["workReports", id],
    queryFn: () => fetchWorkReportById(id),
    enabled: Boolean(id),
  });
}

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createWorkReport } from "../api/reportsClient";

export function useCreateWorkReportMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createWorkReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workReports"] });
    },
  });
}
