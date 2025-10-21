"use client";

import { useState } from "react";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuTrigger,
 DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
 AlertDialog,
 AlertDialogAction,
 AlertDialogCancel,
 AlertDialogContent,
 AlertDialogDescription,
 AlertDialogFooter,
 AlertDialogHeader,
 AlertDialogTitle,
 AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
 CheckSquare,
 Square,
 ChevronDown,
 Edit,
 Archive,
 Trash2,
 CheckCircle2,
 Clock,
 AlertTriangle,
 Users,
 Building2,
 X,
} from "lucide-react";

type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled';
type TaskPriority = 'low' | 'medium' | 'high';
type TaskDepartment = 'admin' | 'production' | 'design' | 'sales';

interface Task {
 id: string;
 title: string;
 status: string;
 priority: string;
 department: string;
}

interface TaskBulkOperationsProps {
 tasks: Task[];
 selectedTasks: string[];
 onSelectionChange: (_taskIds: string[]) => void;
 onBulkComplete: () => void;
}

export default function TaskBulkOperations({
 tasks,
 selectedTasks,
 onSelectionChange,
 onBulkComplete,
}: TaskBulkOperationsProps) {
 // Get current user from tRPC (standardized auth pattern)
 const { data: currentUser } = api.userProfile.getCurrentUser.useQuery();
 const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
 const [_isPriorityDialogOpen, _setIsPriorityDialogOpen] = useState(false);
 const [_isDepartmentDialogOpen, _setIsDepartmentDialogOpen] = useState(false);
 const [selectedStatus, setSelectedStatus] = useState<TaskStatus>('todo');
 const [_selectedPriority, _setSelectedPriority] = useState<TaskPriority>('medium');
 const [_selectedDepartment, _setSelectedDepartment] = useState<TaskDepartment>('admin');

 // Get current user ID from auth (extract to variable for reuse)
 const currentUserId = currentUser?.id;

 const bulkUpdateStatusMutation = api.tasks.bulkUpdateStatus.useMutation({
 onSuccess: () => {
 onBulkComplete();
 onSelectionChange([]);
 setIsStatusDialogOpen(false);
 },
 });

 const bulkArchiveMutation = api.tasks.bulkArchive.useMutation({
 onSuccess: () => {
 onBulkComplete();
 onSelectionChange([]);
 },
 });

 const isAllSelected = tasks.length > 0 && selectedTasks.length === tasks.length;
 const isIndeterminate = selectedTasks.length > 0 && selectedTasks.length < tasks.length;

 const handleSelectAll = () => {
 if (isAllSelected) {
 onSelectionChange([]);
 } else {
 onSelectionChange(tasks.map(task => task.id));
 }
 };

 const handleBulkStatusUpdate = () => {
 if (selectedTasks.length === 0 || !currentUserId) return;

 bulkUpdateStatusMutation.mutate({
 task_ids: selectedTasks,
 status: selectedStatus,
 user_id: currentUserId,
 });
 };

 const handleBulkArchive = () => {
 if (selectedTasks.length === 0 || !currentUserId) return;

 bulkArchiveMutation.mutate({
 task_ids: selectedTasks,
 user_id: currentUserId,
 });
 };

 const getStatusConfig = (status: TaskStatus) => {
 switch (status) {
 case 'todo':
 return { icon: AlertTriangle, color: 'text-tertiary', label: 'Todo' };
 case 'in_progress':
 return { icon: Clock, color: 'text-info', label: 'In Progress' };
 case 'completed':
 return { icon: CheckCircle2, color: 'text-success', label: 'Completed' };
 case 'cancelled':
 return { icon: X, color: 'text-destructive', label: 'Cancelled' };
 }
 };

 if (selectedTasks.length === 0) {
 return (
 <div className="flex items-center gap-3 p-4 card/30 rounded-lg border border">
 <button
 onClick={handleSelectAll}
 className="flex items-center gap-2 text-sm text-tertiary hover:text-tertiary"
 >
 <Square className="h-4 w-4" />
 Select all tasks
 </button>
 </div>
 );
 }

 return (
 <div className="flex items-center justify-between p-4 bg-info/20 rounded-lg border border-info/30">
 <div className="flex items-center gap-3">
 <button
 onClick={handleSelectAll}
 className="flex items-center gap-2 text-sm text-info hover:text-info"
 >
 {isAllSelected ? (
 <CheckSquare className="h-4 w-4" />
 ) : (
 <div className="relative">
 <Square className="h-4 w-4" />
 {isIndeterminate && (
 <div className="absolute inset-0 flex items-center justify-center">
 <div className="w-2 h-0.5 bg-info" />
 </div>
 )}
 </div>
 )}
 {selectedTasks.length} of {tasks.length} selected
 </button>

 <Badge variant="outline" className="bg-info/20 text-info border-info/30">
 {selectedTasks.length} task{selectedTasks.length !== 1 ? 's' : ''}
 </Badge>
 </div>

 <div className="flex items-center gap-2">
 {/* Quick Actions */}
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button variant="outline" size="sm" className="flex items-center gap-2">
 <Edit className="h-4 w-4" />
 Bulk Actions
 <ChevronDown className="h-3 w-3" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end">
 <DropdownMenuItem
 onClick={() => setIsStatusDialogOpen(true)}
 disabled={bulkUpdateStatusMutation.isPending || !currentUserId}
 >
 <CheckCircle2 className="h-4 w-4 mr-2" />
 Update Status
 </DropdownMenuItem>
 <DropdownMenuItem disabled>
 <AlertTriangle className="h-4 w-4 mr-2" />
 Update Priority
 </DropdownMenuItem>
 <DropdownMenuItem disabled>
 <Building2 className="h-4 w-4 mr-2" />
 Update Department
 </DropdownMenuItem>
 <DropdownMenuItem disabled>
 <Users className="h-4 w-4 mr-2" />
 Assign Users
 </DropdownMenuItem>
 <DropdownMenuSeparator />
 <DropdownMenuItem
 onClick={handleBulkArchive}
 disabled={bulkArchiveMutation.isPending || !currentUserId}
 >
 <Archive className="h-4 w-4 mr-2" />
 Archive Tasks
 </DropdownMenuItem>
 <DropdownMenuItem disabled className="text-destructive">
 <Trash2 className="h-4 w-4 mr-2" />
 Delete Tasks
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>

 <Button
 variant="ghost"
 size="sm"
 onClick={() => onSelectionChange([])}
 >
 <X className="h-4 w-4" />
 </Button>
 </div>

 {/* Status Update Dialog */}
 <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
 <DialogContent>
 <DialogHeader>
 <DialogTitle>Update Task Status</DialogTitle>
 </DialogHeader>
 <div className="space-y-4">
 <p className="text-sm text-tertiary">
 Update the status of {selectedTasks.length} selected task{selectedTasks.length !== 1 ? 's' : ''}
 </p>

 <div className="space-y-2">
 <label className="text-sm font-medium text-tertiary">
 New Status
 </label>
 <Select
 value={selectedStatus}
 onValueChange={(value: TaskStatus) => setSelectedStatus(value)}
 >
 <SelectTrigger>
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 {(['todo', 'in_progress', 'completed', 'cancelled'] as TaskStatus[]).map((status) => {
 const config = getStatusConfig(status);
 const StatusIcon = config.icon;
 return (
 <SelectItem key={status} value={status}>
 <div className="flex items-center gap-2">
 <StatusIcon className={`h-4 w-4 ${config.color}`} />
 {config.label}
 </div>
 </SelectItem>
 );
 })}
 </SelectContent>
 </Select>
 </div>

 <div className="flex justify-end gap-2">
 <Button
 variant="outline"
 onClick={() => setIsStatusDialogOpen(false)}
 disabled={bulkUpdateStatusMutation.isPending}
 >
 Cancel
 </Button>
 <Button
 onClick={handleBulkStatusUpdate}
 disabled={bulkUpdateStatusMutation.isPending || !currentUserId}
 >
 {bulkUpdateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
 </Button>
 </div>
 </div>
 </DialogContent>
 </Dialog>

 {/* Archive Confirmation */}
 <AlertDialog>
 <AlertDialogTrigger asChild>
 <div />
 </AlertDialogTrigger>
 <AlertDialogContent>
 <AlertDialogHeader>
 <AlertDialogTitle>Archive Tasks</AlertDialogTitle>
 <AlertDialogDescription>
 Are you sure you want to archive {selectedTasks.length} task{selectedTasks.length !== 1 ? 's' : ''}?
 Archived tasks can be restored later.
 </AlertDialogDescription>
 </AlertDialogHeader>
 <AlertDialogFooter>
 <AlertDialogCancel>Cancel</AlertDialogCancel>
 <AlertDialogAction
 onClick={handleBulkArchive}
 disabled={bulkArchiveMutation.isPending || !currentUserId}
 >
 {bulkArchiveMutation.isPending ? 'Archiving...' : 'Archive Tasks'}
 </AlertDialogAction>
 </AlertDialogFooter>
 </AlertDialogContent>
 </AlertDialog>
 </div>
 );
}