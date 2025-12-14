export interface UploadResult {
  url: string;
  key: string;
  size?: number;
}

export type StorageAdapter = {
  uploadFile: (file: File, fileName: string, contentType: string) => Promise<UploadResult>;
};

export type CreateStorageAdapter = () => StorageAdapter;
