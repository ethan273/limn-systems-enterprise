"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
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
  const { user } = useAuth();
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
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(true);

  // Get current user ID from auth
  const currentUserId = user?.id;

  // Load time entries on mount
  useEffect(() => {
    const loadTimeEntries = async () => {
      try {
        // TODO: Implement time tracking API endpoints
        // const entries = await api.tasks.getTimeEntries.query({ taskId });
        // setTimeEntries(entries);
        console.log('Loading time entries for task:', taskId);
        // For now, set empty array since we don't have the API yet
        setTimeEntries([]);
      } catch (error) {
        console.error('Failed to load time entries:', error);
        setTimeEntries([]);
      } finally {
        setLoadingEntries(false);
      }
    };

    loadTimeEntries();
  }, [taskId]);

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

  const stopTimer = () => {
    if (!currentStartTime) return;

    const endTime = new Date();
    const duration = differenceInSeconds(endTime, currentStartTime);

    // Save the time entry via API
    if (currentUserId) {
      try {
        // Note: This would need to be implemented in the API
        console.log('Saving time entry:', {
          taskId,
          userId: currentUserId,
          startTime: currentStartTime,
          endTime,
          duration,
        });
        // TODO: Implement time tracking API endpoints
        // await api.tasks.addTimeEntry.mutate({
        //   taskId,
        //   userId: currentUserId,
        //   startTime: currentStartTime.toISOString(),
        //   endTime: endTime.toISOString(),
        //   duration,
        // });
      } catch (error) {
        console.error('Failed to save time entry:', error);
      }
    }

    // Reset timer state
    setIsTrackingTime(false);
    setCurrentStartTime(null);
    setElapsedTime(0);
    onUpdate?.();
  };

  const addManualEntry = () => {
    const hours = parseInt(manualHours) || 0;
    const minutes = parseInt(manualMinutes) || 0;
    const totalMinutes = hours * 60 + minutes;

    if (totalMinutes === 0) return;

    const now = new Date();
    const startTime = new Date(now.getTime() - totalMinutes * 60 * 1000);

    // Save the manual time entry via API
    if (currentUserId) {
      try {
        console.log('Saving manual time entry:', {
          taskId,
          userId: currentUserId,
          description: entryDescription,
          startTime,
          endTime: now,
          duration: totalMinutes * 60,
        });
        // TODO: Implement time tracking API endpoints
        // await api.tasks.addTimeEntry.mutate({
        //   taskId,
        //   userId: currentUserId,
        //   description: entryDescription,
        //   startTime: startTime.toISOString(),
        //   endTime: now.toISOString(),
        //   duration: totalMinutes * 60,
        // });
      } catch (error) {
        console.error('Failed to save manual time entry:', error);
      }
    }

    setManualHours("");
    setManualMinutes("");
    setEntryDescription("");
    setIsAddEntryDialogOpen(false);
    onUpdate?.();
  };

  const handleEditTimeEntry = (entry: TimeEntry) => {
    console.log('Editing time entry:', entry);
    setEditingEntry(entry);
    setEditDescription(entry.description || "");
    const hours = Math.floor((entry.duration || 0) / 3600);
    const minutes = Math.floor(((entry.duration || 0) % 3600) / 60);
    setEditHours(hours.toString());
    setEditMinutes(minutes.toString());
    setIsEditEntryDialogOpen(true);
  };

  const handleDeleteTimeEntry = (entryId: string) => {
    if (confirm("Are you sure you want to delete this time entry?")) {
      console.log('Deleting time entry:', entryId);
      // Remove the entry from the state
      setTimeEntries(prev => prev.filter(entry => entry.id !== entryId));
      onUpdate?.();
    }
  };

  const saveEditedEntry = () => {
    if (!editingEntry) return;

    const hours = parseInt(editHours) || 0;
    const minutes = parseInt(editMinutes) || 0;
    const totalMinutes = hours * 60 + minutes;

    if (totalMinutes === 0) return;

    const duration = totalMinutes * 60; // Convert to seconds
    const now = new Date();
    const startTime = new Date(now.getTime() - totalMinutes * 60 * 1000);

    // Update the entry in the state
    setTimeEntries(prev => prev.map(entry =>
      entry.id === editingEntry.id
        ? {
            ...entry,
            description: editDescription,
            duration,
            startTime,
            endTime: now,
          }
        : entry
    ));

    // Reset edit state
    setEditingEntry(null);
    setEditDescription("");
    setEditHours("");
    setEditMinutes("");
    setIsEditEntryDialogOpen(false);
    onUpdate?.();
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
        <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
          <Timer className="h-4 w-4" />
          Time Tracking
        </div>
        <Badge variant="outline" className="text-xs">
          Total: {formatTime(totalTimeSpent)}
        </Badge>
      </div>

      {/* Active Timer */}
      <Card className="bg-gray-700/30 border-gray-600/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-400" />
                <div className="font-mono text-lg font-bold text-blue-400">
                  {formatDuration(elapsedTime)}
                </div>
              </div>
              {isTrackingTime && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-xs text-gray-400">Recording</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {!isTrackingTime && !currentStartTime && (
                <Button size="sm" onClick={startTimer} className="bg-green-600 hover:bg-green-700">
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
                <Button size="sm" onClick={startTimer} className="bg-green-600 hover:bg-green-700">
                  <Play className="h-4 w-4 mr-1" />
                  Resume
                </Button>
              )}

              {currentStartTime && (
                <Button size="sm" variant="outline" onClick={stopTimer} className="text-red-400 border-red-400 hover:bg-red-400/10">
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
                        <label className="text-sm font-medium text-gray-300">Hours</label>
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
                        <label className="text-sm font-medium text-gray-300">Minutes</label>
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
                      <label className="text-sm font-medium text-gray-300">Description (Optional)</label>
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
                        <label className="text-sm font-medium text-gray-300">Hours</label>
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
                        <label className="text-sm font-medium text-gray-300">Minutes</label>
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
                      <label className="text-sm font-medium text-gray-300">Description (Optional)</label>
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
        <h4 className="text-sm font-medium text-gray-300">Time Entries</h4>

{loadingEntries ? (
          <div className="text-center py-6 text-gray-500">
            <Clock className="h-8 w-8 mx-auto mb-2 text-gray-600 animate-spin" />
            <p className="text-sm">Loading time entries...</p>
          </div>
        ) : timeEntries.length > 0 ? (
          <div className="space-y-2">
            {timeEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 bg-gray-700/20 rounded border border-gray-600/30 hover:bg-gray-700/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs font-mono">
                      {formatTime(entry.duration || 0)}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      {format(entry.startTime, 'MMM d, h:mm a')}
                      {entry.endTime && ` - ${format(entry.endTime, 'h:mm a')}`}
                    </span>
                  </div>
                  {entry.description && (
                    <p className="text-sm text-gray-300 truncate">
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
                      className="text-red-400"
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
          <div className="text-center py-6 text-gray-500">
            <Clock className="h-8 w-8 mx-auto mb-2 text-gray-600" />
            <p className="text-sm">No time entries yet</p>
            <p className="text-xs text-gray-600">Start the timer or add a manual entry</p>
          </div>
        )}
      </div>
    </div>
  );
}