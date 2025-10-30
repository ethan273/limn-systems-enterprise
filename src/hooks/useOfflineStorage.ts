/**
 * React hooks for offline storage
 *
 * Provides easy-to-use hooks for components to interact with IndexedDB
 */

'use client';
import { log } from '@/lib/logger';

import { useState, useEffect, useCallback } from 'react';
import {
  Task,
  FormDraft,
  UserSettings,
  SyncQueueEntry,
  getAllTasks,
  getTask,
  getTasksByStatus,
  getTasksByPriority,
  getPendingSyncTasks,
  saveTask,
  createTaskOffline,
  deleteTask,
  bulkSaveTasks,
  getAllDrafts,
  getDraft,
  getDraftsByType,
  saveDraft,
  deleteDraft,
  clearOldDrafts,
  getUserSettings,
  saveUserSettings,
  getSetting,
  updateSetting,
  getPendingSyncQueue,
  processSyncQueue,
  clearSyncQueue,
  getStorageStats,
  clearAllOfflineData,
} from '@/lib/pwa/offline-storage';

// ============================================================================
// Task Hooks
// ============================================================================

/**
 * Hook for managing tasks in offline storage
 */
export function useOfflineTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all tasks
  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const allTasks = await getAllTasks();
      setTasks(allTasks);
    } catch (err) {
      log.error('[useOfflineTasks] Error loading tasks:', { error: err });
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load tasks on mount
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Get task by ID
  const getTaskById = useCallback(async (id: string): Promise<Task | undefined> => {
    try {
      return await getTask(id);
    } catch (err) {
      log.error('[useOfflineTasks] Error getting task:', { error: err });
      return undefined;
    }
  }, []);

  // Get tasks by status
  const getByStatus = useCallback(async (status: Task['status']): Promise<Task[]> => {
    try {
      return await getTasksByStatus(status);
    } catch (err) {
      log.error('[useOfflineTasks] Error getting tasks by status:', { error: err });
      return [];
    }
  }, []);

  // Get tasks by priority
  const getByPriority = useCallback(async (priority: Task['priority']): Promise<Task[]> => {
    try {
      return await getTasksByPriority(priority);
    } catch (err) {
      log.error('[useOfflineTasks] Error getting tasks by priority:', { error: err });
      return [];
    }
  }, []);

  // Get pending sync tasks
  const getPendingSync = useCallback(async (): Promise<Task[]> => {
    try {
      return await getPendingSyncTasks();
    } catch (err) {
      log.error('[useOfflineTasks] Error getting pending sync tasks:', { error: err });
      return [];
    }
  }, []);

  // Save task
  const save = useCallback(async (task: Task): Promise<void> => {
    try {
      await saveTask(task);
      await loadTasks(); // Reload tasks
    } catch (err) {
      log.error('[useOfflineTasks] Error saving task:', { error: err });
      throw err;
    }
  }, [loadTasks]);

  // Create task offline
  const create = useCallback(async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> => {
    try {
      const newTask = await createTaskOffline(taskData);
      await loadTasks(); // Reload tasks
      return newTask;
    } catch (err) {
      log.error('[useOfflineTasks] Error creating task:', { error: err });
      throw err;
    }
  }, [loadTasks]);

  // Delete task
  const remove = useCallback(async (id: string): Promise<void> => {
    try {
      await deleteTask(id);
      await loadTasks(); // Reload tasks
    } catch (err) {
      log.error('[useOfflineTasks] Error deleting task:', { error: err });
      throw err;
    }
  }, [loadTasks]);

  // Bulk save tasks (for initial sync)
  const bulkSave = useCallback(async (tasksToSave: Task[]): Promise<void> => {
    try {
      await bulkSaveTasks(tasksToSave);
      await loadTasks(); // Reload tasks
    } catch (err) {
      log.error('[useOfflineTasks] Error bulk saving tasks:', { error: err });
      throw err;
    }
  }, [loadTasks]);

  return {
    tasks,
    loading,
    error,
    loadTasks,
    getTaskById,
    getByStatus,
    getByPriority,
    getPendingSync,
    save,
    create,
    remove,
    bulkSave,
  };
}

// ============================================================================
// Draft Hooks
// ============================================================================

/**
 * Hook for managing form drafts
 */
