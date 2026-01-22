import { API_URL } from "@/config/env";

// Warehouse evidence types
export interface EvidenceItem {
  id: string;
  previewUrl: string;
}

// Work report evidence types (can be different structure)
export interface WorkReportEvidenceItem {
  id?: string;
  key?: string;
  url?: string;
  previewUrl?: string;
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
 * Resolves a work report evidence to a displayable URL
 * Handles multiple possible field names (key, url, previewUrl, id)
 */
export async function resolveWorkReportEvidenceUrl(
  evidence: WorkReportEvidenceItem,
): Promise<string | null> {
  // Try different field names in order of preference
  const urlCandidate =
    evidence.url || evidence.previewUrl || evidence.key || evidence.id;

  if (!urlCandidate) {
    return null;
  }

  // Base64 data URL - return as-is (old reports)
  if (urlCandidate.startsWith("data:")) {
    return urlCandidate;
  }

  // HTTP/HTTPS URL - return as-is
  if (
    urlCandidate.startsWith("http://") ||
    urlCandidate.startsWith("https://")
  ) {
    return urlCandidate;
  }

  // S3 key - fetch presigned URL
  if (urlCandidate.startsWith("evidences/")) {
    try {
      console.log("Fetching presigned URL for key:", urlCandidate);
      const response = await fetch(`${API_URL}/api/storage/presign-download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ key: urlCandidate }),
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
  return urlCandidate;
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

/**
 * Collect all evidences from work report activities
 */
export function collectWorkReportEvidences(
  actividadesRealizadas: Array<{ evidencias?: WorkReportEvidenceItem[] }>,
): WorkReportEvidenceItem[] {
  const allEvidences: WorkReportEvidenceItem[] = [];

  actividadesRealizadas?.forEach((activity) => {
    if (activity.evidencias && activity.evidencias.length > 0) {
      allEvidences.push(...activity.evidencias);
    }
  });

  return allEvidences;
}

/**
 * Synchronous URL resolver for EvidenceCarousel
 * Returns the URL if it's already a full URL or base64, otherwise returns null
 * (async resolution should happen before passing to carousel)
 */
export function resolveEvidenceUrl(
  evidence: string | WorkReportEvidenceItem,
): string | null {
  if (typeof evidence === "string") {
    // If it's already a URL or base64, return it
    if (
      evidence.startsWith("http://") ||
      evidence.startsWith("https://") ||
      evidence.startsWith("data:")
    ) {
      return evidence;
    }
    return null;
  }

  // Extract URL from object
  const urlCandidate =
    evidence.url || evidence.previewUrl || evidence.key || evidence.id;

  if (!urlCandidate) {
    return null;
  }

  // Return if it's a full URL or base64
  if (
    urlCandidate.startsWith("http://") ||
    urlCandidate.startsWith("https://") ||
    urlCandidate.startsWith("data:")
  ) {
    return urlCandidate;
  }

  // S3 keys need async resolution, return null (should be pre-resolved)
  return null;
}
