import { API_URL } from "@/config/env";

export type SignatureType = "quien-recibe" | "almacenista" | "quien-entrega";

export interface SignatureUploadResult {
  firmaQuienRecibe?: string;
  firmaAlmacenista?: string;
  firmaQuienEntrega?: string;
}

interface SignatureUploadParams {
  base64Data: string;
  reportId: string;
  reportType: "warehouse";
  signatureType: SignatureType;
  subsystem?: string;
  fechaHoraInicio?: string;
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
 * Upload a single signature to S3
 */
async function uploadSignature(params: SignatureUploadParams): Promise<string> {
  const {
    base64Data,
    reportId,
    reportType,
    signatureType,
    subsystem,
    fechaHoraInicio,
  } = params;

  // Skip if no data
  if (!base64Data || !base64Data.startsWith("data:")) {
    return "";
  }

  // Convert base64 to File
  const file = base64ToFile(base64Data, `${signatureType}.png`);

  // 1. Request presigned URL
  const presignResponse = await fetch(
    `${API_URL}/api/storage/signatures/presign`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        reportId,
        reportType,
        signatureType,
        mimeType: file.type,
        size: file.size,
        subsystem,
        fechaHoraInicio,
      }),
    },
  );

  if (!presignResponse.ok) {
    const error = await presignResponse.json().catch(() => ({}));
    throw new Error(
      error.error || `Failed to get presigned URL for ${signatureType}`,
    );
  }

  const { upload, key } = await presignResponse.json();

  console.log(`Presigned URL received for ${signatureType}:`, {
    url: upload.url,
    fields: Object.keys(upload.fields),
    key,
  });

  // 2. Upload to S3 using presigned POST
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
    console.error(`S3 upload failed for ${signatureType}:`, {
      status: uploadResponse.status,
      statusText: uploadResponse.statusText,
      url: upload.url,
      errorBody: errorText,
    });
    throw new Error(
      `Failed to upload signature ${signatureType} to S3: ${uploadResponse.status} ${uploadResponse.statusText}`,
    );
  }

  // 3. Return the S3 key (will be used as URL reference)
  return key;
}

/**
 * Upload all signatures to S3
 */
export async function uploadSignaturesToS3(
  signatures: {
    firmaQuienRecibe?: string;
    firmaAlmacenista?: string;
    firmaQuienEntrega?: string;
  },
  reportId: string,
  subsystem?: string,
  fechaHoraInicio?: string,
): Promise<SignatureUploadResult> {
  const results: SignatureUploadResult = {};

  // Upload each signature in parallel
  const uploads = await Promise.allSettled([
    signatures.firmaQuienRecibe
      ? uploadSignature({
          base64Data: signatures.firmaQuienRecibe,
          reportId,
          reportType: "warehouse",
          signatureType: "quien-recibe",
          subsystem,
          fechaHoraInicio,
        })
      : Promise.resolve(""),
    signatures.firmaAlmacenista
      ? uploadSignature({
          base64Data: signatures.firmaAlmacenista,
          reportId,
          reportType: "warehouse",
          signatureType: "almacenista",
          subsystem,
          fechaHoraInicio,
        })
      : Promise.resolve(""),
    signatures.firmaQuienEntrega
      ? uploadSignature({
          base64Data: signatures.firmaQuienEntrega,
          reportId,
          reportType: "warehouse",
          signatureType: "quien-entrega",
          subsystem,
          fechaHoraInicio,
        })
      : Promise.resolve(""),
  ]);

  // Process results
  if (uploads[0].status === "fulfilled")
    results.firmaQuienRecibe = uploads[0].value;
  if (uploads[1].status === "fulfilled")
    results.firmaAlmacenista = uploads[1].value;
  if (uploads[2].status === "fulfilled")
    results.firmaQuienEntrega = uploads[2].value;

  // Check for errors
  const errors = uploads.filter((u) => u.status === "rejected");
  if (errors.length > 0) {
    console.error("Signature upload errors:", errors);
    throw new Error("Failed to upload one or more signatures");
  }

  return results;
}
