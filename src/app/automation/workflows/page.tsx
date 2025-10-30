/**
 * Workflow Builder Page - Phase 3A
 *
 * UI for creating and managing visual workflow definitions
 *
 * @module automation/workflows
 * @created 2025-10-30
 * @phase Phase 3 - Automation & Workflows
 */

'use client';

import { useState } from 'react';
import { Breadcrumb } from '@/components/common';
import { api } from '@/utils/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';


import {
  Plus,
  Edit,
  Trash2,
  GitBranch,
  Play,
  Pause,
  Archive,


} from 'lucide-react';
import { toast } from 'sonner';

type Workflow = {
  id: string;
  name: string;
  description: string | null;
  workflow_type: string | null;
  entity_type: string | null;
  entity_id: string | null;
  nodes: any[];
  edges: any[];
  config: Record<string, any>;
  status: 'draft' | 'active' | 'paused' | 'archived';
  version: number;
  created_at: Date;
  updated_at: Date;
};

const STATUS_COLORS = {
  draft: 'bg-gray-500',
  active: 'bg-success',
  paused: 'bg-warning',
  archived: 'bg-gray-400',
};

const WORKFLOW_TYPE_LABELS = {
  approval: 'Approval',
  notification: 'Notification',
  task_creation: 'Task Creation',
  custom: 'Custom',
};

