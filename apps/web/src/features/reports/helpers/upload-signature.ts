import { API_URL } from "@/config/env";

interface UploadSignatureResult {
  firmaResponsable: string | null;
}

/**
 * Convert base64 data URL to File object
 */
function base64ToFile(base64Data: string, filename: string): File {
  const arr = base64Data.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

/**
 * Upload work report signature to S3 before creating/updating report
 * @param signature - Base64 data URL or null
 * @param reportId - Temporary or actual report ID for S3 path
 * @param subsystem - Subsystem name for organization
 * @param date - Date string for S3 path organization
 * @returns Object with firmaResponsable S3 key or null
 */
export async function uploadWorkReportSignature(
  signature: string | null,
  reportId: string,
  subsystem: string,
  date: string,
): Promise<UploadSignatureResult> {
  // If no signature or not a data URL, return null
  if (!signature || !signature.startsWith("data:")) {
    return { firmaResponsable: null };
  }

  try {
    // Convert base64 to File
    const file = base64ToFile(signature, "firma-responsable.png");

    // Get presigned upload URL from backend
    const presignResponse = await fetch(
      `${API_URL}/api/storage/signatures/presign`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          reportId,
          reportType: "work",
          subsystem,
          signatureType: "responsable",
          date,
        }),
      },
    );

    if (!presignResponse.ok) {
      const errorText = await presignResponse.text();
      throw new Error(
        `Failed to get presigned URL: ${presignResponse.status} ${errorText}`,
      );
    }

    const { url, key } = await presignResponse.json();

    // Upload file directly to S3
    const uploadResponse = await fetch(url, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
    });

    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload signature: ${uploadResponse.status}`);
    }

    console.log("Signature uploaded successfully:", key);
    return { firmaResponsable: key };
  } catch (error) {
    console.error("Error uploading signature to S3:", error);
    throw error;
  }
}
