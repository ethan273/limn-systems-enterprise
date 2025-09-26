"use client";

import { useState } from "react";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogTrigger,
} from "@/components/ui/dialog";
import TaskCreateForm from "@/components/TaskCreateForm";
import TaskStatusSelect from "@/components/TaskStatusSelect";
import TaskPrioritySelect from "@/components/TaskPrioritySelect";
import TaskDepartmentSelect from "@/components/TaskDepartmentSelect";
import {
  Search,
  Filter,
  Plus,
  MoreVertical,
  Calendar,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled';
type TaskPriority = 'low' | 'medium' | 'high';
type TaskDepartment = 'admin' | 'production' | 'design' | 'sales';

export default function TasksPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<TaskDepartment | 'all'>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'due_date' | 'priority' | 'status'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const [limit] = useState(20);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: tasksData, isLoading, refetch } = api.tasks.getAllTasks.useQuery({
    limit,
    offset: page * limit,
    status: statusFilter === 'all' ? undefined : statusFilter,
    priority: priorityFilter === 'all' ? undefined : priorityFilter,
    department: departmentFilter === 'all' ? undefined : departmentFilter,
    search: search || undefined,
    sortBy,
    sortOrder,
  });

  const handleTaskUpdate = () => {
    refetch();
  };


  const clearFilters = () => {
    setSearch("");
    setStatusFilter('all');
    setPriorityFilter('all');
    setDepartmentFilter('all');
    setSortBy('created_at');
    setSortOrder('desc');
    setPage(0);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">All Tasks</h1>
          <p className="text-secondary">
            Manage and track all tasks across your organization
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

      {/* Filters and Search */}
      <Card className="bg-gray-800 border-gray-700 filters-section">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search tasks..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(value: TaskStatus | 'all') => setStatusFilter(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="todo">Todo</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {/* Priority Filter */}
            <Select value={priorityFilter} onValueChange={(value: TaskPriority | 'all') => setPriorityFilter(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>

            {/* Department Filter */}
            <Select value={departmentFilter} onValueChange={(value: TaskDepartment | 'all') => setDepartmentFilter(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="production">Production</SelectItem>
                <SelectItem value="design">Design</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>

          {/* Sort Options */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">Sort by:</span>
            <Select value={sortBy} onValueChange={(value: 'created_at' | 'due_date' | 'priority' | 'status') => setSortBy(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Created Date</SelectItem>
                <SelectItem value="due_date">Due Date</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Newest First</SelectItem>
                <SelectItem value="asc">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Table */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              Tasks ({tasksData?.total || 0})
            </span>
            {isLoading && (
              <div className="text-sm text-gray-400">Loading...</div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-gray-700">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300">Task</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Priority</TableHead>
                  <TableHead className="text-gray-300">Department</TableHead>
                  <TableHead className="text-gray-300">Created</TableHead>
                  <TableHead className="text-gray-300">Due Date</TableHead>
                  <TableHead className="text-gray-300 w-12">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasksData?.tasks?.map((task) => (
                  <TableRow key={task.id} className="table-row interactive-element min-h-16">
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-primary">{task.title}</div>
                        {task.description && (
                          <div className="text-sm text-secondary line-clamp-2">
                            {task.description}
                          </div>
                        )}
                        {task.tags && task.tags.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {task.tags.slice(0, 3).map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs text-tertiary border-gray-600">
                                {tag}
                              </Badge>
                            ))}
                            {task.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs text-tertiary border-gray-600">+{task.tags.length - 3} more</Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <TaskStatusSelect
                        taskId={task.id}
                        currentStatus={task.status as TaskStatus}
                        onUpdate={handleTaskUpdate}
                      />
                    </TableCell>
                    <TableCell>
                      <TaskPrioritySelect
                        taskId={task.id}
                        currentPriority={task.priority as TaskPriority}
                        onUpdate={handleTaskUpdate}
                      />
                    </TableCell>
                    <TableCell>
                      <TaskDepartmentSelect
                        taskId={task.id}
                        currentDepartment={task.department as TaskDepartment}
                        onUpdate={handleTaskUpdate}
                      />
                    </TableCell>
                    <TableCell className="text-muted">
                      {task.created_at
                        ? formatDistanceToNow(new Date(task.created_at), { addSuffix: true })
                        : 'Unknown'
                      }
                    </TableCell>
                    <TableCell className="text-muted">
                      {task.due_date ? (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span className="text-sm">
                            {formatDistanceToNow(new Date(task.due_date), { addSuffix: true })}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm">No due date</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="hover:bg-gray-700">
                            <MoreVertical className="h-4 w-4 text-secondary" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="text-sm">
                            Edit Task
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-sm">
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-sm text-red-400">
                            Delete Task
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {tasksData?.tasks?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-400">
                      No tasks found. Try adjusting your filters or create a new task.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {tasksData && tasksData.total > limit && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-400">
                Showing {page * limit + 1} to {Math.min((page + 1) * limit, tasksData.total)} of {tasksData.total} tasks
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={!tasksData.hasMore}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}