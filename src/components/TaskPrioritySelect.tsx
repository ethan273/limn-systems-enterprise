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

type TaskPriority = 'low' | 'medium' | 'high';

interface TaskPrioritySelectProps {
 taskId: string;
 currentPriority: TaskPriority;
 onUpdate?: () => void;
}

export default function TaskPrioritySelect({ taskId, currentPriority, onUpdate }: TaskPrioritySelectProps) {
 const [isUpdating, setIsUpdating] = useState(false);

 const updatePriorityMutation = api.tasks.updatePriority.useMutation({
 onSuccess: () => {
 setIsUpdating(false);
 onUpdate?.();
 },
 onError: (error) => {
 setIsUpdating(false);
 console.error('Failed to update priority:', error);
 },
 });

 const handlePriorityChange = (newPriority: TaskPriority) => {
 if (newPriority === currentPriority || isUpdating) return;
 setIsUpdating(true);
 updatePriorityMutation.mutate({ id: taskId, priority: newPriority });
 };

 return (
 <Select
 value={currentPriority}
 onValueChange={handlePriorityChange}
 disabled={isUpdating}
 >
 <SelectTrigger className="w-24 h-8 border-0 bg-transparent p-0 hover:card focus:card overflow-visible">
 <SelectValue>
 <Badge
 variant="outline"
 className={cn(
 "border text-xs font-medium px-2 py-0.5 h-6",
 currentPriority === 'low' && "bg-muted/20 text-muted border-muted/20",
 currentPriority === 'medium' && "bg-warning/20 text-warning border-warning/20",
 currentPriority === 'high' && "bg-destructive/20 text-destructive border-destructive/20",
 isUpdating && "opacity-50"
 )}
 >
 {currentPriority.toUpperCase()}
 </Badge>
 </SelectValue>
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="low">
 <Badge variant="outline" className="card text-tertiary border/30 text-xs">
 LOW
 </Badge>
 </SelectItem>
 <SelectItem value="medium">
 <Badge variant="outline" className="bg-warning/20 text-warning border-warning/20 text-xs">
 MEDIUM
 </Badge>
 </SelectItem>
 <SelectItem value="high">
 <Badge variant="outline" className="bg-destructive/20 text-destructive border-destructive/20 text-xs">
 HIGH
 </Badge>
 </SelectItem>
 </SelectContent>
 </Select>
 );
}