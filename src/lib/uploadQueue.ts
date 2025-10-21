/**
 * Upload Queue
 * Manages photo uploads with retry logic, offline support, and progress tracking
 * Designed for unreliable factory network conditions
 */

export interface UploadTask {
  id: string; // Unique task ID (UUID)
  blob: Blob; // Image blob to upload
  filename: string; // Target filename
  metadata: {
    inspection_id: string;
    checkpoint_id: string;
    user_id: string;
    captured_at: string; // ISO timestamp
  };
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  progress: number; // 0-100
  retries: number; // Number of retry attempts
  error?: string; // Error message if failed
  createdAt: number; // Timestamp
  updatedAt: number; // Timestamp
}

export interface UploadProgress {
  taskId: string;
  progress: number; // 0-100
  status: 'pending' | 'uploading' | 'completed' | 'failed';
}

export interface UploadResult {
  success: boolean;
  taskId: string;
  url?: string; // Uploaded file URL
  error?: string;
}

type ProgressCallback = (_progress: UploadProgress) => void;
type CompletionCallback = (_result: UploadResult) => void;

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000; // 2 seconds
const MAX_CONCURRENT_UPLOADS = 2; // Limit concurrent uploads

/**
 * Upload Queue Manager
 * Singleton class managing upload queue with retry logic
 */
export class UploadQueueManager {
  private queue: UploadTask[] = [];
  private activeUploads: Set<string> = new Set();
  private progressCallbacks: Map<string, ProgressCallback[]> = new Map();
  private completionCallbacks: Map<string, CompletionCallback[]> = new Map();
  private isProcessing = false;

