"use client";

import React, { use, useState, useEffect } from "react";
import { useRouter} from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { EntityDetailHeader } from "@/components/common/EntityDetailHeader";
// Unused: import { InfoCard } from "@/components/common/InfoCard";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingState } from "@/components/common/LoadingState";
import { EditableField, EditableFieldGroup } from "@/components/common/EditableField";
import TaskAttachments from "@/components/TaskAttachments";
import TaskActivities from "@/components/TaskActivities";
import TaskEntityLinks from "@/components/TaskEntityLinks";
import TaskTimeTracking from "@/components/TaskTimeTracking";
import TaskDependencies from "@/components/TaskDependencies";
import TaskAssignedUsers from "@/components/TaskAssignedUsers";
import {
  CheckSquare,
  ArrowLeft,
  Edit,
  Clock,
  CheckCircle2,
  AlertCircle,
  Paperclip,
  Activity,
  Link,
  Timer,
  GitBranch,
  Users,
  Calendar,
  FolderOpen,
  AlertTriangle,
  Briefcase,
  X,
  Check,
  Target,
} from "lucide-react";
import { format, formatDistanceToNow, isAfter, parseISO } from "date-fns";
import { toast } from "sonner";

// Dynamic route configuration
export const dynamic = 'force-dynamic';

type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled';
type TaskPriority = 'low' | 'medium' | 'high';
type TaskDepartment = 'admin' | 'production' | 'design' | 'sales';

// Helper function to safely parse dates
const safeDateFormat = (date: string | Date | null | undefined): string => {
  if (!date) return '';
  try {
    const dateObj = date instanceof Date ? date : parseISO(date);
    return dateObj.toISOString().split('T')[0];
  } catch (error) {
    console.error('Error parsing date:', date, error);
    return '';
  }
};

const STATUS_CONFIG: Record<TaskStatus, { label: string; className: string; icon: React.ReactNode }> = {
  todo: {
    label: 'To Do',
    className: 'status-todo',
    icon: <AlertCircle className="icon-xs" aria-hidden="true" />
  },
  in_progress: {
    label: 'In Progress',
    className: 'status-in-progress',
    icon: <Clock className="icon-xs" aria-hidden="true" />
  },
  completed: {
    label: 'Completed',
    className: 'status-completed',
    icon: <CheckCircle2 className="icon-xs" aria-hidden="true" />
  },
  cancelled: {
    label: 'Cancelled',
    className: 'status-cancelled',
    icon: <AlertCircle className="icon-xs" aria-hidden="true" />
  },
};

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; className: string }> = {
  low: { label: 'Low', className: 'priority-low' },
  medium: { label: 'Medium', className: 'priority-medium' },
  high: { label: 'High', className: 'priority-high' },
};

