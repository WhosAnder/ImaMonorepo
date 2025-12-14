import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  listEvidencesByReport, 
  uploadEvidence, 
  presignDownload, 
  PresignUploadParams, 
  EvidenceInfo 
} from "@/api/evidencesClient";

/**
 * Query hook for fetching evidences by report ID
 */
export function useReportEvidences(reportId: string | undefined) {
  return useQuery({
    queryKey: ["evidences", "report", reportId],
    queryFn: () => listEvidencesByReport(reportId!),
    enabled: Boolean(reportId),
  });
}

/**
 * Mutation hook for uploading an evidence
 */
export function useUploadEvidence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: PresignUploadParams) => uploadEvidence(params),
    onSuccess: (_, variables) => {
      // Invalidate evidences list for the report
      if (variables.reportId) {
        queryClient.invalidateQueries({ queryKey: ["evidences", "report", variables.reportId] });
      }
    },
  });
}

/**
 * Mutation hook for getting download URL
 */
export function useDownloadUrl() {
  return useMutation({
    mutationFn: (params: { fileId?: string; key?: string }) => presignDownload(params),
  });
}

/**
 * Helper hook to download an evidence - gets presigned URL and opens it
 */
export function useEvidenceDownloader() {
  const downloadMutation = useDownloadUrl();

  const downloadEvidence = async (fileId: string) => {
    try {
      const result = await downloadMutation.mutateAsync({ fileId });
      window.open(result.url, "_blank");
    } catch (error) {
      console.error("Download failed:", error);
      throw error;
    }
  };

  return {
    downloadEvidence,
    isLoading: downloadMutation.isPending,
    error: downloadMutation.error,
  };
}
