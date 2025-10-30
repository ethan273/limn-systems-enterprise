"use client";
import { log } from '@/lib/logger';

import { useState } from "react";
import { api } from "@/lib/api/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import {
 DialogContent,
 DialogHeader,
 DialogTitle,
 DialogDescription,
 DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskCreateFormProps {
 onSuccess?: () => void;
 onCancel?: () => void;
}

export default function TaskCreateForm({ onSuccess, onCancel }: TaskCreateFormProps) {
 // Get current user from tRPC (standardized auth pattern)
 const { data: currentUser } = api.userProfile.getCurrentUser.useQuery();
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [title, setTitle] = useState("");
 const [description, setDescription] = useState("");
 const [status, setStatus] = useState<"todo" | "in_progress" | "completed" | "cancelled">("todo");
 const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
 const [department, setDepartment] = useState<"admin" | "production" | "design" | "sales">("admin");
 const [assignedTo, setAssignedTo] = useState<string[]>([]);
 const [dueDate, setDueDate] = useState("");
 const [startDate, setStartDate] = useState("");
 const [estimatedHours, setEstimatedHours] = useState("");
 const [tags, setTags] = useState<string[]>([]);
 const [newTag, setNewTag] = useState("");
 const [visibility, setVisibility] = useState<"company" | "project" | "private">("company");

 // Get current user ID from auth (extract to variable for reuse)
 const currentUserId = (currentUser as any)?.id || "";

 // Load users data via tRPC
 const { data: usersData, isLoading: loadingUsers } = api.users.getAllUsers.useQuery({
 limit: 100,
 offset: 0,
 });

 // Transform users data for the form
 const availableUsers = usersData?.users?.map((user: any) => ({
 id: user.id,
 name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || 'Unknown User',
 email: user.email || '',
 department: user.department || 'admin',
 })) || [];

 const createTaskMutation = api.tasks.create.useMutation({
 onSuccess: () => {
 toast.success("Task created successfully");
 onSuccess?.();
 },
 onError: (error) => {
 log.error("Failed to create task:", { error });
 toast.error(`Failed to create task: ${error.message}`);
 },
 });

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!title.trim()) {
   return;
 }
 if (!currentUserId) {
   log.warn('Cannot submit task: user not loaded yet');
   return;
 }

 setIsSubmitting(true);

 try {
 await createTaskMutation.mutateAsync({
 title: title.trim(),
 description: description.trim() || undefined,
 status,
 priority,
 department,
 visibility,
 assigned_to: assignedTo,
 created_by: currentUserId,
 due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
 start_date: startDate ? new Date(startDate).toISOString() : undefined,
 estimated_hours: estimatedHours ? parseFloat(estimatedHours) : undefined,
 tags: tags.length > 0 ? tags : [],
 mentioned_users: [],
 watchers: [],
 depends_on: [],
 blocks: [],
 });
 } catch (error) {
 log.error("Error creating task:", { error });
 } finally {
 setIsSubmitting(false);
 }
 };

 const addTag = () => {
 if (newTag.trim() && !tags.includes(newTag.trim())) {
 setTags([...tags, newTag.trim()]);
 setNewTag("");
 }
 };

 const removeTag = (tagToRemove: string) => {
 setTags(tags.filter(tag => tag !== tagToRemove));
 };

 const handleKeyDown = (e: React.KeyboardEvent) => {
 if (e.key === "Enter" && !e.shiftKey) {
 e.preventDefault();
 addTag();
 }
 };

 const addAssignee = (userId: string) => {
 if (!assignedTo.includes(userId)) {
 setAssignedTo([...assignedTo, userId]);
 }
 };

 const removeAssignee = (userId: string) => {
 setAssignedTo(assignedTo.filter(id => id !== userId));
 };

 const _getAssignedUserName = (userId: string) => {
 const user = availableUsers.find(u => u.id === userId);
 return user ? user.name : "Unknown User";
 };

 return (
 <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
 <DialogHeader>
 <DialogTitle>Create New Task</DialogTitle>
 <DialogDescription>
 Fill out the form below to create a new task for your organization.
 </DialogDescription>
 </DialogHeader>

 <form onSubmit={handleSubmit} className="space-y-6">
 {/* Title */}
 <div className="space-y-2">
 <Label htmlFor="title" className="text-sm font-medium text-tertiary">
 Title *
 </Label>
 <Input
 id="title"
 value={title}
 onChange={(e) => setTitle(e.target.value)}
 placeholder="Enter task title"
 required
 className="w-full"
 />
 </div>

 {/* Description */}
 <div className="space-y-2">
 <Label htmlFor="description" className="text-sm font-medium text-tertiary">
 Description
 </Label>
 <Textarea
 id="description"
 value={description}
 onChange={(e) => setDescription(e.target.value)}
 placeholder="Enter task description (optional)"
 rows={3}
 className="w-full resize-none"
 />
 </div>

 {/* Row 1: Status, Priority, Department */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <div className="space-y-2">
 <Label className="text-sm font-medium text-tertiary">Status</Label>
 <Select value={status} onValueChange={(value: "todo" | "in_progress" | "completed" | "cancelled") => setStatus(value)}>
 <SelectTrigger>
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="todo">Todo</SelectItem>
 <SelectItem value="in_progress">In Progress</SelectItem>
 <SelectItem value="completed">Completed</SelectItem>
 <SelectItem value="cancelled">Cancelled</SelectItem>
 </SelectContent>
 </Select>
 </div>

 <div className="space-y-2">
 <Label className="text-sm font-medium text-tertiary">Priority</Label>
 <Select value={priority} onValueChange={(value: "low" | "medium" | "high") => setPriority(value)}>
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

 <div className="space-y-2">
 <Label className="text-sm font-medium text-tertiary">Department</Label>
 <Select value={department} onValueChange={(value: "admin" | "production" | "design" | "sales") => setDepartment(value)}>
 <SelectTrigger>
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="admin">Admin</SelectItem>
 <SelectItem value="production">Production</SelectItem>
 <SelectItem value="design">Design</SelectItem>
 <SelectItem value="sales">Sales</SelectItem>
 </SelectContent>
 </Select>
 </div>
 </div>

 {/* Row 2: Dates and Hours */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <div className="space-y-2">
 <Label htmlFor="startDate" className="text-sm font-medium text-tertiary">
 Start Date
 </Label>
 <Input
 id="startDate"
 type="date"
 value={startDate}
 onChange={(e) => setStartDate(e.target.value)}
 />
 </div>

 <div className="space-y-2">
 <Label htmlFor="dueDate" className="text-sm font-medium text-tertiary">
 Due Date
 </Label>
 <Input
 id="dueDate"
 type="date"
 value={dueDate}
 onChange={(e) => setDueDate(e.target.value)}
 />
 </div>

 <div className="space-y-2">
 <Label htmlFor="estimatedHours" className="text-sm font-medium text-tertiary">
 Estimated Hours
 </Label>
 <Input
 id="estimatedHours"
 type="number"
 step="0.5"
 min="0"
 value={estimatedHours}
 onChange={(e) => setEstimatedHours(e.target.value)}
 placeholder="0"
 />
 </div>
 </div>

 {/* Visibility */}
 <div className="space-y-2">
 <Label className="text-sm font-medium text-tertiary">Visibility</Label>
 <Select value={visibility} onValueChange={(value: "company" | "project" | "private") => setVisibility(value)}>
 <SelectTrigger>
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="company">Company Wide</SelectItem>
 <SelectItem value="project">Project Team Only</SelectItem>
 <SelectItem value="private">Private</SelectItem>
 </SelectContent>
 </Select>
 </div>

 {/* Assigned To */}
 <div className="space-y-2">
 <Label className="text-sm font-medium text-tertiary">
 Assigned To ({assignedTo.length} selected)
 </Label>
 <Select onValueChange={(value: string) => addAssignee(value)} disabled={loadingUsers}>
 <SelectTrigger>
 <SelectValue placeholder={loadingUsers ? "Loading users..." : "Select team members..."} />
 </SelectTrigger>
 <SelectContent>
 {availableUsers
 .filter(user => !assignedTo.includes(user.id))
 .map((user) => (
 <SelectItem key={user.id} value={user.id}>
 <div className="flex items-center gap-2">
 <div className="w-6 h-6 bg-info rounded-full flex items-center justify-center text-xs font-medium text-foreground">
 {user.name.split(' ').map(n => n[0]).join('')}
 </div>
 <div className="flex flex-col">
 <span className="text-sm font-medium">{user.name}</span>
 <span className="text-xs text-secondary capitalize">{user.department}</span>
 </div>
 </div>
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 {assignedTo.length > 0 && (
 <div className="flex flex-wrap gap-2 mt-2">
 {assignedTo.map((userId) => {
 const user = availableUsers.find(u => u.id === userId);
 return (
 <Badge key={userId} variant="secondary" className="flex items-center gap-2 pr-2">
 <div className="w-4 h-4 bg-info rounded-full flex items-center justify-center text-xs font-medium text-foreground">
 {user ? user.name.split(' ').map(n => n[0]).join('') : '?'}
 </div>
 <span className="text-sm">{user ? user.name : 'Unknown'}</span>
 <button
 type="button"
 onClick={() => removeAssignee(userId)}
 className="hover:text-destructive transition-colors ml-1"
 >
 <X className="h-3 w-3" />
 </button>
 </Badge>
 );
 })}
 </div>
 )}
 </div>

 {/* Tags */}
 <div className="space-y-2">
 <Label className="text-sm font-medium text-tertiary">Tags</Label>
 <div className="flex gap-2">
 <Input
 value={newTag}
 onChange={(e) => setNewTag(e.target.value)}
 onKeyDown={handleKeyDown}
 placeholder="Add a tag..."
 className="flex-1"
 />
 <Button
 type="button"
 variant="outline"
 size="sm"
 onClick={addTag}
 disabled={!newTag.trim()}
 >
 <Plus className="h-4 w-4" />
 </Button>
 </div>
 {tags.length > 0 && (
 <div className="flex flex-wrap gap-2 mt-2">
 {tags.map((tag, index) => (
 <Badge key={index} variant="secondary" className="flex items-center gap-1">
 {tag}
 <button
 type="button"
 onClick={() => removeTag(tag)}
 className="hover:text-destructive transition-colors"
 >
 <X className="h-3 w-3" />
 </button>
 </Badge>
 ))}
 </div>
 )}
 </div>

 <DialogFooter>
 <Button
 type="button"
 variant="outline"
 onClick={onCancel}
 disabled={isSubmitting}
 >
 Cancel
 </Button>
 <Button
 type="submit"
 disabled={!title.trim() || isSubmitting}
 className={cn(
 "min-w-24",
 isSubmitting && "opacity-50 cursor-not-allowed"
 )}
 >
 {isSubmitting ? "Creating..." : "Create Task"}
 </Button>
 </DialogFooter>
 </form>
 </DialogContent>
 );
}