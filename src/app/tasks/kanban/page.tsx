"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
 Dialog,
 DialogTrigger,
} from "@/components/ui/dialog";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import TaskCreateForm from "@/components/TaskCreateForm";
import TaskPrioritySelect from "@/components/TaskPrioritySelect";
import {
 Plus,
 MoreVertical,
 Calendar,
 Clock,
 Users,
 AlertTriangle,
 CheckCircle2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled';
type TaskPriority = 'low' | 'medium' | 'high';

const statusConfig = {
 todo: {
 title: "To Do",
 icon: AlertTriangle,
 color: "card border-border/20",
 textColor: "text-muted-foreground"
 },
 in_progress: {
 title: "In Progress",
 icon: Clock,
 color: "bg-info-muted/20 border-info/20",
 textColor: "text-info"
 },
 completed: {
 title: "Completed",
 icon: CheckCircle2,
 color: "bg-success-muted/20 border-success/20",
 textColor: "text-success"
 },
 cancelled: {
 title: "Cancelled",
 icon: MoreVertical,
 color: "bg-destructive-muted/20 border-destructive/20",
 textColor: "text-destructive"
 }
};

export default function TasksKanbanPage() {
 const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
 const [users, setUsers] = useState<Record<string, { name: string; initials: string; avatar: string | null }>>({});
 const [_loadingUsers, setLoadingUsers] = useState(true);

 const { data: tasksData, isLoading, refetch } = api.tasks.getAllTasks.useQuery({
 limit: 100,
 offset: 0,
 sortBy: 'created_at',
 sortOrder: 'desc',
 });

 const updateStatusMutation = api.tasks.updateStatus.useMutation({
 onSuccess: () => {
 refetch();
 },
 });

 // Fetch users data
 useEffect(() => {
 const fetchUsers = async () => {
 try {
 // TODO: Implement proper tRPC client call
 // const result = await api.users.getAllUsers.fetch({ limit: 100 });
 console.log('TODO: Load users data via tRPC');
 // TODO: Process user data when API is properly implemented
 setUsers({});
 } catch (error) {
 console.error('Failed to fetch users:', error);
 } finally {
 setLoadingUsers(false);
 }
 };

 fetchUsers();
 }, []);

 const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
 updateStatusMutation.mutate({ id: taskId, status: newStatus });
 };

 const handleTaskUpdate = () => {
 refetch();
 };

 // Group tasks by status
 const tasksByStatus = {
 todo: tasksData?.tasks?.filter(task => task.status === 'todo') || [],
 in_progress: tasksData?.tasks?.filter(task => task.status === 'in_progress') || [],
 completed: tasksData?.tasks?.filter(task => task.status === 'completed') || [],
 cancelled: tasksData?.tasks?.filter(task => task.status === 'cancelled') || []
 };

 if (isLoading) {
 return (
 <div className="p-6">
 <div className="flex items-center justify-center h-64">
 <div className="text-muted-foreground">Loading tasks...</div>
 </div>
 </div>
 );
 }

 return (
 <div className="p-6 space-y-6">
 {/* Header */}
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-bold text-primary">Tasks Kanban</h1>
 <p className="text-secondary">
 Visual task management board - drag and drop to update status
 </p>
 </div>
 <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
 <DialogTrigger asChild>
 <Button>
 <Plus className="h-4 w-4 mr-2" />
 New Task
 </Button>
 </DialogTrigger>
 <TaskCreateForm
 onSuccess={() => {
 setIsCreateDialogOpen(false);
 refetch();
 }}
 onCancel={() => setIsCreateDialogOpen(false)}
 />
 </Dialog>
 </div>

 {/* Kanban Board */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
 {Object.entries(statusConfig).map(([status, config]) => {
 const tasks = tasksByStatus[status as TaskStatus];
 const StatusIcon = config.icon;

 return (
 <Card key={status} className="card flex flex-col">
 <CardHeader className="pb-3">
 <CardTitle className="card-title flex items-center justify-between text-sm">
 <div className="flex items-center gap-2">
 <StatusIcon className={`h-4 w-4 ${config.textColor}`} />
 <span>{config.title}</span>
 <Badge variant="outline" className="text-xs">
 {tasks.length}
 </Badge>
 </div>
 </CardTitle>
 </CardHeader>

 <CardContent className="flex-1 pt-0">
 <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
 {tasks.map((task) => {
 const assignedUsers = task.assigned_to || [];

 return (
 <div
 key={task.id}
 className="card p-3 cursor-pointer group"
 draggable
 onDragStart={(e) => {
 e.dataTransfer.setData('taskId', task.id);
 e.dataTransfer.setData('currentStatus', task.status || 'todo');
 }}
 >
 {/* Task Header */}
 <div className="flex items-start justify-between mb-2">
 <div className="flex-1 min-w-0">
 <h3 className="text-sm font-medium text-primary truncate">
 {task.title}
 </h3>
 {task.description && (
 <p className="text-xs text-secondary line-clamp-2 mt-1">
 {task.description}
 </p>
 )}
 </div>

 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button
 variant="ghost"
 size="sm"
 className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
 >
 <MoreVertical className="h-3 w-3" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end">
 <DropdownMenuItem className="text-sm">
 Edit Task
 </DropdownMenuItem>
 <DropdownMenuItem className="text-sm">
 View Details
 </DropdownMenuItem>
 <DropdownMenuItem className="text-sm text-destructive">
 Delete Task
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 </div>

 {/* Task Metadata */}
 <div className="space-y-2">
 {/* Priority & Department */}
 <div className="flex items-center gap-2">
 <TaskPrioritySelect
 taskId={task.id}
 currentPriority={task.priority as TaskPriority}
 onUpdate={handleTaskUpdate}
 />
 <Badge
 variant="outline"
 className={`text-xs department-${task.department}`}
 >
 {task.department}
 </Badge>
 </div>

 {/* Assigned Users */}
 {assignedUsers.length > 0 && (
 <div className="flex items-center gap-2">
 <Users className="h-3 w-3" />
 <div className="flex -space-x-1">
 {assignedUsers.slice(0, 3).map((userId) => {
 const user = users[userId as keyof typeof users] || { name: "Unknown", initials: "?", avatar: null };
 return (
 <Avatar key={userId} className="h-5 w-5">
 <AvatarImage src={user.avatar || ""} />
 <AvatarFallback className="text-xs">
 {user.initials}
 </AvatarFallback>
 </Avatar>
 );
 })}
 {assignedUsers.length > 3 && (
 <div className="h-5 w-5 rounded-full flex items-center justify-center text-xs">
 +{assignedUsers.length - 3}
 </div>
 )}
 </div>
 </div>
 )}

 {/* Due Date */}
 {task.due_date && (
 <div className="flex items-center gap-1 text-xs">
 <Calendar className="h-3 w-3" />
 <span>
 {formatDistanceToNow(new Date(task.due_date), { addSuffix: true })}
 </span>
 </div>
 )}

 {/* Tags */}
 {task.tags && task.tags.length > 0 && (
 <div className="flex gap-1 flex-wrap">
 {task.tags.slice(0, 2).map((tag, index) => (
 <Badge key={index} variant="outline" className="text-xs">
 {tag}
 </Badge>
 ))}
 {task.tags.length > 2 && (
 <Badge variant="outline" className="text-xs">
 +{task.tags.length - 2}
 </Badge>
 )}
 </div>
 )}
 </div>
 </div>
 );
 })}

 {/* Drop Zone */}
 <div
 className="border-2 border-dashed rounded-lg p-4 text-center text-sm opacity-0 transition-opacity hover:opacity-100"
 onDragOver={(e) => {
 e.preventDefault();
 e.currentTarget.classList.add('opacity-100', 'border-info');
 }}
 onDragLeave={(e) => {
 e.preventDefault();
 e.currentTarget.classList.remove('opacity-100', 'border-info');
 }}
 onDrop={(e) => {
 e.preventDefault();
 e.currentTarget.classList.remove('opacity-100', 'border-info');

 const taskId = e.dataTransfer.getData('taskId');
 const currentStatus = e.dataTransfer.getData('currentStatus');

 if (taskId && currentStatus !== status) {
 handleStatusChange(taskId, status as TaskStatus);
 }
 }}
 >
 Drop tasks here
 </div>
 </div>
 </CardContent>
 </Card>
 );
 })}
 </div>

 {/* Stats Footer */}
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
 {Object.entries(tasksByStatus).map(([status, tasks]) => {
 const config = statusConfig[status as TaskStatus];
 return (
 <div key={status} className="stat-card p-3 text-center">
 <div className={`text-lg font-bold ${config.textColor}`}>
 {tasks.length}
 </div>
 <div className="text-sm">
 {config.title}
 </div>
 </div>
 );
 })}
 </div>
 </div>
 );
}
