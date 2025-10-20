/**
 * IndexedDB Utility for QC PWA Offline Storage
 * Stores blobs, inspection data, and upload queue
 */

const DB_NAME = 'qc-pwa-db';
const DB_VERSION = 1;

export interface OfflineInspection {
  id: string;
  data: any;
  syncStatus: 'pending' | 'synced';
  lastModified: number;
}

export interface OfflineUpload {
  id: string;
  blob: Blob;
  metadata: any;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  retries: number;
  createdAt: number;
}

class IndexedDBManager {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      throw new Error('IndexedDB is not available');
    }

    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('inspections')) {
          db.createObjectStore('inspections', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('uploads')) {
          const uploadStore = db.createObjectStore('uploads', { keyPath: 'id' });
          uploadStore.createIndex('status', 'status', { unique: false });
        }

        if (!db.objectStoreNames.contains('checkpoints')) {
          db.createObjectStore('checkpoints', { keyPath: 'id' });
        }
      };
    });
  }

  async saveInspection(inspection: OfflineInspection): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['inspections'], 'readwrite');
      const store = transaction.objectStore('inspections');
      const request = store.put(inspection);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getInspection(id: string): Promise<OfflineInspection | null> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['inspections'], 'readonly');
      const store = transaction.objectStore('inspections');
      const request = store.get(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async saveUpload(upload: OfflineUpload): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['uploads'], 'readwrite');
      const store = transaction.objectStore('uploads');
      const request = store.put(upload);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getPendingUploads(): Promise<OfflineUpload[]> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['uploads'], 'readonly');
      const store = transaction.objectStore('uploads');
      const index = store.index('status');
      const request = index.getAll('pending');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  async deleteUpload(id: string): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['uploads'], 'readwrite');
      const store = transaction.objectStore('uploads');
      const request = store.delete(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

export const indexedDB = new IndexedDBManager();
