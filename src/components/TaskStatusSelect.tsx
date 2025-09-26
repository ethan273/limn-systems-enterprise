"use client";

import { useState } from "react";
import { api } from "@/lib/api/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";

type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled';

interface TaskStatusSelectProps {
  taskId: string;
  currentStatus: TaskStatus;
  onUpdate?: () => void;
}

export default function TaskStatusSelect({ taskId, currentStatus, onUpdate }: TaskStatusSelectProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const updateStatusMutation = api.tasks.updateStatus.useMutation({
    onSuccess: () => {
      setIsUpdating(false);
      onUpdate?.();
    },
    onError: (error) => {
      setIsUpdating(false);
      console.error('Failed to update status:', error);
    },
  });

  const handleStatusChange = (newStatus: TaskStatus) => {
    if (newStatus === currentStatus || isUpdating) return;
    setIsUpdating(true);
    updateStatusMutation.mutate({ id: taskId, status: newStatus });
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'todo':
        return <AlertCircle className="h-3 w-3 text-gray-400" />;
      case 'in_progress':
        return <Clock className="h-3 w-3 text-blue-400" />;
      case 'completed':
        return <CheckCircle2 className="h-3 w-3 text-green-400" />;
      case 'cancelled':
        return <X className="h-3 w-3 text-red-400" />;
    }
  };

  const getStatusLabel = (status: TaskStatus) => {
    switch (status) {
      case 'todo':
        return 'Todo';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
    }
  };

  return (
    <Select
      value={currentStatus}
      onValueChange={handleStatusChange}
      disabled={isUpdating}
    >
      <SelectTrigger className="w-32 min-h-[50px] h-auto border-0 bg-transparent p-2 hover:bg-gray-700 focus:bg-gray-700 overflow-visible">
        <SelectValue>
          <Badge
            variant="outline"
            className={cn(
              "border text-xs font-medium flex items-center gap-1 px-2 py-1",
              currentStatus === 'todo' && "bg-gray-500/20 text-gray-400 border-gray-500/20",
              currentStatus === 'in_progress' && "bg-blue-500/20 text-blue-400 border-blue-500/20",
              currentStatus === 'completed' && "bg-green-500/20 text-green-400 border-green-500/20",
              currentStatus === 'cancelled' && "bg-red-500/20 text-red-400 border-red-500/20",
              isUpdating && "opacity-50"
            )}
          >
            {getStatusIcon(currentStatus)}
            {getStatusLabel(currentStatus)}
          </Badge>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="todo">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-3 w-3 text-gray-400" />
            Todo
          </div>
        </SelectItem>
        <SelectItem value="in_progress">
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3 text-blue-400" />
            In Progress
          </div>
        </SelectItem>
        <SelectItem value="completed">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3 w-3 text-green-400" />
            Completed
          </div>
        </SelectItem>
        <SelectItem value="cancelled">
          <div className="flex items-center gap-2">
            <X className="h-3 w-3 text-red-400" />
            Cancelled
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}