const DEPARTMENT_CONFIG: Record<TaskDepartment, { label: string; className: string }> = {
  admin: { label: 'Admin', className: 'department-admin' },
  production: { label: 'Production', className: 'department-production' },
  design: { label: 'Design', className: 'department-design' },
  sales: { label: 'Sales', className: 'department-sales' },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TaskDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);

  const { data: task, isLoading, error } = api.tasks.getFullDetails.useQuery(
    { id: id },
    { enabled: !!user && !!id }
  );

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  // Form data state for in-place editing
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: '',
    priority: '',
    department: '',
    task_type: '',
    due_date: '',
    start_date: '',
    estimated_hours: '',
    visibility: '',
    resolution: '',
  });

  // Sync form data with fetched task data
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || '',
        priority: task.priority || '',
        department: task.department || '',
        task_type: task.task_type || '',
        due_date: safeDateFormat(task.due_date),
        start_date: safeDateFormat(task.start_date),
        estimated_hours: task.estimated_hours?.toString() || '',
        visibility: task.visibility || '',
        resolution: task.resolution || '',
      });
    }
  }, [task]);

  // Update mutation with automatic cache invalidation
  const updateMutation = api.tasks.update.useMutation({
    onSuccess: () => {
      toast.success("Task updated successfully");
      setIsEditing(false);
      // Invalidate all task-related queries for instant UI updates
      utils.tasks.getAllTasks.invalidate();
      utils.tasks.getMyTasks.invalidate();
      utils.tasks.getFullDetails.invalidate();
      utils.tasks.getById.invalidate();
    },
    onError: (error: any) => {
      toast.error("Failed to update task: " + error.message);
    },
  });

  const handleSave = async () => {
    if (!formData.title) {
      toast.error("Title is required");
      return;
    }

    await updateMutation.mutateAsync({
      id,
      title: formData.title,
      description: formData.description || undefined,
      status: formData.status as TaskStatus,
      priority: formData.priority as TaskPriority,
      department: formData.department as TaskDepartment,
      task_type: formData.task_type || undefined,
      due_date: formData.due_date || undefined,
      start_date: formData.start_date || undefined,
      estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : undefined,
      visibility: (formData.visibility as 'project' | 'company' | 'private' | undefined) || undefined,
      resolution: formData.resolution || undefined,
    });
  };

  const handleCancel = () => {
    // Reset form data to original values
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || '',
        priority: task.priority || '',
        department: task.department || '',
        task_type: task.task_type || '',
        due_date: safeDateFormat(task.due_date),
        start_date: safeDateFormat(task.start_date),
        estimated_hours: task.estimated_hours?.toString() || '',
        visibility: task.visibility || '',
        resolution: task.resolution || '',
      });
    }
    setIsEditing(false);
  };

  const handleTaskUpdate = () => {
    // Invalidate cache instead of manual refetch
    utils.tasks.getFullDetails.invalidate();
    utils.tasks.getById.invalidate();
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <LoadingState message="Loading task details..." size="md" />
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="page-container">
        <EmptyState
          icon={AlertCircle}
          title="Task Not Found"
          description="The task you're looking for doesn't exist or you don't have permission to view it."
          action={{
            label: 'Back to Tasks',
            onClick: () => router.push("/tasks"),
            icon: ArrowLeft,
          }}
        />
      </div>
    );
  }

  const _statusConfig = STATUS_CONFIG[task.status as TaskStatus];
  const priorityConfig = PRIORITY_CONFIG[task.priority as TaskPriority];
  const departmentConfig = DEPARTMENT_CONFIG[task.department as TaskDepartment];

  const isOverdue = task.due_date && isAfter(new Date(), task.due_date instanceof Date ? task.due_date : parseISO(task.due_date));

  return (
    <div className="page-container">
      {/* Header Section */}
      <div className="page-header">
        <Button
          onClick={() => router.push("/tasks")}
          variant="ghost"
          className="btn-secondary"
        >
          <ArrowLeft className="icon-sm" aria-hidden="true" />
          Back
        </Button>
      </div>

      {/* Task Header */}
      <EntityDetailHeader
        icon={CheckSquare}
        title={formData.title || "Untitled Task"}
        subtitle={formData.description || undefined}
        metadata={[
          ...(formData.due_date ? [{
            icon: Calendar,
            value: format(new Date(formData.due_date), "MMM d, yyyy"),
            label: 'Due Date',
          }] : []),
          { icon: Briefcase, value: departmentConfig.label, label: 'Department' },
          ...(task.project_id ? [{ icon: FolderOpen, value: 'Project Name', label: 'Project' }] : []),
        ]}
        status={formData.status || 'todo'}
        tags={task.tags || []}
        actions={
          isEditing
            ? [
                {
                  label: 'Cancel',
                  icon: X,
                  variant: 'outline' as const,
                  onClick: handleCancel,
                },
                {
                  label: updateMutation.isPending ? 'Saving...' : 'Save Changes',
                  icon: Check,
                  onClick: handleSave,
                  disabled: updateMutation.isPending,
                },
              ]
            : [
                {
                  label: 'Edit Task',
                  icon: Edit,
                  onClick: () => setIsEditing(true),
                },
              ]
        }
      />

      {/* Priority and Status Badges */}
      <div className="mb-6 flex gap-2">
        <Badge variant="outline" className={priorityConfig.className}>
          {priorityConfig.label}
        </Badge>
        {isOverdue && task.status !== 'completed' && task.status !== 'cancelled' && (
          <Badge variant="outline" className="badge-error">
            <AlertTriangle className="icon-xs" aria-hidden="true" />
            Overdue
          </Badge>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Attachments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{task.task_attachments?.length || 0}</div>
            <p className="stat-label">
              <Paperclip className="icon-xs inline" aria-hidden="true" /> files attached
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{task.task_activities?.length || 0}</div>
            <p className="stat-label">
              <Activity className="icon-xs inline" aria-hidden="true" /> recent activities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Entity Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{task.task_entity_links?.length || 0}</div>
            <p className="stat-label">
              <Link className="icon-xs inline" aria-hidden="true" /> related items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Assigned To</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{task.assigned_to?.length || 0}</div>
            <p className="stat-label">
              <Users className="icon-xs inline" aria-hidden="true" /> team members
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="tabs-list">
          <TabsTrigger value="overview" className="tabs-trigger">
            <Activity className="icon-sm" aria-hidden="true" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="attachments" className="tabs-trigger">
            <Paperclip className="icon-sm" aria-hidden="true" />
            Attachments ({task.task_attachments?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="activities" className="tabs-trigger">
            <Activity className="icon-sm" aria-hidden="true" />
            Activities ({task.task_activities?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="links" className="tabs-trigger">
            <Link className="icon-sm" aria-hidden="true" />
            Links ({task.task_entity_links?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="details" className="tabs-trigger">
            <CheckSquare className="icon-sm" aria-hidden="true" />
            Details
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Task Details */}
            <EditableFieldGroup title="Task Information" isEditing={isEditing} columns={1}>
              <EditableField
                label="Title"
                value={formData.title}
                isEditing={isEditing}
                onChange={(value) => setFormData({ ...formData, title: value })}
                required
                icon={CheckSquare}
              />

              <EditableField
                label="Description"
                value={formData.description}
                type="textarea"
                isEditing={isEditing}
                onChange={(value) => setFormData({ ...formData, description: value })}
              />

              <EditableField
                label="Status"
                value={formData.status}
                type="select"
                isEditing={isEditing}
                onChange={(value) => setFormData({ ...formData, status: value })}
                options={[
                  { value: 'todo', label: 'To Do' },
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'cancelled', label: 'Cancelled' },
                ]}
              />

              <EditableField
                label="Priority"
                value={formData.priority}
                type="select"
                isEditing={isEditing}
                onChange={(value) => setFormData({ ...formData, priority: value })}
                options={[
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' },
                ]}
                icon={Target}
              />

              <EditableField
                label="Department"
                value={formData.department}
                type="select"
                isEditing={isEditing}
                onChange={(value) => setFormData({ ...formData, department: value })}
                options={[
                  { value: 'admin', label: 'Admin' },
                  { value: 'production', label: 'Production' },
                  { value: 'design', label: 'Design' },
                  { value: 'sales', label: 'Sales' },
                ]}
                icon={Briefcase}
              />

              <EditableField
                label="Type"
                value={formData.task_type}
                isEditing={isEditing}
                onChange={(value) => setFormData({ ...formData, task_type: value })}
              />

              <EditableField
                label="Due Date"
                value={formData.due_date}
                type="date"
                isEditing={isEditing}
                onChange={(value) => setFormData({ ...formData, due_date: value })}
                icon={Calendar}
              />

              <EditableField
                label="Start Date"
                value={formData.start_date}
                type="date"
                isEditing={isEditing}
                onChange={(value) => setFormData({ ...formData, start_date: value })}
                icon={Calendar}
              />

              <EditableField
                label="Estimated Hours"
                value={formData.estimated_hours}
                type="number"
                isEditing={isEditing}
                onChange={(value) => setFormData({ ...formData, estimated_hours: value })}
                icon={Clock}
              />

              <EditableField
                label="Visibility"
                value={formData.visibility}
                type="select"
                isEditing={isEditing}
                onChange={(value) => setFormData({ ...formData, visibility: value })}
                options={[
                  { value: 'public', label: 'Public' },
                  { value: 'private', label: 'Private' },
                  { value: 'company', label: 'Company' },
                ]}
              />

              <EditableField
                label="Created"
                value={task.created_at ? format(new Date(task.created_at), "MMM d, yyyy h:mm a") : "—"}
                isEditing={false}
              />

              <EditableField
                label="Last Activity"
                value={task.last_activity_at ? formatDistanceToNow(new Date(task.last_activity_at), { addSuffix: true }) : "—"}
                isEditing={false}
                icon={Activity}
              />
            </EditableFieldGroup>

            {/* Project Info */}
            <Card>
              <CardHeader>
                <CardTitle>Project & Assignment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FolderOpen className="icon-sm" aria-hidden="true" />
                      <span className="text-sm font-medium">Project</span>
                    </div>
                    <p className="text-muted">
                      {task.project_id ? "Project Name" : "No project assigned"}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="icon-sm" aria-hidden="true" />
                      <span className="text-sm font-medium">Assigned Users</span>
                    </div>
                    <TaskAssignedUsers
                      taskId={task.id}
                      assignedUsers={task.assigned_to || []}
                      onUpdate={handleTaskUpdate}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Time Tracking */}
            <Card>
              <CardHeader>
                <CardTitle>Time Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <TaskTimeTracking
                  taskId={task.id}
                  onUpdate={handleTaskUpdate}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Attachments Tab */}
        <TabsContent value="attachments">
          <Card>
            <CardHeader>
              <CardTitle>Task Attachments</CardTitle>
            </CardHeader>
            <CardContent>
              <TaskAttachments
                taskId={task.id}
                onUpdate={handleTaskUpdate}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activities Tab */}
        <TabsContent value="activities">
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <TaskActivities
                taskId={task.id}
                onUpdate={handleTaskUpdate}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Links Tab */}
        <TabsContent value="links">
          <Card>
            <CardHeader>
              <CardTitle>Entity Links</CardTitle>
            </CardHeader>
            <CardContent>
              <TaskEntityLinks
                taskId={task.id}
                onUpdate={handleTaskUpdate}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Time Tracking */}
            <Card>
              <CardHeader>
                <CardTitle>
                  <Timer className="icon-sm inline" aria-hidden="true" /> Time Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TaskTimeTracking
                  taskId={task.id}
                  onUpdate={handleTaskUpdate}
                />
              </CardContent>
            </Card>

            {/* Dependencies */}
            <Card>
              <CardHeader>
                <CardTitle>
                  <GitBranch className="icon-sm inline" aria-hidden="true" /> Dependencies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TaskDependencies
                  taskId={task.id}
                  onUpdate={handleTaskUpdate}
                />
              </CardContent>
            </Card>

            {/* Additional Details */}
            <EditableFieldGroup title="Additional Information" isEditing={isEditing} columns={1}>
              <EditableField
                label="Resolution"
                value={formData.resolution}
                type="textarea"
                isEditing={isEditing}
                onChange={(value) => setFormData({ ...formData, resolution: value })}
              />

              <EditableField
                label="Actual Hours"
                value={task.actual_hours ? `${task.actual_hours}h` : "—"}
                isEditing={false}
                icon={Clock}
              />

              {task.archived_at && (
                <EditableField
                  label="Archived"
                  value={format(new Date(task.archived_at), "MMM d, yyyy h:mm a")}
                  isEditing={false}
                />
              )}
            </EditableFieldGroup>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
