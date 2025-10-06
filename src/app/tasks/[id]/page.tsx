"use client";

import React, { use, useState } from "react";
import { useRouter} from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { EntityDetailHeader } from "@/components/common/EntityDetailHeader";
import { InfoCard } from "@/components/common/InfoCard";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingState } from "@/components/common/LoadingState";
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
} from "lucide-react";
import { format, formatDistanceToNow, isAfter, parseISO } from "date-fns";

// Dynamic route configuration
export const dynamic = 'force-dynamic';

type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled';
type TaskPriority = 'low' | 'medium' | 'high';
type TaskDepartment = 'admin' | 'production' | 'design' | 'sales';

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

  const { data: task, isLoading, error, refetch } = api.tasks.getFullDetails.useQuery(
    { id: id },
    { enabled: !!user && !!id }
  );

  const handleTaskUpdate = () => {
    refetch();
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

  const statusConfig = STATUS_CONFIG[task.status as TaskStatus];
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
        title={task.title || "Untitled Task"}
        subtitle={task.description || undefined}
        metadata={[
          ...(task.due_date ? [{
            icon: Calendar,
            value: format(task.due_date instanceof Date ? task.due_date : parseISO(task.due_date), "MMM d, yyyy"),
            label: 'Due Date',
          }] : []),
          { icon: Briefcase, value: departmentConfig.label, label: 'Department' },
          ...(task.project_id ? [{ icon: FolderOpen, value: 'Project Name', label: 'Project' }] : []),
        ]}
        status={task.status || 'todo'}
        tags={task.tags || []}
        actions={[
          {
            label: 'Edit Task',
            icon: Edit,
            onClick: () => router.push(`/tasks/${task.id}/edit`),
          },
        ]}
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
            <InfoCard
              title="Task Information"
              items={[
                {
                  label: 'Status',
                  value: (
                    <Badge variant="outline" className={statusConfig.className}>
                      {statusConfig.icon}
                      {statusConfig.label}
                    </Badge>
                  ),
                },
                {
                  label: 'Priority',
                  value: (
                    <Badge variant="outline" className={priorityConfig.className}>
                      {priorityConfig.label}
                    </Badge>
                  ),
                },
                {
                  label: 'Department',
                  value: (
                    <Badge variant="outline" className={departmentConfig.className}>
                      <Briefcase className="icon-xs" aria-hidden="true" />
                      {departmentConfig.label}
                    </Badge>
                  ),
                },
                { label: 'Type', value: task.task_type || "Task" },
                {
                  label: 'Created',
                  value: task.created_at
                    ? format(new Date(task.created_at), "MMM d, yyyy h:mm a")
                    : "—",
                },
                {
                  label: 'Due Date',
                  value: task.due_date ? (
                    <span className={isOverdue ? "text-destructive" : ""}>
                      <Calendar className="icon-xs inline" aria-hidden="true" />
                      {format(task.due_date instanceof Date ? task.due_date : parseISO(task.due_date), "MMM d, yyyy")}
                      {isOverdue && task.status !== 'completed' && task.status !== 'cancelled' && " (Overdue)"}
                    </span>
                  ) : "—",
                },
                {
                  label: 'Last Activity',
                  value: task.last_activity_at
                    ? formatDistanceToNow(new Date(task.last_activity_at), { addSuffix: true })
                    : "—",
                },
              ]}
            />

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
            <InfoCard
              title="Additional Information"
              items={[
                { label: 'Visibility', value: task.visibility ? task.visibility.charAt(0).toUpperCase() + task.visibility.slice(1) : "Company" },
                { label: 'Estimated Hours', value: task.estimated_hours ? `${task.estimated_hours}h` : "—" },
                { label: 'Actual Hours', value: task.actual_hours ? `${task.actual_hours}h` : "—" },
                {
                  label: 'Start Date',
                  value: task.start_date
                    ? format(task.start_date instanceof Date ? task.start_date : parseISO(task.start_date), "MMM d, yyyy")
                    : "—",
                },
                { label: 'Resolution', value: task.resolution || "—" },
                ...(task.archived_at ? [{
                  label: 'Archived',
                  value: format(new Date(task.archived_at), "MMM d, yyyy h:mm a"),
                }] : []),
              ]}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
