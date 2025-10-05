/**
 * Offline Storage System using IndexedDB
 *
 * Provides persistent offline storage for tasks, form drafts, and settings
 * with automatic sync when connection is restored.
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

// ============================================================================
// TypeScript Interfaces
// ============================================================================

/**
 * Task interface matching the database schema
 */
export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  dueDate: string | null;
  assignedTo: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  // Offline tracking
  _offlineId?: string; // Temporary ID for offline-created tasks
  _syncStatus?: 'pending' | 'synced' | 'conflict';
  _lastModified?: number;
}

/**
 * Form draft for any form in the application
 */
export interface FormDraft {
  id: string;
  formType: string; // 'task', 'order', 'contact', etc.
  formData: Record<string, any>;
  createdAt: number;
  updatedAt: number;
  autoSaved: boolean;
}

/**
 * User settings and preferences
 */
export interface UserSettings {
  id: string;
  userId: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: {
    enabled: boolean;
    sound: boolean;
    desktop: boolean;
    email: boolean;
  };
  offlineMode: {
    enabled: boolean;
    autoSync: boolean;
    syncInterval: number; // minutes
  };
  preferences: Record<string, any>;
  updatedAt: number;
}

/**
 * Sync queue entry for tracking offline changes
 */
export interface SyncQueueEntry {
  id: string;
  operation: 'create' | 'update' | 'delete';
  entityType: 'task' | 'order' | 'contact' | 'note';
  entityId: string;
  data: any;
  timestamp: number;
  retryCount: number;
  lastError?: string;
}

/**
 * Database schema definition
 */
interface LimnDB extends DBSchema {
  tasks: {
    key: string;
    value: Task;
    indexes: {
      'by-status': string;
      'by-priority': string;
      'by-due-date': string;
      'by-sync-status': string;
    };
  };
  drafts: {
    key: string;
    value: FormDraft;
    indexes: {
      'by-form-type': string;
      'by-updated-at': number;
    };
  };
  settings: {
    key: string;
    value: UserSettings;
    indexes: { 'by-user-id': string };
  };
  syncQueue: {
    key: string;
    value: SyncQueueEntry;
    indexes: {
      'by-entity-type': string;
      'by-timestamp': number;
      'by-retry-count': number;
    };
  };
}

// ============================================================================
// Database Configuration
// ============================================================================

const DB_NAME = 'limn-systems-offline';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<LimnDB> | null = null;

/**
 * Initialize and get database instance
 */
export async function getDB(): Promise<IDBPDatabase<LimnDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<LimnDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, _transaction) {
      console.log('[Offline Storage] Upgrading database from', oldVersion, 'to', newVersion);

      // Create tasks object store
      if (!db.objectStoreNames.contains('tasks')) {
        const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
        taskStore.createIndex('by-status', 'status');
        taskStore.createIndex('by-priority', 'priority');
        taskStore.createIndex('by-due-date', 'dueDate');
        taskStore.createIndex('by-sync-status', '_syncStatus');
        console.log('[Offline Storage] Created tasks store');
      }

      // Create drafts object store
      if (!db.objectStoreNames.contains('drafts')) {
        const draftStore = db.createObjectStore('drafts', { keyPath: 'id' });
        draftStore.createIndex('by-form-type', 'formType');
        draftStore.createIndex('by-updated-at', 'updatedAt');
        console.log('[Offline Storage] Created drafts store');
      }

      // Create settings object store
      if (!db.objectStoreNames.contains('settings')) {
        const settingsStore = db.createObjectStore('settings', { keyPath: 'id' });
        settingsStore.createIndex('by-user-id', 'userId');
        console.log('[Offline Storage] Created settings store');
      }

      // Create sync queue object store
      if (!db.objectStoreNames.contains('syncQueue')) {
        const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
        syncStore.createIndex('by-entity-type', 'entityType');
        syncStore.createIndex('by-timestamp', 'timestamp');
        syncStore.createIndex('by-retry-count', 'retryCount');
        console.log('[Offline Storage] Created syncQueue store');
      }
    },
    blocked() {
      console.warn('[Offline Storage] Database upgrade blocked by another connection');
    },
    blocking() {
      console.warn('[Offline Storage] This connection is blocking a database upgrade');
    },
  });

  console.log('[Offline Storage] Database initialized successfully');
  return dbInstance;
}

