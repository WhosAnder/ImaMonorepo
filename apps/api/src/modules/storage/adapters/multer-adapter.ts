import { writeFile } from "fs/promises";
import path from "path";
import type { StorageAdapter, UploadResult, CreateStorageAdapter } from "./storage-interface";
import { ensureUploadDir, generateFileName, isValidFileType } from "../../../config/multer";
import { storagePolicies } from "../storage.policies";

const validateMulterConfig = () => {
  const baseUrl = process.env.BASE_URL || "http://localhost:3000";
  return { baseUrl };
};

const isValidFileTypeForUpload = (contentType: string, fileName: string): boolean => {
  if (fileName.includes("permission-document")) {
    const policies = storagePolicies();
    return policies.permissionDocument.allowedTypes.includes(contentType);
  }

  return isValidFileType(contentType);
};

const uploadFileToLocal = async (
  file: File,
  fileName: string,
  contentType: string,
  baseUrl: string
): Promise<UploadResult> => {
  try {
    if (!isValidFileTypeForUpload(contentType, fileName)) {
      if (fileName.includes("permission-document")) {
        throw new Error("File type not allowed. Only images and PDF are supported for permission documents.");
      }
      throw new Error("File type not allowed. Only images and videos are supported.");
    }

    const uploadDir = ensureUploadDir();
    const finalFileName = fileName || generateFileName(file.name || "file");

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const filePath = path.join(uploadDir, finalFileName);
    await writeFile(filePath, buffer);

    const url = `${baseUrl}/upload/${finalFileName}`;

    return {
      url,
      key: finalFileName,
      size: buffer.length,
    };
  } catch (error) {
    console.error("Local file upload failed:", error);
    throw new Error(`File upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
};

export const createMulterAdapter: CreateStorageAdapter = (): StorageAdapter => {
  const { baseUrl } = validateMulterConfig();

  return {
    uploadFile: (file: File, fileName: string, contentType: string) =>
      uploadFileToLocal(file, fileName, contentType, baseUrl),
  };
};