  /**
   * Add upload task to queue
   */
  public addTask(
    blob: Blob,
    filename: string,
    metadata: UploadTask['metadata']
  ): string {
    const taskId = this.generateTaskId();
    const task: UploadTask = {
      id: taskId,
      blob,
      filename,
      metadata,
      status: 'pending',
      progress: 0,
      retries: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.queue.push(task);
    this.saveQueueToStorage();
    this.processQueue();

    return taskId;
  }

  /**
   * Subscribe to upload progress
   */
  public onProgress(taskId: string, callback: ProgressCallback): () => void {
    if (!this.progressCallbacks.has(taskId)) {
      this.progressCallbacks.set(taskId, []);
    }
    this.progressCallbacks.get(taskId)!.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.progressCallbacks.get(taskId);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * Subscribe to upload completion
   */
  public onComplete(taskId: string, callback: CompletionCallback): () => void {
    if (!this.completionCallbacks.has(taskId)) {
      this.completionCallbacks.set(taskId, []);
    }
    this.completionCallbacks.get(taskId)!.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.completionCallbacks.get(taskId);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * Get task status
   */
  public getTask(taskId: string): UploadTask | undefined {
    return this.queue.find((task) => task.id === taskId);
  }

  /**
   * Get all tasks
   */
  public getAllTasks(): UploadTask[] {
    return [...this.queue];
  }

  /**
   * Get pending tasks count
   */
  public getPendingCount(): number {
    return this.queue.filter((task) => task.status === 'pending' || task.status === 'failed').length;
  }

  /**
   * Cancel task
   */
  public cancelTask(taskId: string): boolean {
    const taskIndex = this.queue.findIndex((task) => task.id === taskId);
    if (taskIndex > -1) {
      // eslint-disable-next-line security/detect-object-injection
      const task = this.queue[taskIndex];
      if (task.status === 'pending' || task.status === 'failed') {
        this.queue.splice(taskIndex, 1);
        this.saveQueueToStorage();
        return true;
      }
    }
    return false;
  }

  /**
   * Retry failed task
   */
  public retryTask(taskId: string): boolean {
    const task = this.queue.find((task) => task.id === taskId);
    if (task && task.status === 'failed') {
      task.status = 'pending';
      task.retries = 0;
      task.error = undefined;
      task.updatedAt = Date.now();
      this.saveQueueToStorage();
      this.processQueue();
      return true;
    }
    return false;
  }

  /**
   * Clear completed tasks
   */
  public clearCompleted(): void {
    this.queue = this.queue.filter((task) => task.status !== 'completed');
    this.saveQueueToStorage();
  }

  /**
   * Process upload queue (internal)
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.activeUploads.size < MAX_CONCURRENT_UPLOADS) {
      const nextTask = this.queue.find(
        (task) =>
          (task.status === 'pending' || task.status === 'failed') &&
          !this.activeUploads.has(task.id)
      );

      if (!nextTask) break;

      this.activeUploads.add(nextTask.id);
      this.uploadTask(nextTask).finally(() => {
        this.activeUploads.delete(nextTask.id);
        this.processQueue();
      });
    }

    this.isProcessing = false;
  }

  /**
   * Upload single task with retry logic
   */
  private async uploadTask(task: UploadTask): Promise<void> {
    task.status = 'uploading';
    task.progress = 0;
    task.updatedAt = Date.now();
    this.notifyProgress(task);
    this.saveQueueToStorage();

    try {
      // Upload to Supabase Storage
      const url = await this.uploadToStorage(
        task.blob,
        task.filename,
        task.metadata,
        (progress) => {
          task.progress = progress;
          task.updatedAt = Date.now();
          this.notifyProgress(task);
        }
      );

      // Success
      task.status = 'completed';
      task.progress = 100;
      task.updatedAt = Date.now();
      this.notifyProgress(task);
      this.notifyCompletion({
        success: true,
        taskId: task.id,
        url,
      });
      this.saveQueueToStorage();
    } catch (error) {
      // Failure - retry logic
      task.retries++;
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';

      if (task.retries < MAX_RETRIES) {
        // Retry after delay
        console.warn(`Upload failed, retrying (${task.retries}/${MAX_RETRIES})...`, errorMessage);
        task.status = 'pending';
        task.error = errorMessage;
        task.updatedAt = Date.now();
        this.saveQueueToStorage();

        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * task.retries));
      } else {
        // Max retries exceeded
        console.error('Upload failed after max retries:', errorMessage);
        task.status = 'failed';
        task.error = errorMessage;
        task.updatedAt = Date.now();
        this.notifyProgress(task);
        this.notifyCompletion({
          success: false,
          taskId: task.id,
          error: errorMessage,
        });
        this.saveQueueToStorage();
      }
    }
  }

  /**
   * Upload blob to Supabase Storage
   */
  private async uploadToStorage(
    blob: Blob,
    filename: string,
    metadata: UploadTask['metadata'],
    onProgress: (_progress: number) => void
  ): Promise<string> {
    // Generate storage path: qc-photos/inspection_id/checkpoint_id/filename
    const storagePath = `qc-photos/${metadata.inspection_id}/${metadata.checkpoint_id}/${filename}`;

    // Create FormData for upload
    const formData = new FormData();
    formData.append('file', blob, filename);

    // Upload via tRPC endpoint (to be implemented in Phase 3)
    // For now, simulate upload with XMLHttpRequest for progress tracking
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Progress tracking
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          onProgress(progress);
        }
      });

      // Success
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response.url || storagePath);
          } catch {
            resolve(storagePath);
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      // Error
      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      // Timeout
      xhr.addEventListener('timeout', () => {
        reject(new Error('Upload timeout'));
      });

      // Send request
      xhr.open('POST', '/api/storage/upload'); // tRPC storage endpoint
      xhr.timeout = 60000; // 60 second timeout
      xhr.send(formData);
    });
  }

  /**
   * Notify progress callbacks
   */
  private notifyProgress(task: UploadTask): void {
    const callbacks = this.progressCallbacks.get(task.id);
    if (callbacks) {
      const progress: UploadProgress = {
        taskId: task.id,
        progress: task.progress,
        status: task.status,
      };
      callbacks.forEach((callback) => callback(progress));
    }
  }

  /**
   * Notify completion callbacks
   */
  private notifyCompletion(result: UploadResult): void {
    const callbacks = this.completionCallbacks.get(result.taskId);
    if (callbacks) {
      callbacks.forEach((callback) => callback(result));
    }
  }

  /**
   * Generate unique task ID
   */
  private generateTaskId(): string {
    return `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Save queue to localStorage for offline persistence
   */
  private saveQueueToStorage(): void {
    try {
      // Convert blobs to data URLs for storage
      const serializedQueue = this.queue.map((task) => ({
        ...task,
        blob: undefined, // Remove blob (too large for localStorage)
        blobUrl: task.status !== 'completed' ? URL.createObjectURL(task.blob) : undefined,
      }));
      // eslint-disable-next-line security/detect-object-injection
      localStorage.setItem('qc-upload-queue', JSON.stringify(serializedQueue));
    } catch (error) {
      console.error('Failed to save upload queue:', error);
    }
  }

  /**
   * Load queue from localStorage
   */
  public loadQueueFromStorage(): void {
    try {
      const stored = localStorage.getItem('qc-upload-queue');
      if (stored) {
        const serializedQueue = JSON.parse(stored);
        // Note: Blobs cannot be restored from localStorage
        // In Phase 5, we'll use IndexedDB to store blobs
        console.log('Upload queue loaded from storage:', serializedQueue.length, 'tasks');
      }
    } catch (error) {
      console.error('Failed to load upload queue:', error);
    }
  }
}

// Export singleton instance
export const uploadQueue = new UploadQueueManager();

// Load queue on initialization
if (typeof window !== 'undefined') {
  uploadQueue.loadQueueFromStorage();
}
