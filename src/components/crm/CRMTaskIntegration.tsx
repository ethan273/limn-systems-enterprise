'use client';
import { log } from '@/lib/logger';

import React, { useState } from 'react';
import { api } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
 // DialogTrigger not used
} from '@/components/ui/dialog';
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from '@/components/ui/select';
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuSeparator,
 DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
 CheckSquare,
 Plus,
 Calendar,
 // Clock not used
 User,
 Users,
 Building2,
 Target,
 ExternalLink,
 MoreHorizontal,
 Edit,
 Trash2,
 // Link not used
 CheckCircle,
 AlertCircle,
 Briefcase,
} from 'lucide-react';
import { format } from 'date-fns';

// CRM Entity Types for task linking
type CRMEntityType = 'contact' | 'lead' | 'customer' | 'opportunity' | 'client';

// Task Status and Priority types
type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled';
type TaskPriority = 'low' | 'medium' | 'high';

interface CRMTaskIntegrationProps {
 entityType: CRMEntityType;
 entityId: string;
 entityName: string;
 currentUserId?: string;
 currentUserName?: string;
 className?: string;
}

interface CreateTaskDialogProps {
 open: boolean;
 onOpenChange: (_open: boolean) => void;
 entityType: CRMEntityType;
 entityId: string;
 entityName: string;
 onTaskCreate?: () => void;
 currentUserId?: string;
 currentUserName?: string;
}

interface TaskData {
 title: string;
 description: string;
 status: TaskStatus;
 priority: TaskPriority;
 due_date?: string;
 assigned_to: string[];
}

function CreateTaskDialog({
 open,
 onOpenChange,
 entityType,
 entityId,
 entityName,
 onTaskCreate,
 currentUserId,
 currentUserName: _currentUserName,
}: CreateTaskDialogProps) {
 const [taskData, setTaskData] = useState<TaskData>({
 title: '',
 description: '',
 status: 'todo',
 priority: 'medium',
 assigned_to: currentUserId ? [currentUserId] : [],
 });

 const { data: usersData } = api.users.getAllUsers.useQuery({ limit: 100 });
 const users = usersData?.users || [];

 const createTask = api.tasks.create.useMutation({
 onSuccess: () => {
 onTaskCreate?.();
 setTaskData({
 title: '',
 description: '',
 status: 'todo',
 priority: 'medium',
 assigned_to: currentUserId ? [currentUserId] : [],
 });
 onOpenChange(false);
 },
 });

 const handleSubmit = () => {
 if (!taskData.title.trim()) return;

 const taskPayload = {
 title: `[${entityType.toUpperCase()}] ${taskData.title}`,
 description: `${taskData.description}\n\nRelated to ${entityType}: ${entityName}`,
 status: taskData.status,
 priority: taskData.priority,
 due_date: taskData.due_date || undefined,
 assigned_to: taskData.assigned_to,
 created_by: currentUserId || '',
 department: 'admin' as const, // Default department
 tags: [entityType, 'crm'],
 visibility: 'company' as const,
 // Add entity link metadata
 entity_links: [{
 entity_type: entityType,
 entity_id: entityId,
 entity_name: entityName,
 link_type: 'related',
 }],
 };

 createTask.mutate(taskPayload);
 };

 const toggleUserAssignment = (userId: string) => {
 setTaskData(prev => ({
 ...prev,
 assigned_to: prev.assigned_to.includes(userId)
 ? prev.assigned_to.filter(id => id !== userId)
 : [...prev.assigned_to, userId]
 }));
 };

 return (
 <Dialog open={open} onOpenChange={onOpenChange}>
 <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
 <DialogHeader>
 <DialogTitle>Create Task for {entityName}</DialogTitle>
 <DialogDescription>
 Create a new task related to this {entityType}
 </DialogDescription>
 </DialogHeader>

 <div className="space-y-4">
 <div>
 <Label htmlFor="task-title">Task Title *</Label>
 <Input
 id="task-title"
 value={taskData.title}
 onChange={(e) => setTaskData({ ...taskData, title: e.target.value })}
 placeholder="Enter task title"
 />
 </div>

 <div>
 <Label htmlFor="task-description">Description</Label>
 <Textarea
 id="task-description"
 value={taskData.description}
 onChange={(e) => setTaskData({ ...taskData, description: e.target.value })}
 placeholder="Task description"
 rows={3}
 />
 </div>

 <div className="grid grid-cols-3 gap-4">
 <div>
 <Label htmlFor="task-status">Status</Label>
 <Select value={taskData.status} onValueChange={(value: TaskStatus) => setTaskData({ ...taskData, status: value })}>
 <SelectTrigger>
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="todo">To Do</SelectItem>
 <SelectItem value="in_progress">In Progress</SelectItem>
 <SelectItem value="completed">Completed</SelectItem>
 </SelectContent>
 </Select>
 </div>

 <div>
 <Label htmlFor="task-priority">Priority</Label>
 <Select value={taskData.priority} onValueChange={(value: TaskPriority) => setTaskData({ ...taskData, priority: value })}>
 <SelectTrigger>
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="low">Low</SelectItem>
 <SelectItem value="medium">Medium</SelectItem>
 <SelectItem value="high">High</SelectItem>
 </SelectContent>
 </Select>
 </div>

 <div>
 <Label htmlFor="task-due-date">Due Date</Label>
 <Input
 id="task-due-date"
 type="datetime-local"
 value={taskData.due_date}
 onChange={(e) => setTaskData({ ...taskData, due_date: e.target.value })}
 />
 </div>
 </div>

 <div>
 <Label>Assigned To</Label>
 <div className="max-h-32 overflow-y-auto border border rounded-md p-2 space-y-2">
 {users.map((user: any) => (
 <div key={user.id} className="flex items-center space-x-2">
 <input
 type="checkbox"
 id={`user-${user.id}`}
 checked={taskData.assigned_to.includes(user.id)}
 onChange={() => toggleUserAssignment(user.id)}
 />
 <Avatar className="w-6 h-6">
 <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-foreground text-xs font-medium">
 {user.name.charAt(0).toUpperCase()}
 </div>
 </Avatar>
 <label htmlFor={`user-${user.id}`} className="text-sm text-foreground cursor-pointer flex-1">
 {user.name}
 </label>
 </div>
 ))}
 </div>
 </div>
 </div>

 <DialogFooter>
 <Button variant="outline" onClick={() => onOpenChange(false)}>
 Cancel
 </Button>
 <Button
 onClick={handleSubmit}
 disabled={!taskData.title.trim() || createTask.isPending}
 >
 {createTask.isPending ? 'Creating...' : 'Create Task'}
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 );
}