export default function WorkflowBuilderPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Queries
  const { data, isLoading, refetch } = api.workflows.getAll.useQuery({
    status: statusFilter !== 'all' ? statusFilter as any : undefined,
    workflowType: typeFilter !== 'all' ? typeFilter as any : undefined,
  });

  // Mutations
  const createMutation = api.workflows.create.useMutation({
    onSuccess: (result) => {
      toast.success('Workflow created successfully');
      setIsCreateDialogOpen(false);
      refetch();
      // Optionally redirect to workflow builder/editor
      if (result.workflow?.id) {
        // window.location.href = `/automation/workflows/${result.workflow.id}/edit`;
      }
    },
    onError: (error) => {
      toast.error(`Failed to create workflow: ${error.message}`);
    },
  });

  const updateMutation = api.workflows.update.useMutation({
    onSuccess: () => {
      toast.success('Workflow updated successfully');
      setIsEditDialogOpen(false);
      setSelectedWorkflow(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update workflow: ${error.message}`);
    },
  });

  const deleteMutation = api.workflows.delete.useMutation({
    onSuccess: () => {
      toast.success('Workflow deleted successfully');
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete workflow: ${error.message}`);
    },
  });

  const handleCreate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    createMutation.mutate({
      name: formData.get('name') as string,
      description: (formData.get('description') as string) || undefined,
      workflowType: formData.get('workflow_type') as any,
      entityType: (formData.get('entity_type') as any) || undefined,
      nodes: [],
      edges: [],
      config: {},
    });
  };

  const handleUpdate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedWorkflow) return;

    const formData = new FormData(event.currentTarget);

    updateMutation.mutate({
      id: selectedWorkflow.id,
      name: formData.get('name') as string,
      description: (formData.get('description') as string) || undefined,
      status: formData.get('status') as any,
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this workflow? This action cannot be undone.')) {
      deleteMutation.mutate({ id });
    }
  };

  const handleStatusChange = (id: string, status: 'draft' | 'active' | 'paused' | 'archived') => {
    updateMutation.mutate({ id, status });
  };

  const workflows = data?.workflows || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Breadcrumb
        items={[
          { label: 'Automation', href: '/automation' },
          { label: 'Workflows', href: '/automation/workflows' },
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workflow Builder</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage visual workflow definitions and automation processes
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Workflow
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Create New Workflow</DialogTitle>
                <DialogDescription>
                  Start building a new automation workflow from scratch
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Workflow Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="e.g., Order Approval Process"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Describe what this workflow does..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="workflow_type">Workflow Type *</Label>
                    <Select name="workflow_type" required defaultValue="custom">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="approval">Approval</SelectItem>
                        <SelectItem value="notification">Notification</SelectItem>
                        <SelectItem value="task_creation">Task Creation</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="entity_type">Entity Type (Optional)</Label>
                    <Select name="entity_type">
                      <SelectTrigger>
                        <SelectValue placeholder="Select entity..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="shop_drawing">Shop Drawing</SelectItem>
                        <SelectItem value="production_order">Production Order</SelectItem>
                        <SelectItem value="project">Project</SelectItem>
                        <SelectItem value="task">Task</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="bg-info/5 border border-info rounded-md p-4 text-sm text-info">
                  <p className="font-medium mb-1">Next Steps:</p>
                  <p>After creating the workflow, you&apos;ll be able to design the workflow using the visual builder.</p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create Workflow'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="approval">Approval</SelectItem>
                  <SelectItem value="notification">Notification</SelectItem>
                  <SelectItem value="task_creation">Task Creation</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setStatusFilter('all');
                  setTypeFilter('all');
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workflows Table */}
      <Card>
        <CardHeader>
          <CardTitle>Workflows ({workflows.length})</CardTitle>
          <CardDescription>
            {statusFilter !== 'all'
              ? `Showing ${statusFilter} workflows`
              : 'All workflow definitions'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading workflows...</div>
          ) : workflows.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No workflows found</p>
              <p className="text-sm mt-1">Create your first workflow to get started with automation.</p>
              <Button
                className="mt-4"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Workflow
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workflows.map((workflow) => (
                  <TableRow key={(workflow as Workflow).id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{(workflow as Workflow).name}</div>
                        {(workflow as Workflow).description && (
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {(workflow as Workflow).description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {(workflow as Workflow).workflow_type ? (
                        <Badge variant="outline">
                          {WORKFLOW_TYPE_LABELS[(workflow as Workflow).workflow_type as keyof typeof WORKFLOW_TYPE_LABELS] || (workflow as Workflow).workflow_type}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {(workflow as Workflow).entity_type || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[(workflow as Workflow).status]}>
                        {(workflow as Workflow).status.charAt(0).toUpperCase() + (workflow as Workflow).status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      v{(workflow as Workflow).version}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date((workflow as Workflow).updated_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {(workflow as Workflow).status === 'active' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusChange((workflow as Workflow).id, 'paused')}
                            title="Pause workflow"
                          >
                            <Pause className="h-4 w-4" />
                          </Button>
                        )}
                        {(workflow as Workflow).status === 'paused' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusChange((workflow as Workflow).id, 'active')}
                            title="Activate workflow"
                          >
                            <Play className="h-4 w-4 text-success" />
                          </Button>
                        )}
                        {((workflow as Workflow).status === 'draft' || (workflow as Workflow).status === 'paused') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusChange((workflow as Workflow).id, 'archived')}
                            title="Archive workflow"
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedWorkflow(workflow as Workflow);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete((workflow as Workflow).id)}
                          disabled={deleteMutation.isPending || (workflow as Workflow).status === 'active'}
                          title={(workflow as Workflow).status === 'active' ? 'Cannot delete active workflow' : 'Delete workflow'}
                        >
                          <Trash2 className={`h-4 w-4 ${(workflow as Workflow).status === 'active' ? 'text-muted-foreground' : 'text-destructive'}`} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle>Edit Workflow</DialogTitle>
              <DialogDescription>Update workflow details</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Workflow Name *</Label>
                <Input
                  id="edit-name"
                  name="name"
                  defaultValue={selectedWorkflow?.name}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  name="description"
                  defaultValue={selectedWorkflow?.description || ''}
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select name="status" defaultValue={selectedWorkflow?.status}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="bg-warning/5 border border-warning rounded-md p-4 text-sm text-warning">
                <p className="font-medium mb-1">Note:</p>
                <p>To edit workflow nodes and edges, use the visual workflow builder.</p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setSelectedWorkflow(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Updating...' : 'Update Workflow'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
