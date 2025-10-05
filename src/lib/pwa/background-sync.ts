"use client";

interface QueuedAction {
  id: string;
  type: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: any;
  timestamp: number;
  retryCount: number;
}

class BackgroundSync {
  private static instance: BackgroundSync;
  private readonly QUEUE_KEY = 'pwa-sync-queue';
  private readonly MAX_RETRIES = 3;

  private constructor() {
    this.initializeSync();
  }

  static getInstance(): BackgroundSync {
    if (!BackgroundSync.instance) {
      BackgroundSync.instance = new BackgroundSync();
    }
    return BackgroundSync.instance;
  }

  private initializeSync(): void {
    if (typeof window === 'undefined') return;

    // Listen for online event to process queue
    window.addEventListener('online', () => {
      this.processQueue();
    });

    // Register sync event if supported
    if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then(registration => {
        registration.sync.register('sync-queue').catch(err => {
          console.warn('Background sync registration failed:', err);
        });
      });
    }
  }

  async queueAction(action: Omit<QueuedAction, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    if (typeof window === 'undefined') return;

    const queuedAction: QueuedAction = {
      ...action,
      id: this.generateId(),
      timestamp: Date.now(),
      retryCount: 0,
    };

    const queue = await this.getQueue();
    queue.push(queuedAction);
    await this.saveQueue(queue);

    // Show notification
    this.showNotification('Action queued', 'Will sync when online');

    // Try to process immediately if online
    if (navigator.onLine) {
      this.processQueue();
    }
  }

  private async getQueue(): Promise<QueuedAction[]> {
    if (typeof window === 'undefined') return [];

    try {
      const queueJson = localStorage.getItem(this.QUEUE_KEY);
      return queueJson ? JSON.parse(queueJson) : [];
    } catch (error) {
      console.error('Error reading sync queue:', error);
      return [];
    }
  }

  private async saveQueue(queue: QueuedAction[]): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Error saving sync queue:', error);
    }
  }

  async processQueue(): Promise<void> {
    if (!navigator.onLine || typeof window === 'undefined') return;

    const queue = await this.getQueue();
    if (queue.length === 0) return;

    const results = await Promise.allSettled(
      queue.map(action => this.processAction(action))
    );

    const failedActions: QueuedAction[] = [];
    let successCount = 0;

    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const action = queue[index];
        action.retryCount++;

        if (action.retryCount < this.MAX_RETRIES) {
          failedActions.push(action);
        } else {
          console.error('Action exceeded max retries:', action);
          this.showNotification('Sync failed', `Action ${action.type} could not be synced`);
        }
      } else {
        successCount++;
      }
    });

    await this.saveQueue(failedActions);

    if (successCount > 0) {
      this.showNotification('Synced successfully', `${successCount} action(s) synced`);
    }
  }

  private async processAction(action: QueuedAction): Promise<void> {
    try {
      const response = await fetch(action.url, {
        method: action.method,
        headers: action.headers,
        body: action.body ? JSON.stringify(action.body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('Action synced successfully:', action.type);
    } catch (error) {
      console.error('Error syncing action:', error);
      throw error;
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private showNotification(title: string, body: string): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
      });
    }
  }

  async getQueueStats(): Promise<{
    queueLength: number;
    oldestTimestamp: number | null;
    types: Record<string, number>;
  }> {
    const queue = await this.getQueue();
    const types: Record<string, number> = {};

    queue.forEach(action => {
      types[action.type] = (types[action.type] || 0) + 1;
    });

    return {
      queueLength: queue.length,
      oldestTimestamp: queue.length > 0 ? queue[0].timestamp : null,
      types,
    };
  }

  async clearQueue(): Promise<void> {
    await this.saveQueue([]);
  }
}

// Export singleton instance
export const backgroundSync = typeof window !== 'undefined' ? BackgroundSync.getInstance() : null;

// React hook for background sync
export function useBackgroundSync() {
  const queueAction = async (
    url: string,
    method: string,
    body: any,
    type: string
  ): Promise<void> => {
    if (!backgroundSync) return;

    await backgroundSync.queueAction({
      type,
      url,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body,
    });
  };

  const processQueue = async (): Promise<void> => {
    if (!backgroundSync) return;
    await backgroundSync.processQueue();
  };

  const getStats = async () => {
    if (!backgroundSync) return { queueLength: 0, oldestTimestamp: null, types: {} };
    return await backgroundSync.getQueueStats();
  };

  const clearQueue = async (): Promise<void> => {
    if (!backgroundSync) return;
    await backgroundSync.clearQueue();
  };

  return {
    queueAction,
    processQueue,
    getStats,
    clearQueue,
  };
}