export function useFormDraft(formType: string, formId?: string) {
  const [draft, setDraft] = useState<FormDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoSaving, setAutoSaving] = useState(false);

  const draftId = formId || `draft-${formType}-${Date.now()}`;

  // Load draft on mount
  useEffect(() => {
    const loadDraft = async () => {
      try {
        setLoading(true);
        const existingDraft = await getDraft(draftId);
        if (existingDraft) {
          setDraft(existingDraft);
        }
      } catch (err) {
        log.error('[useFormDraft] Error loading draft:', { error: err });
      } finally {
        setLoading(false);
      }
    };

    loadDraft();
  }, [draftId]);

  // Save draft
  const save = useCallback(async (formData: Record<string, any>, autoSave = false): Promise<void> => {
    try {
      if (autoSave) {
        setAutoSaving(true);
      }

      const draftToSave: Omit<FormDraft, 'updatedAt'> = {
        id: draftId,
        formType,
        formData,
        createdAt: draft?.createdAt || Date.now(),
        autoSaved: autoSave,
      };

      await saveDraft(draftToSave);
      setDraft({ ...draftToSave, updatedAt: Date.now() });
    } catch (err) {
      log.error('[useFormDraft] Error saving draft:', { error: err });
      throw err;
    } finally {
      if (autoSave) {
        setAutoSaving(false);
      }
    }
  }, [draftId, formType, draft]);

  // Auto-save draft (debounced in component)
  const autoSave = useCallback(async (formData: Record<string, any>): Promise<void> => {
    await save(formData, true);
  }, [save]);

  // Delete draft
  const remove = useCallback(async (): Promise<void> => {
    try {
      await deleteDraft(draftId);
      setDraft(null);
    } catch (err) {
      log.error('[useFormDraft] Error deleting draft:', { error: err });
      throw err;
    }
  }, [draftId]);

  return {
    draft,
    loading,
    autoSaving,
    save,
    autoSave,
    remove,
  };
}

/**
 * Hook for managing all drafts
 */
export function useAllDrafts(formType?: string) {
  const [drafts, setDrafts] = useState<FormDraft[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDrafts = useCallback(async () => {
    try {
      setLoading(true);
      const allDrafts = formType ? await getDraftsByType(formType) : await getAllDrafts();
      setDrafts(allDrafts);
    } catch (err) {
      log.error('[useAllDrafts] Error loading drafts:', { error: err });
    } finally {
      setLoading(false);
    }
  }, [formType]);

  useEffect(() => {
    loadDrafts();
  }, [loadDrafts]);

  const clearOld = useCallback(async (daysOld = 30): Promise<number> => {
    try {
      const count = await clearOldDrafts(daysOld);
      await loadDrafts(); // Reload drafts
      return count;
    } catch (err) {
      log.error('[useAllDrafts] Error clearing old drafts:', { error: err });
      return 0;
    }
  }, [loadDrafts]);

  return {
    drafts,
    loading,
    loadDrafts,
    clearOld,
  };
}

// ============================================================================
// Settings Hooks
// ============================================================================

/**
 * Hook for managing user settings
 */
export function useOfflineSettings(userId: string) {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const userSettings = await getUserSettings(userId);
        if (userSettings) {
          setSettings(userSettings);
        } else {
          // Create default settings
          const defaultSettings: UserSettings = {
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
            preferences: {},
            updatedAt: Date.now(),
          };
          await saveUserSettings(defaultSettings);
          setSettings(defaultSettings);
        }
      } catch (err) {
        log.error('[useOfflineSettings] Error loading settings:', { error: err });
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [userId]);

  // Save settings
  const save = useCallback(async (newSettings: UserSettings): Promise<void> => {
    try {
      await saveUserSettings(newSettings);
      setSettings(newSettings);
    } catch (err) {
      log.error('[useOfflineSettings] Error saving settings:', { error: err });
      throw err;
    }
  }, []);

  // Get specific setting
  const get = useCallback(async <T = any>(key: string, defaultValue?: T): Promise<T | undefined> => {
    try {
      return await getSetting<T>(userId, key, defaultValue);
    } catch (err) {
      log.error('[useOfflineSettings] Error getting setting:', { error: err });
      return defaultValue;
    }
  }, [userId]);

  // Update specific setting
  const update = useCallback(async (key: string, value: any): Promise<void> => {
    try {
      await updateSetting(userId, key, value);
      const updatedSettings = await getUserSettings(userId);
      if (updatedSettings) {
        setSettings(updatedSettings);
      }
    } catch (err) {
      log.error('[useOfflineSettings] Error updating setting:', { error: err });
      throw err;
    }
  }, [userId]);

  return {
    settings,
    loading,
    save,
    get,
    update,
  };
}

