export type DraftReportType = "work" | "warehouse";

export interface DraftRecord<T = unknown> {
  id: string;
  userId: string;
  reportType: DraftReportType;
  data: T;
  serverId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DraftBlobRecord {
  id: string;
  draftId: string;
  evidenceId: string;
  blob: Blob;
  name?: string;
  type?: string;
  size?: number;
  createdAt: string;
}

const DB_NAME = "ima_drafts";
const DB_VERSION = 1;
const DRAFT_STORE = "drafts";
const BLOB_STORE = "draft_blobs";

function openDraftDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(DRAFT_STORE)) {
        db.createObjectStore(DRAFT_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(BLOB_STORE)) {
        const store = db.createObjectStore(BLOB_STORE, { keyPath: "id" });
        store.createIndex("byDraftId", "draftId", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function buildDraftId(userId: string, reportType: DraftReportType): string {
  return `${userId}:${reportType}`;
}

export function buildBlobId(draftId: string, evidenceId: string): string {
  return `${draftId}:${evidenceId}`;
}

export async function saveDraftRecord<T>(record: DraftRecord<T>): Promise<void> {
  const db = await openDraftDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(DRAFT_STORE, "readwrite");
    tx.objectStore(DRAFT_STORE).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getDraftRecord<T>(
  userId: string,
  reportType: DraftReportType,
): Promise<DraftRecord<T> | null> {
  const db = await openDraftDb();
  const draftId = buildDraftId(userId, reportType);
  const record = await requestToPromise(
    db.transaction(DRAFT_STORE, "readonly").objectStore(DRAFT_STORE).get(draftId),
  );
  return (record as DraftRecord<T>) || null;
}

export async function deleteDraftRecord(draftId: string): Promise<void> {
  const db = await openDraftDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(DRAFT_STORE, "readwrite");
    tx.objectStore(DRAFT_STORE).delete(draftId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function saveDraftBlob(record: DraftBlobRecord): Promise<void> {
  const db = await openDraftDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(BLOB_STORE, "readwrite");
    tx.objectStore(BLOB_STORE).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getDraftBlob(blobId: string): Promise<DraftBlobRecord | null> {
  const db = await openDraftDb();
  const record = await requestToPromise(
    db.transaction(BLOB_STORE, "readonly").objectStore(BLOB_STORE).get(blobId),
  );
  return (record as DraftBlobRecord) || null;
}

export async function listDraftBlobs(draftId: string): Promise<DraftBlobRecord[]> {
  const db = await openDraftDb();
  const store = db.transaction(BLOB_STORE, "readonly").objectStore(BLOB_STORE);
  const index = store.index("byDraftId");
  const request = index.getAll(draftId);
  const result = await requestToPromise(request);
  return result as DraftBlobRecord[];
}

export async function deleteDraftBlob(blobId: string): Promise<void> {
  const db = await openDraftDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(BLOB_STORE, "readwrite");
    tx.objectStore(BLOB_STORE).delete(blobId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] || "image/jpeg";
  const binary = atob(data || "");
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    array[i] = binary.charCodeAt(i);
  }
  return new Blob([array], { type: mime });
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(reader.error || new Error("Failed to read blob"));
    reader.readAsDataURL(blob);
  });
}
