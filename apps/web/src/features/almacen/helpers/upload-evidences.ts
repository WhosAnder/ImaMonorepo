import { uploadEvidence } from "@/api/evidencesClient";
import { applyWatermarkToImage } from "@/shared/utils/image-watermark";

export interface EvidenceUploadResult {
  id: string;
  previewUrl: string;
}

/**
 * Convert base64 data URL to File object
 */
function base64ToFile(base64Data: string, filename: string): File {
  const arr = base64Data.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

/**
 * Upload evidences for a single item (tool or part)
 */
export async function uploadEvidencesForItem(
  evidences: any[],
  reportId: string,
  subsystem: string,
  reportType: "warehouse" = "warehouse",
): Promise<EvidenceUploadResult[]> {
  if (!evidences || evidences.length === 0) {
    return [];
  }

  const uploadedEvidences: EvidenceUploadResult[] = [];

  for (let i = 0; i < evidences.length; i++) {
    const evidence = evidences[i];

    // Skip if already uploaded (has URL)
    if (evidence.previewUrl && evidence.previewUrl.startsWith("http")) {
      uploadedEvidences.push({
        id: evidence.id,
        previewUrl: evidence.previewUrl,
      });
      continue;
    }

    // Get base64 data
    const dataUrl = evidence.base64 || evidence.previewUrl;
    if (!dataUrl || !dataUrl.startsWith("data:")) {
      continue; // Skip invalid data
    }

    try {
      // Check if image is already watermarked (filename contains '_wm')
      const isAlreadyWatermarked = evidence.originalName?.includes('_wm');
      
      let fileToUpload: File;
      
      if (isAlreadyWatermarked) {
        // Already watermarked (came from EvidenceUpload component), just convert to File
        fileToUpload = base64ToFile(
          dataUrl,
          evidence.originalName || `evidence-${i}.jpg`,
        );
      } else {
        // Not watermarked yet, apply watermark before upload
        console.log(`[WarehouseReport] Applying watermark to evidence ${i}`);
        const watermarkedFile = await applyWatermarkToImage(
          dataUrl,
          { timestamp: new Date() }
        );
        fileToUpload = watermarkedFile;
      }

      // Upload using existing evidence client with subsystem for pre-report upload
      const result = await uploadEvidence({
        file: fileToUpload,
        reportId,
        reportType,
        subsystem, // Pass subsystem so backend doesn't need to lookup report
        skipDbRecord: true, // Don't create DB record, just return S3 key
      });

      uploadedEvidences.push({
        id: result.id,
        previewUrl: result.key, // Use key as preview URL reference
      });
    } catch (error) {
      console.error(`Failed to upload evidence ${i}:`, error);
      throw error;
    }
  }

  return uploadedEvidences;
}