// ============================================================================
// Task Operations
// ============================================================================

/**
 * Get all tasks from offline storage
 */
export async function getAllTasks(): Promise<Task[]> {
  const db = await getDB();
  return await db.getAll('tasks');
}

/**
 * Get task by ID
 */
export async function getTask(id: string): Promise<Task | undefined> {
  const db = await getDB();
  return await db.get('tasks', id);
}

/**
 * Get tasks by status
 */
export async function getTasksByStatus(status: Task['status']): Promise<Task[]> {
  const db = await getDB();
  return await db.getAllFromIndex('tasks', 'by-status', status);
}

/**
 * Get tasks by priority
 */
export async function getTasksByPriority(priority: Task['priority']): Promise<Task[]> {
  const db = await getDB();
  return await db.getAllFromIndex('tasks', 'by-priority', priority);
}

/**
 * Get tasks pending sync
 */
export async function getPendingSyncTasks(): Promise<Task[]> {
  const db = await getDB();
  return await db.getAllFromIndex('tasks', 'by-sync-status', 'pending');
}

/**
 * Save task to offline storage
 */
export async function saveTask(task: Task): Promise<void> {
  const db = await getDB();

  // Mark as pending sync if offline
  if (!navigator.onLine) {
    task._syncStatus = 'pending';
    task._lastModified = Date.now();
  }

  await db.put('tasks', task);
  console.log('[Offline Storage] Task saved:', task.id);

  // Queue for sync if offline
  if (!navigator.onLine) {
    await queueSync({
      id: `sync-${Date.now()}-${Math.random()}`,
      operation: 'update',
      entityType: 'task',
      entityId: task.id,
      data: task,
      timestamp: Date.now(),
      retryCount: 0,
    });
  }
}

/**
 * Create new task offline
 */