function _getEntityIcon(_entityType: CRMEntityType) {
 switch (_entityType) {
 case 'contact': return User;
 case 'lead': return Target;
 case 'customer': return Building2;
 case 'opportunity': return Briefcase;
 default: return CheckSquare;
 }
}

function _getEntityColor(_entityType: CRMEntityType) {
 switch (_entityType) {
 case 'contact': return 'border-info/30 bg-info/10 text-info';
 case 'lead': return 'border-success/30 bg-success/10 text-success';
 case 'customer': return 'border-primary/30 bg-primary/10 text-primary';
 case 'opportunity': return 'border-warning/30 bg-warning/10 text-warning';
 default: return 'border/30 card text-tertiary';
 }
}

function getStatusColor(status: TaskStatus) {
 switch (status) {
 case 'todo': return 'card text-tertiary border/20';
 case 'in_progress': return 'bg-info/10 text-info border-info/20';
 case 'completed': return 'bg-success/10 text-success border-success/20';
 case 'cancelled': return 'bg-destructive/10 text-destructive border-destructive/20';
 default: return 'card text-tertiary border/20';
 }
}

function getPriorityColor(priority: TaskPriority) {
 switch (priority) {
 case 'low': return 'card text-tertiary border/20';
 case 'medium': return 'bg-warning/10 text-warning border-warning/20';
 case 'high': return 'bg-destructive/10 text-destructive border-destructive/20';
 default: return 'card text-tertiary border/20';
 }
}

