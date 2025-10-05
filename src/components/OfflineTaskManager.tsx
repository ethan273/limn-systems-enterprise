/**
 * Offline Task Manager Component
 *
 * Demonstrates comprehensive usage of the offline storage system with tasks
 * Provides offline-first task management with automatic sync
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  useOfflineTasks,
  useFormDraft,
  useSyncQueue,
  useStorageStats,
  useAutoSync,
} from '@/hooks/useOfflineStorage';
import { Task, SyncQueueEntry } from '@/lib/pwa/offline-storage';
import {
  Plus,
  Edit,
  Trash2,
  Save,
  RefreshCw,
  Cloud,
  CloudOff,
  CheckCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react';

export function OfflineTaskManager() {
  const [isOnline, setIsOnline] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo' as Task['status'],
    priority: 'medium' as Task['priority'],
    dueDate: '',
  });

  // Hooks
  const { tasks, loading, loadTasks, create, save, remove } = useOfflineTasks();
  const { draft, autoSave } = useFormDraft('task', selectedTask?.id);
  const { queue, processQueue, loadQueue } = useSyncQueue();
  const { stats, loadStats } = useStorageStats();

  // Auto-sync configuration
  const { lastSync, syncing, syncResult } = useAutoSync(
    true, // enabled
    5, // sync every 5 minutes
    async (entry: SyncQueueEntry) => {
      // This would call your actual API
      // For demo purposes, we'll just simulate success
      console.log('[OfflineTaskManager] Syncing:', entry);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      // In real implementation, this would call your tRPC API
      // const result = await api.tasks.create.mutate(entry.data);

      return { success: true };
    }
  );

  // Monitor online/offline status
  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    updateOnlineStatus();
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Auto-save form draft
  useEffect(() => {
    if (showForm && (formData.title || formData.description)) {
      const timer = setTimeout(() => {
        autoSave(formData);
      }, 1000); // Debounce 1 second

      return () => clearTimeout(timer);
    }
  }, [formData, showForm, autoSave]);

  // Load draft when editing
  useEffect(() => {
    if (selectedTask && draft && draft.formData) {
      setFormData(draft.formData as typeof formData);
    }
  }, [selectedTask, draft]);

  // Handle create task
  const handleCreateTask = async () => {
    try {
      await create({
        title: formData.title,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        dueDate: formData.dueDate || null,
        assignedTo: null,
        createdBy: null,
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        dueDate: '',
      });
      setShowForm(false);
      loadStats();
    } catch (err) {
      console.error('[OfflineTaskManager] Error creating task:', err);
    }
  };

  // Handle update task
  const handleUpdateTask = async () => {
    if (!selectedTask) return;

    try {
      await save({
        ...selectedTask,
        title: formData.title,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        dueDate: formData.dueDate || null,
        updatedAt: new Date().toISOString(),
      });

      setSelectedTask(null);
      setShowForm(false);
      loadStats();
    } catch (err) {
      console.error('[OfflineTaskManager] Error updating task:', err);
    }
  };

  // Handle delete task
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      await remove(taskId);
      loadStats();
    } catch (err) {
      console.error('[OfflineTaskManager] Error deleting task:', err);
    }
  };

  // Handle sync queue manually
  const handleManualSync = async () => {
    try {
      await processQueue(async (entry: SyncQueueEntry) => {
        console.log('[OfflineTaskManager] Manual sync:', entry);
        await new Promise(resolve => setTimeout(resolve, 500));
        return { success: true };
      });
      await loadTasks();
      await loadQueue();
      await loadStats();
    } catch (err) {
      console.error('[OfflineTaskManager] Error during manual sync:', err);
    }
  };

  // Get task status color
  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed': return 'status-completed';
      case 'in_progress': return 'status-in-progress';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-todo';
    }
  };

  // Get priority color
  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return 'priority-high';
      case 'low': return 'priority-low';
      default: return 'priority-medium';
    }
  };

  return (
    <div className="offline-task-manager">
      {/* Header with status indicators */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Offline Task Manager</h2>
          <p className="text-muted-foreground">
            Demonstrating IndexedDB offline storage with automatic sync
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Online/Offline indicator */}
          <div className={`connection-status ${isOnline ? 'connection-online' : 'connection-offline'}`}>
            {isOnline ? (
              <>
                <Cloud className="h-4 w-4" />
                <span className="text-sm font-medium">Online</span>
              </>
            ) : (
              <>
                <CloudOff className="h-4 w-4" />
                <span className="text-sm font-medium">Offline</span>
              </>
            )}
          </div>

          {/* Sync status */}
          {syncing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Syncing...</span>
            </div>
          )}

          {/* Last sync time */}
          {lastSync && !syncing && (
            <div className="text-sm text-muted-foreground">
              Last sync: {lastSync.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.tasks || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Pending Sync</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.syncQueue || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Form Drafts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.drafts || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Storage Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalSize ? `${(stats.totalSize / 1024 / 1024).toFixed(2)} MB` : 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sync Queue Status */}
      {queue.length > 0 && (
        <Card className="mb-6 alert-warning">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                <CardTitle>
                  {queue.length} item(s) pending sync
                </CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualSync}
                disabled={!isOnline || syncing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                Sync Now
              </Button>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Sync Results */}
      {syncResult && (
        <Card className="mb-6 alert-success">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <CardTitle>
                Sync completed: {syncResult.success} successful, {syncResult.failed} failed
              </CardTitle>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2 mb-6">
        <Button
          onClick={() => {
            setSelectedTask(null);
            setFormData({
              title: '',
              description: '',
              status: 'todo',
              priority: 'medium',
              dueDate: '',
            });
            setShowForm(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button>

        <Button variant="outline" onClick={loadTasks}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Task Form */}
      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{selectedTask ? 'Edit Task' : 'Create New Task'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  className="input-field w-full"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Task title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  className="input-field w-full"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Task description"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    className="input-field w-full"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Task['status'] })}
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Priority</label>
                  <select
                    className="input-field w-full"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as Task['priority'] })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Due Date</label>
                  <input
                    type="date"
                    className="input-field w-full"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button onClick={selectedTask ? handleUpdateTask : handleCreateTask}>
                  <Save className="h-4 w-4 mr-2" />
                  {selectedTask ? 'Update Task' : 'Create Task'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setSelectedTask(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Task List */}
      <Card>
        <CardHeader>
          <CardTitle>Tasks ({tasks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">Loading tasks...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No tasks yet. Create your first task!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{task.title}</h3>
                      <span className={`badge ${getStatusColor(task.status)}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                      <span className={`badge ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      {task._syncStatus === 'pending' && (
                        <span className="badge badge-warning">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending Sync
                        </span>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                    )}
                    {task.dueDate && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedTask(task);
                        setFormData({
                          title: task.title,
                          description: task.description || '',
                          status: task.status,
                          priority: task.priority,
                          dueDate: task.dueDate || '',
                        });
                        setShowForm(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTask(task.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
