export type DraftReportType = "work" | "warehouse";

export interface DraftMetadata {
  id: string; // usually `${userId}:${reportType}`
  reportType: DraftReportType;
  userId: string;
  updatedAt: string;
  data: any; // lightweight JSON form state
}

export interface DraftBlob {
  id: string; // `${draftId}:${evidenceId}`
  draftId: string;
  evidenceId: string;
  data: string; // Base64 string from canvas/image
}

export class DraftsDatabase {
  private static instance: DraftsDatabase;
  private db: IDBDatabase | null = null;
  private isConnecting = false;
  private connectionPromise: Promise<IDBDatabase> | null = null;

  public static getInstance(): DraftsDatabase {
    if (!DraftsDatabase.instance) {
      DraftsDatabase.instance = new DraftsDatabase();
    }
    return DraftsDatabase.instance;
  }

  private async connect(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.connectionPromise) return this.connectionPromise;

    this.isConnecting = true;
    this.connectionPromise = new Promise((resolve, reject) => {
      // Increment version if schema changes
      const request = indexedDB.open("IMA_DraftsDB", 1);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Metadata Table
        if (!db.objectStoreNames.contains("drafts_metadata")) {
          db.createObjectStore("drafts_metadata", { keyPath: "id" });
        }
        
        // Blobs Table
        if (!db.objectStoreNames.contains("drafts_blobs")) {
          const blobStore = db.createObjectStore("drafts_blobs", { keyPath: "id" });
          blobStore.createIndex("byDraftId", "draftId", { unique: false });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        this.isConnecting = false;
        resolve(this.db);
      };

      request.onerror = (event) => {
        this.isConnecting = false;
        reject((event.target as IDBOpenDBRequest).error);
      };
    });

    return this.connectionPromise;
  }

  /**
   * Synchronous/Instant Metadata save. Returns as soon as the lightweight text is committed.
   * Spawns an unawaited background process to process big Blob strings.
   */
  public async saveDraft(
    userId: string,
    reportType: DraftReportType,
    metadataData: any,
    evidences: { id: string; base64: string }[]
  ): Promise<void> {
    const db = await this.connect();
    const draftId = `${userId}:${reportType}`;

    const metadata: DraftMetadata = {
      id: draftId,
      reportType,
      userId,
      updatedAt: new Date().toISOString(),
      data: metadataData,
    };

    // 1. Save metadata instantly
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("drafts_metadata", "readwrite");
      const store = tx.objectStore("drafts_metadata");
      const req = store.put(metadata);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    // 2. Launch Background Blob processing
    // We intentionally DO NOT AWAIT this so the UI is responsive immediately.
    this.processBlobsAsync(draftId, evidences).catch((err) => {
      console.error("Background draft blob save failed:", err);
    });
  }

  /**
   * Hidden method to parse and save heavy strings off the main execution flow block.
   */
  private async processBlobsAsync(draftId: string, evidences: { id: string; base64: string }[]): Promise<void> {
    const db = await this.connect();

    // Iterate through evidences. For large amounts, we slice or timeout, but given typical forms,
    // a single transaction is fine as long as we yield.
    const tx = db.transaction("drafts_blobs", "readwrite");
    const store = tx.objectStore("drafts_blobs");

    // Clear existing blobs for this draft first? No, we just overwrite existing IDs and leave abandoned ones.
    // For perfection, we should clear abandoned blobs, but put() acts as upsert.
    // To clean up orphaned evidences efficiently:
    const index = store.index("byDraftId");
    const getOrphansReq = index.getAllKeys(IDBKeyRange.only(draftId));
    
    getOrphansReq.onsuccess = () => {
      const existingKeys = getOrphansReq.result as string[];
      const incomingIds = new Set(evidences.map((e) => `${draftId}:${e.id}`));

      // Delete keys that are no longer in the draft
      for (const key of existingKeys) {
        if (!incomingIds.has(key)) {
          store.delete(key);
        }
      }

      // Upsert new/existing blobs
      for (const ev of evidences) {
        if (ev.base64) {
          store.put({
            id: `${draftId}:${ev.id}`,
            draftId,
            evidenceId: ev.id,
            data: ev.base64,
          });
        }
      }
    };
  }

  public async getDraft(userId: string, reportType: DraftReportType): Promise<{ metadata: DraftMetadata | null; blobs: DraftBlob[] }> {
    const db = await this.connect();
    const draftId = `${userId}:${reportType}`;

    const metadataReq = new Promise<DraftMetadata | null>((resolve) => {
      const tx = db.transaction("drafts_metadata", "readonly");
      const req = tx.objectStore("drafts_metadata").get(draftId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });

    const blobsReq = new Promise<DraftBlob[]>((resolve) => {
      const tx = db.transaction("drafts_blobs", "readonly");
      const index = tx.objectStore("drafts_blobs").index("byDraftId");
      const req = index.getAll(IDBKeyRange.only(draftId));
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });

    const [metadata, blobs] = await Promise.all([metadataReq, blobsReq]);
    return { metadata, blobs };
  }

  public async deleteDraft(userId: string, reportType: DraftReportType): Promise<void> {
    const db = await this.connect();
    const draftId = `${userId}:${reportType}`;

    // Delete Metadata
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("drafts_metadata", "readwrite");
      const req = tx.objectStore("drafts_metadata").delete(draftId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    // Delete Blobs via index
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("drafts_blobs", "readwrite");
      const index = tx.objectStore("drafts_blobs").index("byDraftId");
      const getReq = index.getAllKeys(IDBKeyRange.only(draftId));

      getReq.onsuccess = () => {
        const keys = getReq.result as string[];
        for (const key of keys) {
          tx.objectStore("drafts_blobs").delete(key);
        }
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

export const draftsDB = DraftsDatabase.getInstance();