export function CRMTaskIntegration({
 entityType,
 entityId,
 entityName,
 currentUserId,
 currentUserName,
 className = '',
}: CRMTaskIntegrationProps) {
 const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
 const [activeTab, setActiveTab] = useState('related');

 // Query for tasks related to this CRM entity
 // Note: This would need to be implemented in the tRPC router
 // Note: This API endpoint needs to be implemented
 const relatedTasksData: any = [];
 const refetchTasks = () => {};
 const relatedTasks = relatedTasksData || [];

 // Query all tasks to show linking options
 const { data: allTasksData } = api.tasks.getAllTasks.useQuery({ limit: 100 });
 const _allTasks = allTasksData?.tasks || [];

 // Note: This API endpoint needs to be implemented
 const _linkTask = { mutate: (_data: any) => {} };

 // Note: This API endpoint needs to be implemented
 const _unlinkTask = { mutate: (_data: any) => {} };

 const updateTaskStatus = api.tasks.update.useMutation({
 onSuccess: () => {
 refetchTasks();
 },
 });

 const handleTaskCreate = () => {
 refetchTasks();
 };

 const _handleLinkExistingTask = (_taskId: string, _taskTitle: string) => {
 // Note: This would link an existing task to the entity
 log.info('Linking task to entity', { taskId: _taskId, entityId });
 };

 const handleUnlinkTask = (taskId: string) => {
 // This would need the link ID from the task entity links
 const linkId = `${taskId}-${entityId}`; // Simplified, should be actual link ID
 _unlinkTask.mutate({
 id: linkId,
 user_id: currentUserId || '',
 });
 };

 const handleToggleTaskStatus = (taskId: string, currentStatus: TaskStatus) => {
 const newStatus = currentStatus === 'completed' ? 'todo' : 'completed';
 updateTaskStatus.mutate({
 id: taskId,
 status: newStatus,
 });
 };

 const todoTasks = relatedTasks.filter((task: any) => task.status === 'todo');
 const inProgressTasks = relatedTasks.filter((task: any) => task.status === 'in_progress');
 const completedTasks = relatedTasks.filter((task: any) => task.status === 'completed');

 return (
 <div className={`space-y-4 ${className}`}>
 {/* Header */}
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <CheckSquare className="w-5 h-5 text-tertiary" />
 <h3 className="text-lg font-medium text-foreground">Related Tasks</h3>
 <Badge variant="outline" className="text-xs">
 {relatedTasks.length}
 </Badge>
 </div>
 <div className="flex items-center gap-2">
 <Button
 size="sm"
 onClick={() => setIsCreateDialogOpen(true)}
 disabled={!currentUserId}
 >
 <Plus className="w-4 h-4 mr-2" />
 New Task
 </Button>
 </div>
 </div>

 {/* Task Tabs */}
 <Tabs value={activeTab} onValueChange={setActiveTab}>
 <TabsList className="grid w-full grid-cols-4">
 <TabsTrigger value="related">
 All ({relatedTasks.length})
 </TabsTrigger>
 <TabsTrigger value="todo">
 To Do ({todoTasks.length})
 </TabsTrigger>
 <TabsTrigger value="progress">
 In Progress ({inProgressTasks.length})
 </TabsTrigger>
 <TabsTrigger value="completed">
 Completed ({completedTasks.length})
 </TabsTrigger>
 </TabsList>

 <TabsContent value="related" className="space-y-3">
 {relatedTasks.length === 0 ? (
 <div className="text-center py-8">
 <CheckSquare className="w-12 h-12 text-tertiary mx-auto mb-4" />
 <h4 className="text-lg font-medium text-foreground mb-2">No related tasks</h4>
 <p className="text-tertiary mb-4">Create or link tasks to track work for this {entityType}.</p>
 <Button onClick={() => setIsCreateDialogOpen(true)}>
 <Plus className="w-4 h-4 mr-2" />
 Create First Task
 </Button>
 </div>
 ) : (
 <div className="space-y-2">
 {relatedTasks.map((task: any) => (
 <TaskCard
 key={task.id}
 task={task}
 onStatusToggle={handleToggleTaskStatus}
 onUnlink={handleUnlinkTask}
 currentUserId={currentUserId}
 />
 ))}
 </div>
 )}
 </TabsContent>

 <TabsContent value="todo" className="space-y-2">
 {todoTasks.map((task: any) => (
 <TaskCard
 key={task.id}
 task={task}
 onStatusToggle={handleToggleTaskStatus}
 onUnlink={handleUnlinkTask}
 currentUserId={currentUserId}
 />
 ))}
 </TabsContent>

 <TabsContent value="progress" className="space-y-2">
 {inProgressTasks.map((task: any) => (
 <TaskCard
 key={task.id}
 task={task}
 onStatusToggle={handleToggleTaskStatus}
 onUnlink={handleUnlinkTask}
 currentUserId={currentUserId}
 />
 ))}
 </TabsContent>

 <TabsContent value="completed" className="space-y-2">
 {completedTasks.map((task: any) => (
 <TaskCard
 key={task.id}
 task={task}
 onStatusToggle={handleToggleTaskStatus}
 onUnlink={handleUnlinkTask}
 currentUserId={currentUserId}
 />
 ))}
 </TabsContent>
 </Tabs>

 {/* Create Task Dialog */}
 <CreateTaskDialog
 open={isCreateDialogOpen}
 onOpenChange={setIsCreateDialogOpen}
 entityType={entityType}
 entityId={entityId}
 entityName={entityName}
 onTaskCreate={handleTaskCreate}
 currentUserId={currentUserId}
 currentUserName={currentUserName}
 />
 </div>
 );
}

