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
    console.log(
      "[Upload Signature] Uploading signature file:",
      file.name,
      file.size,
      "bytes",
    );

    // Get presigned upload URL from backend
    const presignPayload = {
      reportId,
      reportType: "work",
      signatureType: "responsable",
      mimeType: file.type,
      size: file.size,
      subsystem,
      fechaHoraInicio: date,
    };
    console.log(
      "[Upload Signature] Requesting presigned URL with:",
      presignPayload,
    );

    const presignResponse = await fetch(
      `${API_URL}/api/storage/signatures/presign`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(presignPayload),
      },
    );

    if (!presignResponse.ok) {
      const errorText = await presignResponse.text();
      console.error(
        "[Upload Signature] Failed to get presigned URL:",
        errorText,
      );
      throw new Error(
        `Failed to get presigned URL: ${presignResponse.status} ${errorText}`,
      );
    }

    const { upload, key } = await presignResponse.json();
    console.log("[Upload Signature] Got presigned URL for key:", key);
    console.log("[Upload Signature] Upload URL:", upload.url);
    console.log(
      "[Upload Signature] Upload fields:",
      Object.keys(upload.fields),
    );

    // Upload to S3 using presigned POST (matching warehouse reports pattern)
    console.log("[Upload Signature] Uploading to S3...");
    const formData = new FormData();
    Object.entries(upload.fields).forEach(([k, v]) => {
      formData.append(k, v as string);
    });
    formData.append("file", file);

    const uploadResponse = await fetch(upload.url, {
      method: "POST",
      body: formData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error(
        "[Upload Signature] S3 upload failed:",
        uploadResponse.status,
        errorText,
      );
      throw new Error(`Failed to upload signature: ${uploadResponse.status}`);
    }

    console.log("[Upload Signature] Successfully uploaded to S3:", key);
    return { firmaResponsable: key };
  } catch (error) {
    console.error("Error uploading signature to S3:", error);
    throw error;
  }
}
