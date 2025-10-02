"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
 DialogDescription,
 DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
 Filter,
 Search,
 X,
 Calendar,
 Users,
 Tag,
 Building2,
 AlertTriangle,
 Clock,
 CheckCircle2,
} from "lucide-react";

type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled';
type TaskPriority = 'low' | 'medium' | 'high';
type TaskDepartment = 'admin' | 'production' | 'design' | 'sales';

interface FilterState {
 search: string;
 status: TaskStatus[] | 'all';
 priority: TaskPriority[] | 'all';
 department: TaskDepartment[] | 'all';
 assignedTo: string[];
 tags: string[];
 dueDateRange: 'overdue' | 'today' | 'this_week' | 'next_week' | 'no_date' | 'all';
 createdByMe: boolean;
 assignedToMe: boolean;
 hasAttachments: boolean;
 hasComments: boolean;
}

interface TaskAdvancedFiltersProps {
 onFiltersChange: (_filters: FilterState) => void;
 taskCount?: number;
}

export default function TaskAdvancedFilters({ onFiltersChange, taskCount = 0 }: TaskAdvancedFiltersProps) {
 const [isOpen, setIsOpen] = useState(false);
 const [filters, setFilters] = useState<FilterState>({
 search: "",
 status: 'all',
 priority: 'all',
 department: 'all',
 assignedTo: [],
 tags: [],
 dueDateRange: 'all',
 createdByMe: false,
 assignedToMe: false,
 hasAttachments: false,
 hasComments: false,
 });

 const [activeFiltersCount, setActiveFiltersCount] = useState(0);

 const updateFilter = <K extends keyof FilterState>(
 key: K,
 value: FilterState[K]
 ) => {
 const newFilters = { ...filters, [key]: value };
 setFilters(newFilters);
 onFiltersChange(newFilters);

 // Count active filters
 let count = 0;
 if (newFilters.search) count++;
 if (newFilters.status !== 'all' && Array.isArray(newFilters.status) && newFilters.status.length > 0) count++;
 if (newFilters.priority !== 'all' && Array.isArray(newFilters.priority) && newFilters.priority.length > 0) count++;
 if (newFilters.department !== 'all' && Array.isArray(newFilters.department) && newFilters.department.length > 0) count++;
 if (newFilters.assignedTo.length > 0) count++;
 if (newFilters.tags.length > 0) count++;
 if (newFilters.dueDateRange !== 'all') count++;
 if (newFilters.createdByMe) count++;
 if (newFilters.assignedToMe) count++;
 if (newFilters.hasAttachments) count++;
 if (newFilters.hasComments) count++;

 setActiveFiltersCount(count);
 };

 const clearAllFilters = () => {
 const clearedFilters: FilterState = {
 search: "",
 status: 'all',
 priority: 'all',
 department: 'all',
 assignedTo: [],
 tags: [],
 dueDateRange: 'all',
 createdByMe: false,
 assignedToMe: false,
 hasAttachments: false,
 hasComments: false,
 };
 setFilters(clearedFilters);
 onFiltersChange(clearedFilters);
 setActiveFiltersCount(0);
 };

 const toggleArrayFilter = <T extends string>(
 key: 'assignedTo' | 'tags',
 value: T
 ) => {
 const currentArray = Object.prototype.hasOwnProperty.call(filters, key) ? filters[key as keyof typeof filters] as T[] : [];
 const newArray = currentArray.includes(value)
 ? currentArray.filter(item => item !== value)
 : [...currentArray, value];
 updateFilter(key, newArray);
 };

 const toggleMultiSelect = (
 key: 'status' | 'priority' | 'department',
 value: TaskStatus | TaskPriority | TaskDepartment
 ) => {
 const current = Object.prototype.hasOwnProperty.call(filters, key) ? filters[key as keyof typeof filters] : 'all';
 if (current === 'all') {
 updateFilter(key, [value] as any);
 } else if (Array.isArray(current)) {
 const newArray = current.includes(value as never)
 ? current.filter(item => item !== value)
 : [...current, value as never];
 updateFilter(key, newArray.length === 0 ? 'all' : newArray as any);
 }
 };

 // Real data from APIs
 const { user: _user } = useAuth();
 const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
 const [tags, setTags] = useState<string[]>([]);
 const [loadingUsers, setLoadingUsers] = useState(true);
 const [loadingTags, setLoadingTags] = useState(true);

 // Fetch users and tags on component mount
 useEffect(() => {
 const fetchUsers = async () => {
 try {
 // TODO: Implement proper tRPC client call
 console.log('TODO: Load users data via tRPC');
 setUsers([]);
 } catch (error) {
 console.error('Failed to fetch users:', error);
 } finally {
 setLoadingUsers(false);
 }
 };

 const fetchTags = async () => {
 try {
 // TODO: Implement proper tRPC client call
 console.log('TODO: Load tags data via tRPC');
 setTags([]);
 } catch (error) {
 console.error('Failed to fetch tags:', error);
 } finally {
 setLoadingTags(false);
 }
 };

 fetchUsers();
 fetchTags();
 }, []);

 return (
 <div className="space-y-4">
 {/* Quick Search and Filter Button */}
 <div className="flex gap-4">
 <div className="flex-1 relative">
 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-tertiary h-4 w-4" />
 <Input
 placeholder="Search tasks..."
 value={filters.search}
 onChange={(e) => updateFilter('search', e.target.value)}
 className="pl-10"
 />
 </div>

 <Dialog open={isOpen} onOpenChange={setIsOpen}>
 <DialogTrigger asChild>
 <Button variant="outline" className="flex items-center gap-2">
 <Filter className="h-4 w-4" />
 Advanced Filters
 {activeFiltersCount > 0 && (
 <Badge variant="default" className="ml-1">
 {activeFiltersCount}
 </Badge>
 )}
 </Button>
 </DialogTrigger>

 <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
 <DialogHeader>
 <DialogTitle>Advanced Task Filters</DialogTitle>
 <DialogDescription>
 Filter tasks by status, priority, department, assignments, and more criteria.
 </DialogDescription>
 </DialogHeader>

 <div className="space-y-6">
 {/* Status, Priority, Department */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 {/* Status */}
 <div className="space-y-3">
 <h3 className="text-sm font-medium text-tertiary flex items-center gap-2">
 <CheckCircle2 className="h-4 w-4" />
 Status
 </h3>
 <div className="space-y-2">
 {[
 { value: 'todo' as TaskStatus, label: 'To Do', icon: AlertTriangle },
 { value: 'in_progress' as TaskStatus, label: 'In Progress', icon: Clock },
 { value: 'completed' as TaskStatus, label: 'Completed', icon: CheckCircle2 },
 { value: 'cancelled' as TaskStatus, label: 'Cancelled', icon: X },
 ].map(({ value, label, icon: Icon }) => (
 <label key={value} className="flex items-center gap-2 cursor-pointer">
 <input
 type="checkbox"
 checked={Array.isArray(filters.status) && filters.status.includes(value)}
 onChange={() => toggleMultiSelect('status', value)}
 className="rounded"
 />
 <Icon className={`h-4 w-4 status-${value}`} />
 <span className="text-sm">{label}</span>
 </label>
 ))}
 </div>
 </div>

 {/* Priority */}
 <div className="space-y-3">
 <h3 className="text-sm font-medium text-tertiary flex items-center gap-2">
 <AlertTriangle className="h-4 w-4" />
 Priority
 </h3>
 <div className="space-y-2">
 {[
 { value: 'high' as TaskPriority, label: 'High' },
 { value: 'medium' as TaskPriority, label: 'Medium' },
 { value: 'low' as TaskPriority, label: 'Low' },
 ].map(({ value, label }) => (
 <label key={value} className="flex items-center gap-2 cursor-pointer">
 <input
 type="checkbox"
 checked={Array.isArray(filters.priority) && filters.priority.includes(value)}
 onChange={() => toggleMultiSelect('priority', value)}
 className="rounded"
 />
 <Badge variant="outline" className={`priority-${value} text-xs`}>
 {label}
 </Badge>
 </label>
 ))}
 </div>
 </div>

 {/* Department */}
 <div className="space-y-3">
 <h3 className="text-sm font-medium text-tertiary flex items-center gap-2">
 <Building2 className="h-4 w-4" />
 Department
 </h3>
 <div className="space-y-2">
 {[
 { value: 'admin' as TaskDepartment, label: 'Admin' },
 { value: 'production' as TaskDepartment, label: 'Production' },
 { value: 'design' as TaskDepartment, label: 'Design' },
 { value: 'sales' as TaskDepartment, label: 'Sales' },
 ].map(({ value, label }) => (
 <label key={value} className="flex items-center gap-2 cursor-pointer">
 <input
 type="checkbox"
 checked={Array.isArray(filters.department) && filters.department.includes(value)}
 onChange={() => toggleMultiSelect('department', value)}
 className="rounded"
 />
 <Badge variant="outline" className={`department-${value} text-xs`}>
 {label}
 </Badge>
 </label>
 ))}
 </div>
 </div>
 </div>

 <Separator />

 {/* Assignment and People */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {/* Assigned To */}
 <div className="space-y-3">
 <h3 className="text-sm font-medium text-tertiary flex items-center gap-2">
 <Users className="h-4 w-4" />
 Assigned To
 </h3>
 <div className="space-y-2">
 {loadingUsers ? (
 <div className="text-sm text-tertiary">Loading users...</div>
 ) : users.length === 0 ? (
 <div className="text-sm text-tertiary">No users available</div>
 ) : (
 users.map((user) => (
 <label key={user.id} className="flex items-center gap-2 cursor-pointer">
 <input
 type="checkbox"
 checked={filters.assignedTo.includes(user.id)}
 onChange={() => toggleArrayFilter('assignedTo', user.id)}
 className="rounded"
 />
 <span className="text-sm">{user.name}</span>
 </label>
 ))
 )}
 </div>
 </div>

 {/* Personal Filters */}
 <div className="space-y-3">
 <h3 className="text-sm font-medium text-tertiary">Personal</h3>
 <div className="space-y-2">
 <label className="flex items-center gap-2 cursor-pointer">
 <input
 type="checkbox"
 checked={filters.createdByMe}
 onChange={(e) => updateFilter('createdByMe', e.target.checked)}
 className="rounded"
 />
 <span className="text-sm">Created by me</span>
 </label>
 <label className="flex items-center gap-2 cursor-pointer">
 <input
 type="checkbox"
 checked={filters.assignedToMe}
 onChange={(e) => updateFilter('assignedToMe', e.target.checked)}
 className="rounded"
 />
 <span className="text-sm">Assigned to me</span>
 </label>
 </div>
 </div>
 </div>

 <Separator />

 {/* Due Date and Content */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {/* Due Date */}
 <div className="space-y-3">
 <h3 className="text-sm font-medium text-tertiary flex items-center gap-2">
 <Calendar className="h-4 w-4" />
 Due Date
 </h3>
 <Select
 value={filters.dueDateRange}
 onValueChange={(value) => updateFilter('dueDateRange', value as any)}
 >
 <SelectTrigger>
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">All dates</SelectItem>
 <SelectItem value="overdue">Overdue</SelectItem>
 <SelectItem value="today">Due today</SelectItem>
 <SelectItem value="this_week">Due this week</SelectItem>
 <SelectItem value="next_week">Due next week</SelectItem>
 <SelectItem value="no_date">No due date</SelectItem>
 </SelectContent>
 </Select>
 </div>

 {/* Content Filters */}
 <div className="space-y-3">
 <h3 className="text-sm font-medium text-tertiary">Content</h3>
 <div className="space-y-2">
 <label className="flex items-center gap-2 cursor-pointer">
 <input
 type="checkbox"
 checked={filters.hasAttachments}
 onChange={(e) => updateFilter('hasAttachments', e.target.checked)}
 className="rounded"
 />
 <span className="text-sm">Has attachments</span>
 </label>
 <label className="flex items-center gap-2 cursor-pointer">
 <input
 type="checkbox"
 checked={filters.hasComments}
 onChange={(e) => updateFilter('hasComments', e.target.checked)}
 className="rounded"
 />
 <span className="text-sm">Has comments</span>
 </label>
 </div>
 </div>
 </div>

 <Separator />

 {/* Tags */}
 <div className="space-y-3">
 <h3 className="text-sm font-medium text-tertiary flex items-center gap-2">
 <Tag className="h-4 w-4" />
 Tags
 </h3>
 <div className="flex flex-wrap gap-2">
 {loadingTags ? (
 <div className="text-sm text-tertiary">Loading tags...</div>
 ) : tags.length === 0 ? (
 <div className="text-sm text-tertiary">No tags available</div>
 ) : (
 tags.map((tag) => (
 <Badge
 key={tag}
 variant={filters.tags.includes(tag) ? "default" : "outline"}
 className="cursor-pointer"
 onClick={() => toggleArrayFilter('tags', tag)}
 >
 {tag}
 </Badge>
 ))
 )}
 </div>
 </div>

 {/* Actions */}
 <div className="flex justify-between pt-4">
 <Button variant="outline" onClick={clearAllFilters}>
 Clear All Filters
 </Button>
 <div className="flex items-center gap-3">
 <span className="text-sm text-tertiary">
 {taskCount} tasks found
 </span>
 <Button onClick={() => setIsOpen(false)}>
 Apply Filters
 </Button>
 </div>
 </div>
 </div>
 </DialogContent>
 </Dialog>
 </div>

 {/* Active Filters Display */}
 {activeFiltersCount > 0 && (
 <Card className="card/50 border">
 <CardContent className="py-3">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2 flex-wrap">
 <span className="text-sm text-tertiary">Active filters:</span>

 {filters.search && (
 <Badge variant="secondary" className="flex items-center gap-1">
 Search: &quot;{filters.search}&quot;
 <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilter('search', '')} />
 </Badge>
 )}

 {Array.isArray(filters.status) && filters.status.length > 0 && (
 <Badge variant="secondary" className="flex items-center gap-1">
 Status: {filters.status.join(', ')}
 <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilter('status', 'all')} />
 </Badge>
 )}

 {Array.isArray(filters.priority) && filters.priority.length > 0 && (
 <Badge variant="secondary" className="flex items-center gap-1">
 Priority: {filters.priority.join(', ')}
 <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilter('priority', 'all')} />
 </Badge>
 )}

 {Array.isArray(filters.department) && filters.department.length > 0 && (
 <Badge variant="secondary" className="flex items-center gap-1">
 Dept: {filters.department.join(', ')}
 <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilter('department', 'all')} />
 </Badge>
 )}
 </div>

 <Button variant="ghost" size="sm" onClick={clearAllFilters}>
 <X className="h-4 w-4" />
 </Button>
 </div>
 </CardContent>
 </Card>
 )}
 </div>
 );
}