// Task Card Component
function TaskCard({
 task,
 onStatusToggle,
 onUnlink,
 currentUserId: _currentUserId,
}: {
 task: any;
 onStatusToggle: (_taskId: string, _currentStatus: TaskStatus) => void;
 onUnlink: (_taskId: string) => void;
 currentUserId?: string;
}) {
 const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';

 return (
 <div className="flex items-center gap-3 p-3 card/50 rounded-lg border border hover:border transition-colors">
 {/* Status Toggle */}
 <Button
 variant="ghost"
 size="sm"
 onClick={() => onStatusToggle(task.id, task.status)}
 className="h-6 w-6 p-0"
 >
 {task.status === 'completed' ? (
 <CheckCircle className="w-4 h-4 text-success" />
 ) : (
 <div className="w-4 h-4 rounded border-2 border" />
 )}
 </Button>

 {/* Task Info */}
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2">
 <h4 className={`font-medium truncate ${
 task.status === 'completed' ? 'text-tertiary line-through' : 'text-foreground'
 }`}>
 {task.title}
 </h4>
 <Badge className={getStatusColor(task.status as TaskStatus)}>
 {task.status.replace('_', ' ')}
 </Badge>
 <Badge className={getPriorityColor(task.priority as TaskPriority)}>
 {task.priority}
 </Badge>
 {isOverdue && (
 <Badge className="bg-destructive/10 text-destructive border-destructive/20">
 <AlertCircle className="w-3 h-3 mr-1" />
 Overdue
 </Badge>
 )}
 </div>

 <div className="flex items-center gap-3 mt-1 text-xs text-tertiary">
 {task.due_date && (
 <span className="flex items-center gap-1">
 <Calendar className="w-3 h-3" />
 {format(new Date(task.due_date), 'MMM d, yyyy')}
 </span>
 )}
 {task.assigned_to && task.assigned_to.length > 0 && (
 <span className="flex items-center gap-1">
 <Users className="w-3 h-3" />
 {task.assigned_to.length} assigned
 </span>
 )}
 </div>
 </div>

 {/* Actions */}
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
 <MoreHorizontal className="w-4 h-4" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end">
 <DropdownMenuItem>
 <ExternalLink className="w-4 h-4 mr-2" />
 View Task
 </DropdownMenuItem>
 <DropdownMenuItem>
 <Edit className="w-4 h-4 mr-2" />
 Edit Task
 </DropdownMenuItem>
 <DropdownMenuSeparator />
 <DropdownMenuItem
 onClick={() => onUnlink(task.id)}
 className="text-destructive"
 >
 <Trash2 className="w-4 h-4 mr-2" />
 Unlink
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 </div>
 );
}

// Quick Task Button for CRM pages
export function QuickTaskButton({
 entityType,
 entityId,
 entityName,
 currentUserId,
 currentUserName,
 variant = 'default',
 className = '',
}: {
 entityType: CRMEntityType;
 entityId: string;
 entityName: string;
 currentUserId?: string;
 currentUserName?: string;
 variant?: 'default' | 'compact';
 className?: string;
}) {
 const [isOpen, setIsOpen] = useState(false);

 if (variant === 'compact') {
 return (
 <>
 <Button
 size="sm"
 variant="outline"
 onClick={() => setIsOpen(true)}
 className={`h-7 px-3 text-xs ${className}`}
 >
 <Plus className="w-3 h-3 mr-1" />
 Task
 </Button>
 <CreateTaskDialog
 open={isOpen}
 onOpenChange={setIsOpen}
 entityType={entityType}
 entityId={entityId}
 entityName={entityName}
 currentUserId={currentUserId}
 currentUserName={currentUserName}
 />
 </>
 );
 }

 return (
 <>
 <Button
 onClick={() => setIsOpen(true)}
 className={className}
 disabled={!currentUserId}
 >
 <Plus className="w-4 h-4 mr-2" />
 Create Task
 </Button>
 <CreateTaskDialog
 open={isOpen}
 onOpenChange={setIsOpen}
 entityType={entityType}
 entityId={entityId}
 entityName={entityName}
 currentUserId={currentUserId}
 currentUserName={currentUserName}
 />
 </>
 );
}