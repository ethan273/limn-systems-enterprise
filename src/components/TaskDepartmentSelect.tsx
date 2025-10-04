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
              currentDepartment === 'admin' && "bg-primary/20 text-primary border-primary/20",
              currentDepartment === 'production' && "bg-warning/20 text-warning border-warning/20",
              currentDepartment === 'design' && "bg-muted/20 text-muted border-muted/20",
              currentDepartment === 'sales' && "bg-success/20 text-success border-success/20",
              isUpdating && "opacity-50"
            )}
          >
            {getDepartmentLabel(currentDepartment)}
          </Badge>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="admin">
          <Badge variant="outline" className="bg-primary/20 text-primary border-primary/20 text-xs">
            Admin
          </Badge>
        </SelectItem>
        <SelectItem value="production">
          <Badge variant="outline" className="bg-warning/20 text-warning border-warning/20 text-xs">
            Production
          </Badge>
        </SelectItem>
        <SelectItem value="design">
          <Badge variant="outline" className="bg-muted/20 text-muted border-muted/20 text-xs">
            Design
          </Badge>
        </SelectItem>
        <SelectItem value="sales">
          <Badge variant="outline" className="bg-success/20 text-success border-success/20 text-xs">
            Sales
          </Badge>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
