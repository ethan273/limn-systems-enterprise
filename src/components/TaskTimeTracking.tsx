"use client";
import { log } from '@/lib/logger';

import { useState, useEffect } from "react";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader as _CardHeader, CardTitle as _CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Timer,
  Play,
  Pause,
  Square,
  Clock,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Calendar as _Calendar,
} from "lucide-react";
import { formatDistanceToNow as _formatDistanceToNow, format, differenceInSeconds } from "date-fns";

interface TimeEntry {
  id: string;
  taskId: string;
  userId: string;
  description?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in seconds
  createdAt: Date;
}

interface TaskTimeTrackingProps {
  taskId: string;
  onUpdate?: () => void;
}


export default function TaskTimeTracking({ taskId, onUpdate }: TaskTimeTrackingProps) {
  // Get current user from tRPC (standardized auth pattern)
  const { data: currentUser } = api.userProfile.getCurrentUser.useQuery();
  const [isTrackingTime, setIsTrackingTime] = useState(false);
  const [currentStartTime, setCurrentStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isAddEntryDialogOpen, setIsAddEntryDialogOpen] = useState(false);
  const [isEditEntryDialogOpen, setIsEditEntryDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [manualHours, setManualHours] = useState("");
  const [manualMinutes, setManualMinutes] = useState("");
  const [entryDescription, setEntryDescription] = useState("");
  const [editHours, setEditHours] = useState("");
  const [editMinutes, setEditMinutes] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // Get current user ID from auth (extract to variable for reuse)
  const currentUserId = (currentUser as any)?.id || "";

  // Load time entries using React Query
  const { data: timeEntriesData, isLoading: loadingEntries, refetch } = api.tasks.getTimeEntries.useQuery(
    { taskId },
    { enabled: !!taskId }
  );

  // Transform API data to component format
  const timeEntries: TimeEntry[] = (timeEntriesData || []).map((entry: any) => ({
    id: entry.id,
    taskId: entry.task_id,
    userId: entry.user_id,
    description: entry.description,
    startTime: new Date(entry.start_time),
    endTime: entry.end_time ? new Date(entry.end_time) : undefined,
    duration: entry.duration,
    createdAt: new Date(entry.created_at),
  }));

  // Mutation hooks
  const addTimeEntryMutation = api.tasks.addTimeEntry.useMutation({
    onSuccess: () => {
      refetch();
      onUpdate?.();
    },
  });

  const updateTimeEntryMutation = api.tasks.updateTimeEntry.useMutation({
    onSuccess: () => {
      refetch();
      onUpdate?.();
    },
  });

  const deleteTimeEntryMutation = api.tasks.deleteTimeEntry.useMutation({
    onSuccess: () => {
      refetch();
      onUpdate?.();
    },
  });

  // Update elapsed time every second when tracking
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isTrackingTime && currentStartTime) {
      interval = setInterval(() => {
        setElapsedTime(differenceInSeconds(new Date(), currentStartTime));
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTrackingTime, currentStartTime]);

  const startTimer = () => {
    const now = new Date();
    setCurrentStartTime(now);
    setIsTrackingTime(true);
    setElapsedTime(0);
  };

  const pauseTimer = () => {
    setIsTrackingTime(false);
  };

  const stopTimer = async () => {
    if (!currentStartTime || !currentUserId) return;

    const endTime = new Date();
    const duration = differenceInSeconds(endTime, currentStartTime);

    try {
      await addTimeEntryMutation.mutateAsync({
        taskId,
        userId: currentUserId,
        startTime: currentStartTime.toISOString(),
        endTime: endTime.toISOString(),
        duration,
      });

      // Reset timer state
      setIsTrackingTime(false);
      setCurrentStartTime(null);
      setElapsedTime(0);
    } catch (error) {
      log.error('Failed to save time entry:', { error });
    }
  };

  const addManualEntry = async () => {
    const hours = parseInt(manualHours) || 0;
    const minutes = parseInt(manualMinutes) || 0;
    const totalMinutes = hours * 60 + minutes;

    if (totalMinutes === 0 || !currentUserId) return;

    const now = new Date();
    const startTime = new Date(now.getTime() - totalMinutes * 60 * 1000);

    try {
      await addTimeEntryMutation.mutateAsync({
        taskId,
        userId: currentUserId,
        description: entryDescription,
        startTime: startTime.toISOString(),
        endTime: now.toISOString(),
        duration: totalMinutes * 60,
      });

      setManualHours("");
      setManualMinutes("");
      setEntryDescription("");
      setIsAddEntryDialogOpen(false);
    } catch (error) {
      log.error('Failed to save manual time entry:', { error });
    }
  };

  const handleEditTimeEntry = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setEditDescription(entry.description || "");
    const hours = Math.floor((entry.duration || 0) / 3600);
    const minutes = Math.floor(((entry.duration || 0) % 3600) / 60);
    setEditHours(hours.toString());
    setEditMinutes(minutes.toString());
    setIsEditEntryDialogOpen(true);
  };

  const handleDeleteTimeEntry = async (entryId: string) => {
    if (confirm("Are you sure you want to delete this time entry?")) {
      try {
        await deleteTimeEntryMutation.mutateAsync({ id: entryId });
      } catch (error) {
        log.error('Failed to delete time entry:', { error });
      }
    }
  };

  const saveEditedEntry = async () => {
    if (!editingEntry) return;

    const hours = parseInt(editHours) || 0;
    const minutes = parseInt(editMinutes) || 0;
    const totalMinutes = hours * 60 + minutes;

    if (totalMinutes === 0) return;

    const duration = totalMinutes * 60; // Convert to seconds
    const now = new Date();
    const startTime = new Date(now.getTime() - totalMinutes * 60 * 1000);

    try {
      await updateTimeEntryMutation.mutateAsync({
        id: editingEntry.id,
        description: editDescription,
        duration,
        startTime: startTime.toISOString(),
        endTime: now.toISOString(),
      });

      // Reset edit state
      setEditingEntry(null);
      setEditDescription("");
      setEditHours("");
      setEditMinutes("");
      setIsEditEntryDialogOpen(false);
    } catch (error) {
      log.error('Failed to update time entry:', { error });
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const totalTimeSpent = timeEntries.reduce((total, entry) => total + (entry.duration || 0), 0);

  return (
    <div className="space-y-4">
      {/* Timer Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-tertiary">
          <Timer className="h-4 w-4" />
          Time Tracking
        </div>
        <Badge variant="outline" className="text-xs">
          Total: {formatTime(totalTimeSpent)}
        </Badge>
      </div>

      {/* Active Timer */}
      <Card className="card/30 border/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-info" />
                <div className="font-mono text-lg font-bold text-info">
                  {formatDuration(elapsedTime)}
                </div>
              </div>
              {isTrackingTime && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
                  <span className="text-xs text-tertiary">Recording</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {!isTrackingTime && !currentStartTime && (
                <Button size="sm" onClick={startTimer} className="bg-success hover:bg-success">
                  <Play className="h-4 w-4 mr-1" />
                  Start
                </Button>
              )}

              {isTrackingTime && (
                <Button size="sm" variant="outline" onClick={pauseTimer}>
                  <Pause className="h-4 w-4 mr-1" />
                  Pause
                </Button>
              )}

              {!isTrackingTime && currentStartTime && (
                <Button size="sm" onClick={startTimer} className="bg-success hover:bg-success">
                  <Play className="h-4 w-4 mr-1" />
                  Resume
                </Button>
              )}

              {currentStartTime && (
                <Button size="sm" variant="outline" onClick={stopTimer} className="text-destructive border-destructive hover:bg-destructive/10">
                  <Square className="h-4 w-4 mr-1" />
                  Stop
                </Button>
              )}

              <Dialog open={isAddEntryDialogOpen} onOpenChange={setIsAddEntryDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Time
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Time Entry</DialogTitle>
                    <DialogDescription>
                      Manually add time spent on this task by entering hours and minutes.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-tertiary">Hours</label>
                        <Input
                          type="number"
                          min="0"
                          max="23"
                          value={manualHours}
                          onChange={(e) => setManualHours(e.target.value)}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-tertiary">Minutes</label>
                        <Input
                          type="number"
                          min="0"
                          max="59"
                          value={manualMinutes}
                          onChange={(e) => setManualMinutes(e.target.value)}
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-tertiary">Description (Optional)</label>
                      <Textarea
                        value={entryDescription}
                        onChange={(e) => setEntryDescription(e.target.value)}
                        placeholder="What did you work on?"
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsAddEntryDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={addManualEntry}>
                        Add Entry
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Edit Time Entry Dialog */}
              <Dialog open={isEditEntryDialogOpen} onOpenChange={setIsEditEntryDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Time Entry</DialogTitle>
                    <DialogDescription>
                      Edit the hours, minutes, and description for this time entry.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-tertiary">Hours</label>
                        <Input
                          type="number"
                          min="0"
                          max="23"
                          value={editHours}
                          onChange={(e) => setEditHours(e.target.value)}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-tertiary">Minutes</label>
                        <Input
                          type="number"
                          min="0"
                          max="59"
                          value={editMinutes}
                          onChange={(e) => setEditMinutes(e.target.value)}
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-tertiary">Description (Optional)</label>
                      <Textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="What did you work on?"
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsEditEntryDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={saveEditedEntry}>
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Entries */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-tertiary">Time Entries</h4>

{loadingEntries ? (
        <div className="text-center py-6 text-secondary">
          <Clock className="h-8 w-8 mx-auto mb-2 text-secondary animate-spin" />
          <p className="text-sm">Loading time entries...</p>
        </div>
      ) : timeEntries.length > 0 ? (
        <div className="space-y-2">
          {timeEntries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between p-3 card/20 rounded border border/30 hover:card/30 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs font-mono">
                    {formatTime(entry.duration || 0)}
                  </Badge>
                  <span className="text-xs text-tertiary">
                    {format(entry.startTime, 'MMM d, h:mm a')}
                    {entry.endTime && ` - ${format(entry.endTime, 'h:mm a')}`}
                  </span>
                </div>
                {entry.description && (
                  <p className="text-sm text-tertiary truncate">
                    {entry.description}
                  </p>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEditTimeEntry(entry)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Entry
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => handleDeleteTimeEntry(entry.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Entry
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-secondary">
          <Clock className="h-8 w-8 mx-auto mb-2 text-secondary" />
          <p className="text-sm">No time entries yet</p>
          <p className="text-xs text-secondary">Start the timer or add a manual entry</p>
        </div>
      )}
      </div>
    </div>
  );
}
