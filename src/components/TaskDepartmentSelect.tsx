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
import { cn } from "@/lib/utils";

type TaskDepartment = 'admin' | 'production' | 'design' | 'sales';

interface TaskDepartmentSelectProps {
  taskId: string;
  currentDepartment: TaskDepartment;
  onUpdate?: () => void;
}

export default function TaskDepartmentSelect({ taskId, currentDepartment, onUpdate }: TaskDepartmentSelectProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const updateDepartmentMutation = api.tasks.updateDepartment.useMutation({
    onSuccess: () => {
      setIsUpdating(false);
      onUpdate?.();
    },
    onError: (error) => {
      setIsUpdating(false);
      console.error('Failed to update department:', error);
    },
  });

  const handleDepartmentChange = (newDepartment: TaskDepartment) => {
    if (newDepartment === currentDepartment || isUpdating) return;
    setIsUpdating(true);
    updateDepartmentMutation.mutate({ id: taskId, department: newDepartment });
  };

  const getDepartmentLabel = (department: TaskDepartment) => {
    return department.charAt(0).toUpperCase() + department.slice(1);
  };

  return (
    <Select
      value={currentDepartment}
      onValueChange={handleDepartmentChange}
      disabled={isUpdating}
    >
      <SelectTrigger className="w-28 h-8 border-0 bg-transparent p-0 hover:card focus:card overflow-visible">
        <SelectValue>
          <Badge
            variant="outline"
            className={cn(
              "border text-xs font-medium px-2 py-0.5 h-6",
              currentDepartment === 'admin' && "bg-purple-500/20 text-purple-400 border-purple-500/20",
              currentDepartment === 'production' && "bg-orange-500/20 text-orange-400 border-orange-500/20",
              currentDepartment === 'design' && "bg-pink-500/20 text-pink-400 border-pink-500/20",
              currentDepartment === 'sales' && "bg-green-500/20 text-green-400 border-green-500/20",
              isUpdating && "opacity-50"
            )}
          >
            {getDepartmentLabel(currentDepartment)}
          </Badge>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="admin">
          <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/20 text-xs">
            Admin
          </Badge>
        </SelectItem>
        <SelectItem value="production">
          <Badge variant="outline" className="bg-orange-500/20 text-orange-400 border-orange-500/20 text-xs">
            Production
          </Badge>
        </SelectItem>
        <SelectItem value="design">
          <Badge variant="outline" className="bg-pink-500/20 text-pink-400 border-pink-500/20 text-xs">
            Design
          </Badge>
        </SelectItem>
        <SelectItem value="sales">
          <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/20 text-xs">
            Sales
          </Badge>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