export async function createTaskOffline(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
  const db = await getDB();

  const task: Task = {
    ...taskData,
    id: `offline-${Date.now()}-${Math.random()}`,
    _offlineId: `offline-${Date.now()}-${Math.random()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _syncStatus: 'pending',
    _lastModified: Date.now(),
  };

  await db.put('tasks', task);
  console.log('[Offline Storage] Task created offline:', task.id);

  // Queue for sync
  await queueSync({
    id: `sync-${Date.now()}-${Math.random()}`,
    operation: 'create',
    entityType: 'task',
    entityId: task.id,
    data: task,
    timestamp: Date.now(),
    retryCount: 0,
  });

  return task;
}

/**
 * Delete task from offline storage
 */
export async function deleteTask(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('tasks', id);
  console.log('[Offline Storage] Task deleted:', id);

  // Queue for sync if offline
  if (!navigator.onLine) {
    await queueSync({
      id: `sync-${Date.now()}-${Math.random()}`,
      operation: 'delete',
      entityType: 'task',
      entityId: id,
      data: null,
      timestamp: Date.now(),
      retryCount: 0,
    });
  }
}

/**
 * Bulk save tasks (for initial sync from server)
 */
export async function bulkSaveTasks(tasks: Task[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('tasks', 'readwrite');

  await Promise.all([
    ...tasks.map(task => tx.store.put({ ...task, _syncStatus: 'synced' })),
    tx.done,
  ]);

  console.log('[Offline Storage] Bulk saved', tasks.length, 'tasks');
}

// ============================================================================
// Draft Operations
// ============================================================================

/**
 * Get all drafts
 */
export async function getAllDrafts(): Promise<FormDraft[]> {
  const db = await getDB();
  return await db.getAll('drafts');
}

/**
 * Get draft by ID
 */
export async function getDraft(id: string): Promise<FormDraft | undefined> {
  const db = await getDB();
  return await db.get('drafts', id);
}

/**
 * Get drafts by form type
 */
export async function getDraftsByType(formType: string): Promise<FormDraft[]> {
  const db = await getDB();
  return await db.getAllFromIndex('drafts', 'by-form-type', formType);
}

/**
 * Save form draft
 */
export async function saveDraft(draft: Omit<FormDraft, 'updatedAt'>): Promise<void> {
  const db = await getDB();
  const draftWithTimestamp: FormDraft = {
    ...draft,
    updatedAt: Date.now(),
  };
  await db.put('drafts', draftWithTimestamp);
  console.log('[Offline Storage] Draft saved:', draft.id);
}

/**
 * Delete draft
 */
export async function deleteDraft(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('drafts', id);
  console.log('[Offline Storage] Draft deleted:', id);
}

/**
 * Auto-save draft (debounced in component)
 */
export async function autoSaveDraft(
  formType: string,
  formData: Record<string, any>,
  draftId?: string
): Promise<string> {
  const id = draftId || `draft-${formType}-${Date.now()}`;

  await saveDraft({
    id,
    formType,
    formData,
    createdAt: Date.now(),
    autoSaved: true,
  });

  return id;
}

/**
 * Clear old drafts (older than 30 days)
 */
export async function clearOldDrafts(daysOld = 30): Promise<number> {
  const db = await getDB();
  const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);

  const allDrafts = await db.getAll('drafts');
  const oldDrafts = allDrafts.filter(draft => draft.updatedAt < cutoffTime);

  const tx = db.transaction('drafts', 'readwrite');
  await Promise.all([
    ...oldDrafts.map(draft => tx.store.delete(draft.id)),
    tx.done,
  ]);

  console.log('[Offline Storage] Cleared', oldDrafts.length, 'old drafts');
  return oldDrafts.length;
}

// ============================================================================
// Settings Operations
// ============================================================================

/**
 * Get user settings
 */
export async function getUserSettings(userId: string): Promise<UserSettings | undefined> {
  const db = await getDB();
  const settings = await db.getAllFromIndex('settings', 'by-user-id', userId);
  return settings[0];
}

/**
 * Save user settings
 */
export async function saveUserSettings(settings: UserSettings): Promise<void> {
  const db = await getDB();
  await db.put('settings', {
    ...settings,
    updatedAt: Date.now(),
  });
  console.log('[Offline Storage] Settings saved for user:', settings.userId);
}

/**
 * Get specific setting value
 */
export async function getSetting<T = any>(userId: string, key: string, defaultValue?: T): Promise<T | undefined> {
  const settings = await getUserSettings(userId);
  if (!settings) return defaultValue;
  // eslint-disable-next-line security/detect-object-injection
  return settings.preferences[key] ?? defaultValue;
}

/**
 * Update specific setting value
 */
export async function updateSetting(userId: string, key: string, value: any): Promise<void> {
  const settings = await getUserSettings(userId);

  if (settings) {
    // eslint-disable-next-line security/detect-object-injection
    settings.preferences[key] = value;
    await saveUserSettings(settings);
  } else {
    // Create new settings
    await saveUserSettings({
      id: `settings-${userId}`,
      userId,
      theme: 'system',
      language: 'en',
      notifications: {
        enabled: true,
        sound: true,
        desktop: true,
        email: true,
      },
      offlineMode: {
        enabled: true,
        autoSync: true,
        syncInterval: 15,
      },
      preferences: {
        [key]: value,
      },
      updatedAt: Date.now(),
    });
  }
}

// ============================================================================
// Sync Queue Operations
// ============================================================================

/**
 * Add item to sync queue
 */
export async function queueSync(entry: SyncQueueEntry): Promise<void> {
  const db = await getDB();
  await db.put('syncQueue', entry);
  console.log('[Offline Storage] Queued for sync:', entry.operation, entry.entityType, entry.entityId);
}

/**
 * Get all pending sync items
 */
export async function getPendingSyncQueue(): Promise<SyncQueueEntry[]> {
  const db = await getDB();
  const allEntries = await db.getAll('syncQueue');
  return allEntries.sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Get sync queue by entity type
 */
export async function getSyncQueueByType(entityType: SyncQueueEntry['entityType']): Promise<SyncQueueEntry[]> {
  const db = await getDB();
  return await db.getAllFromIndex('syncQueue', 'by-entity-type', entityType);
}

/**
 * Remove item from sync queue
 */
export async function removeSyncQueueEntry(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('syncQueue', id);
  console.log('[Offline Storage] Removed from sync queue:', id);
}

/**
 * Update sync queue entry (for retry logic)
 */
export async function updateSyncQueueEntry(entry: SyncQueueEntry): Promise<void> {
  const db = await getDB();
  await db.put('syncQueue', entry);
}

/**
 * Clear sync queue
 */
export async function clearSyncQueue(): Promise<void> {
  const db = await getDB();
  await db.clear('syncQueue');
  console.log('[Offline Storage] Sync queue cleared');
}

/**
 * Process sync queue when connection is restored
 */
export async function processSyncQueue(
  onSync: (_entry: SyncQueueEntry) => Promise<{ success: boolean; error?: string }>
): Promise<{ success: number; failed: number }> {
  const queue = await getPendingSyncQueue();
  let success = 0;
  let failed = 0;

  console.log('[Offline Storage] Processing sync queue:', queue.length, 'items');

  for (const entry of queue) {
    try {
      const result = await onSync(entry);

      if (result.success) {
        await removeSyncQueueEntry(entry.id);
        success++;

        // Update task sync status if it's a task
        if (entry.entityType === 'task') {
          const task = await getTask(entry.entityId);
          if (task) {
            task._syncStatus = 'synced';
            await saveTask(task);
          }
        }
      } else {
        entry.retryCount++;
        entry.lastError = result.error;

        // Remove from queue if max retries exceeded (3)
        if (entry.retryCount >= 3) {
          console.error('[Offline Storage] Max retries exceeded for:', entry.id);
          await removeSyncQueueEntry(entry.id);
          failed++;
        } else {
          await updateSyncQueueEntry(entry);
        }
      }
    } catch (error) {
      console.error('[Offline Storage] Error processing sync entry:', error);
      entry.retryCount++;
      entry.lastError = error instanceof Error ? error.message : 'Unknown error';

      if (entry.retryCount >= 3) {
        await removeSyncQueueEntry(entry.id);
        failed++;
      } else {
        await updateSyncQueueEntry(entry);
      }
    }
  }

  console.log('[Offline Storage] Sync complete:', success, 'success,', failed, 'failed');
  return { success, failed };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get database statistics
 */
export async function getStorageStats(): Promise<{
  tasks: number;
  drafts: number;
  settings: number;
  syncQueue: number;
  totalSize?: number;
}> {
  const db = await getDB();

  const [tasks, drafts, settings, syncQueue] = await Promise.all([
    db.count('tasks'),
    db.count('drafts'),
    db.count('settings'),
    db.count('syncQueue'),
  ]);

  // Estimate total size (rough calculation)
  let totalSize: number | undefined;
  if ('estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    totalSize = estimate.usage;
  }

  return { tasks, drafts, settings, syncQueue, totalSize };
}

/**
 * Clear all offline data
 */
export async function clearAllOfflineData(): Promise<void> {
  const db = await getDB();

  await Promise.all([
    db.clear('tasks'),
    db.clear('drafts'),
    db.clear('settings'),
    db.clear('syncQueue'),
  ]);

  console.log('[Offline Storage] All offline data cleared');
}

/**
 * Export offline data for debugging
 */
export async function exportOfflineData(): Promise<{
  tasks: Task[];
  drafts: FormDraft[];
  settings: UserSettings[];
  syncQueue: SyncQueueEntry[];
}> {
  const db = await getDB();

  const [tasks, drafts, settings, syncQueue] = await Promise.all([
    db.getAll('tasks'),
    db.getAll('drafts'),
    db.getAll('settings'),
    db.getAll('syncQueue'),
  ]);

  return { tasks, drafts, settings, syncQueue };
}

/**
 * Import offline data (for testing or migration)
 */
export async function importOfflineData(data: {
  tasks?: Task[];
  drafts?: FormDraft[];
  settings?: UserSettings[];
  syncQueue?: SyncQueueEntry[];
}): Promise<void> {
  const db = await getDB();

  const tx = db.transaction(['tasks', 'drafts', 'settings', 'syncQueue'], 'readwrite');

  const operations: Promise<any>[] = [];

  if (data.tasks) {
    operations.push(...data.tasks.map(task => tx.objectStore('tasks').put(task)));
  }
  if (data.drafts) {
    operations.push(...data.drafts.map(draft => tx.objectStore('drafts').put(draft)));
  }
  if (data.settings) {
    operations.push(...data.settings.map(setting => tx.objectStore('settings').put(setting)));
  }
  if (data.syncQueue) {
    operations.push(...data.syncQueue.map(entry => tx.objectStore('syncQueue').put(entry)));
  }

  operations.push(tx.done);

  await Promise.all(operations);

  console.log('[Offline Storage] Data imported successfully');
}
