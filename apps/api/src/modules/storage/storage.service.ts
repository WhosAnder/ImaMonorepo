import type { StorageAdapter } from "./adapters/storage-interface";

const getFileExtension = (mimeType: string): string => {
  if (!mimeType) {
    return "bin";
  }
  return mimeType.includes("jpeg") ? "jpg" : mimeType.split("/")[1] || "bin";
};

const generateFileName = (
  relationId: string,
  index: number,
  storeType: string,
  fileExtension: string
): string => {
  return `${relationId}-${index}-${storeType}.${fileExtension}`;
};

const uploadEvidence =
  (storageAdapter: StorageAdapter) =>
  async (
    file: File,
    relationId: string,
    storeType: string,
    index?: number
  ): Promise<{ url: string; fileName: string }> => {
    const type = file.type || "application/octet-stream";
    const fileExtension = getFileExtension(type);
    const normalizedIndex = typeof index === "number" && Number.isFinite(index) ? index : Date.now();
    const fileName = generateFileName(relationId, normalizedIndex, storeType, fileExtension);

    const result = await storageAdapter.uploadFile(file, fileName, type);

    return {
      url: result.url,
      fileName: result.key,
    };
  };

export const createStorageService = (storageAdapter: StorageAdapter) => ({
  uploadEvidence: (file: File, relationId: string, storeType: string, index?: number) =>
    uploadEvidence(storageAdapter)(file, relationId, storeType, index),
});

export type StorageService = ReturnType<typeof createStorageService>;
