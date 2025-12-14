import { useQuery } from "@tanstack/react-query";
import {
  fetchExplorerList,
  fetchExplorerSearch,
  fetchExplorerStats,
  ExplorerListParams,
  ExplorerSearchParams,
} from "@/api/evidencesExplorerClient";

/**
 * Hook for lazy-loading explorer folder contents
 */
export function useExplorerList(params: ExplorerListParams) {
  return useQuery({
    queryKey: ["evidences", "explorer", "list", params],
    queryFn: () => fetchExplorerList(params),
  });
}

/**
 * Hook for searching evidences
 */
export function useExplorerSearch(params: ExplorerSearchParams, enabled = true) {
  return useQuery({
    queryKey: ["evidences", "explorer", "search", params],
    queryFn: () => fetchExplorerSearch(params),
    enabled: enabled && Boolean(params.q),
  });
}

/**
 * Hook for explorer stats
 */
export function useExplorerStats() {
  return useQuery({
    queryKey: ["evidences", "explorer", "stats"],
    queryFn: fetchExplorerStats,
  });
}
