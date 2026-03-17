import { API_URL } from "@/config/env";

export interface EvidenceItem {
  id: string;
  previewUrl: string;
}

/**
 * Resolves an evidence to a displayable URL
 * - S3 keys (evidences/...) → fetches presigned URL from backend
 * - Base64 data URLs → returns as-is (backward compatibility)
 * - HTTP URLs → returns as-is
 */
export async function resolveWarehouseEvidenceUrl(
  evidence: EvidenceItem,
): Promise<string | null> {
  const { previewUrl } = evidence;

  if (!previewUrl) {
    return null;
  }

  // Base64 data URL - return as-is (old reports)
  if (previewUrl.startsWith("data:")) {
    return previewUrl;
  }

  // HTTP/HTTPS URL - return as-is
  if (previewUrl.startsWith("http://") || previewUrl.startsWith("https://")) {
    return previewUrl;
  }

  // S3 key - fetch presigned URL
  if (previewUrl.startsWith("evidences/")) {
    try {
      console.log("Fetching presigned URL for key:", previewUrl);
      const response = await fetch(`${API_URL}/api/storage/presign-download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ key: previewUrl }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log("Received presigned URL:", data.url);
      return data.url;
    } catch (error) {
      console.error("Failed to fetch presigned URL for evidence:", error);
      return null;
    }
  }

  // Unknown format - return as-is and let browser handle it
  return previewUrl;
}

/**
 * Collect all evidences from herramientas and refacciones
 */
export function collectAllEvidences(
  herramientas: Array<{ evidences?: EvidenceItem[] }>,
  refacciones: Array<{ evidences?: EvidenceItem[] }>,
): EvidenceItem[] {
  const allEvidences: EvidenceItem[] = [];

  // Collect from herramientas
  herramientas?.forEach((tool) => {
    if (tool.evidences && tool.evidences.length > 0) {
      allEvidences.push(...tool.evidences);
    }
  });

  // Collect from refacciones
  refacciones?.forEach((part) => {
    if (part.evidences && part.evidences.length > 0) {
      allEvidences.push(...part.evidences);
    }
  });

  return allEvidences;
}
