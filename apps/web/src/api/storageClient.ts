import { API_URL } from "@/config/env";

export interface UploadedEvidence {
  id: string;
  key: string;
  url: string;
  previewUrl: string;
}

interface UploadEvidenceOptions {
  entityId?: string;
  category?: string;
  order?: number;
}

export async function uploadEvidence(
  file: File,
  options: UploadEvidenceOptions = {},
): Promise<UploadedEvidence> {
  const formData = new FormData();
  formData.append("file", file);

  if (options.entityId) {
    formData.append("entityId", options.entityId);
  }
  if (options.category) {
    formData.append("category", options.category);
  }
  if (typeof options.order === "number") {
    formData.append("order", String(options.order));
  }

  const response = await fetch(`${API_URL}/api/storage/evidences`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!response.ok) {
    let message = "Error uploading evidence";
    try {
      const data = await response.json();
      if (typeof data?.error === "string") {
        message = data.error;
      }
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  return response.json();
}
