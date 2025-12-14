import { useQuery } from "@tanstack/react-query";
import { fetchReportsExplorer, ReportExplorerParams } from "@/api/reportsExplorerClient";

export const useReportsExplorer = (params: ReportExplorerParams) => {
  return useQuery({
    queryKey: ["reportsExplorer", params],
    queryFn: () => fetchReportsExplorer(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
