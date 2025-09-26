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
      <SelectTrigger className="w-28 min-h-[50px] h-auto border-0 bg-transparent p-2 hover:bg-gray-700 focus:bg-gray-700 overflow-visible">
        <SelectValue>
          <Badge
            variant="secondary"
            className={cn(
              "text-xs font-medium px-2 py-1 bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white",
              isUpdating && "opacity-50"
            )}
          >
            {getDepartmentLabel(currentDepartment)}
          </Badge>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="admin">
          <Badge variant="secondary" className="text-xs bg-gray-700 text-gray-300">
            Admin
          </Badge>
        </SelectItem>
        <SelectItem value="production">
          <Badge variant="secondary" className="text-xs bg-gray-700 text-gray-300">
            Production
          </Badge>
        </SelectItem>
        <SelectItem value="design">
          <Badge variant="secondary" className="text-xs bg-gray-700 text-gray-300">
            Design
          </Badge>
        </SelectItem>
        <SelectItem value="sales">
          <Badge variant="secondary" className="text-xs bg-gray-700 text-gray-300">
            Sales
          </Badge>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}