// ============================================================================
// Sync Hooks
// ============================================================================

/**
 * Hook for managing sync queue
 */
export function useSyncQueue() {
  const [queue, setQueue] = useState<SyncQueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Load queue
  const loadQueue = useCallback(async () => {
    try {
      setLoading(true);
      const pendingQueue = await getPendingSyncQueue();
      setQueue(pendingQueue);
    } catch (err) {
      log.error('[useSyncQueue] Error loading queue:', { error: err });
    } finally {
      setLoading(false);
    }
  }, []);

  // Load queue on mount
  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  // Process queue
  const processQueue = useCallback(async (
    onSync: (_entry: SyncQueueEntry) => Promise<{ success: boolean; error?: string }>
  ): Promise<{ success: number; failed: number }> => {
    try {
      setSyncing(true);
      const result = await processSyncQueue(onSync);
      await loadQueue(); // Reload queue
      return result;
    } catch (err) {
      log.error('[useSyncQueue] Error processing queue:', { error: err });
      throw err;
    } finally {
      setSyncing(false);
    }
  }, [loadQueue]);

  // Clear queue
  const clear = useCallback(async (): Promise<void> => {
    try {
      await clearSyncQueue();
      await loadQueue(); // Reload queue
    } catch (err) {
      log.error('[useSyncQueue] Error clearing queue:', { error: err });
      throw err;
    }
  }, [loadQueue]);

  return {
    queue,
    loading,
    syncing,
    loadQueue,
    processQueue,
    clear,
  };
}

// ============================================================================
// Storage Stats Hooks
// ============================================================================

/**
 * Hook for monitoring storage statistics
 */
export function useStorageStats() {
  const [stats, setStats] = useState<{
    tasks: number;
    drafts: number;
    settings: number;
    syncQueue: number;
    totalSize?: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // Load stats
  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      const storageStats = await getStorageStats();
      setStats(storageStats);
    } catch (err) {
      log.error('[useStorageStats] Error loading stats:', { error: err });
    } finally {
      setLoading(false);
    }
  }, []);

  // Load stats on mount
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Clear all data
  const clearAll = useCallback(async (): Promise<void> => {
    try {
      await clearAllOfflineData();
      await loadStats(); // Reload stats
    } catch (err) {
      log.error('[useStorageStats] Error clearing all data:', { error: err });
      throw err;
    }
  }, [loadStats]);

  return {
    stats,
    loading,
    loadStats,
    clearAll,
  };
}

// ============================================================================
// Auto-Sync Hook
// ============================================================================

/**
 * Hook for automatic synchronization when online
 */
export function useAutoSync(
  enabled: boolean,
  syncInterval: number = 15, // minutes
  onSync?: (_entry: SyncQueueEntry) => Promise<{ success: boolean; error?: string }>
) {
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: number; failed: number } | null>(null);

  const sync = useCallback(async () => {
    if (!navigator.onLine || !onSync || syncing) {
      return;
    }

    try {
      setSyncing(true);
      const result = await processSyncQueue(onSync);
      setSyncResult(result);
      setLastSync(new Date());
    } catch (err) {
      log.error('[useAutoSync] Error during sync:', { error: err });
    } finally {
      setSyncing(false);
    }
  }, [onSync, syncing]);

  // Auto-sync interval
  useEffect(() => {
    if (!enabled || !onSync) {
      return;
    }

    // Sync immediately when coming online
    const handleOnline = () => {
      log.info('[useAutoSync] Connection restored, syncing...');
      sync();
    };

    window.addEventListener('online', handleOnline);

    // Periodic sync
    const intervalMs = syncInterval * 60 * 1000;
    const interval = setInterval(() => {
      if (navigator.onLine) {
        sync();
      }
    }, intervalMs);

    // Initial sync if online
    if (navigator.onLine) {
      sync();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      clearInterval(interval);
    };
  }, [enabled, syncInterval, onSync, sync]);

  return {
    lastSync,
    syncing,
    syncResult,
    sync,
  };
}
