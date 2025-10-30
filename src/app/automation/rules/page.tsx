/**
 * Task Automation Rules Page - Phase 3C
 *
 * UI for managing automated task creation and management based on business rules
 *
 * @module automation/rules
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Play, Activity, TrendingUp, CheckCircle2, AlertCircle, Filter } from 'lucide-react';
import { toast } from 'sonner';

type AutomationRule = {
  id: string;
  name: string;
  description: string | null;
  trigger_event: string;
  conditions: Record<string, any>;
  action_type: string;
  action_config: Record<string, any>;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  created_by: string;
};

const TRIGGER_EVENT_LABELS = {
  order_created: 'Order Created',
  order_status_changed: 'Order Status Changed',
  project_started: 'Project Started',
  production_milestone: 'Production Milestone',
  qc_failed: 'QC Failed',
  payment_received: 'Payment Received',
  custom: 'Custom Event',
};

const PRIORITY_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export default function TaskAutomationRulesPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<AutomationRule | null>(null);
  const [triggerFilter, setTriggerFilter] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);
  const [activeTab, setActiveTab] = useState('all');

  // Queries
  const { data, isLoading, refetch } = api.taskAutomation.getAllRules.useQuery({
    triggerEvent: triggerFilter !== 'all' ? triggerFilter as any : undefined,
    isActive: activeFilter,
  });

  const { data: stats } = api.taskAutomation.getStats.useQuery();

  const { data: executionHistory } = api.taskAutomation.getExecutionHistory.useQuery({
    limit: 10,
  });

  // Mutations
  const createMutation = api.taskAutomation.createRule.useMutation({
    onSuccess: () => {
      toast.success('Automation rule created successfully');
      setIsCreateDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to create rule: ${error.message}`);
    },
  });

  const updateMutation = api.taskAutomation.updateRule.useMutation({
    onSuccess: () => {
      toast.success('Automation rule updated successfully');
      setIsEditDialogOpen(false);
      setSelectedRule(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update rule: ${error.message}`);
    },
  });

  const deleteMutation = api.taskAutomation.deleteRule.useMutation({
    onSuccess: () => {
      toast.success('Automation rule deleted successfully');
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete rule: ${error.message}`);
    },
  });

  const toggleActiveMutation = api.taskAutomation.toggleRuleActive.useMutation({
    onSuccess: () => {
      toast.success('Rule status updated');
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update rule status: ${error.message}`);
    },
  });

  const triggerMutation = api.taskAutomation.triggerRule.useMutation({
    onSuccess: () => {
      toast.success('Rule triggered successfully');
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to trigger rule: ${error.message}`);
    },
  });

  const handleCreate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const taskTemplate = {
      title: formData.get('task_title') as string,
      description: (formData.get('task_description') as string) || undefined,
      priority: (formData.get('task_priority') as any) || 'medium',
      due_date_offset_days: formData.get('due_date_offset_days')
        ? parseInt(formData.get('due_date_offset_days') as string)
        : undefined,
    };

    createMutation.mutate({
      name: formData.get('name') as string,
      description: (formData.get('description') as string) || undefined,
      trigger_event: formData.get('trigger_event') as any,
      task_template: taskTemplate,
      is_active: formData.get('is_active') === 'on',
    });
  };

  const handleUpdate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedRule) return;

    const formData = new FormData(event.currentTarget);

    const taskTemplate = {
      title: formData.get('task_title') as string,
      description: (formData.get('task_description') as string) || undefined,
      priority: (formData.get('task_priority') as any) || 'medium',
      due_date_offset_days: formData.get('due_date_offset_days')
        ? parseInt(formData.get('due_date_offset_days') as string)
        : undefined,
    };

    updateMutation.mutate({
      id: selectedRule.id,
      data: {
        name: formData.get('name') as string,
        description: (formData.get('description') as string) || undefined,
        trigger_event: formData.get('trigger_event') as any,
        task_template: taskTemplate,
        is_active: formData.get('is_active') === 'on',
      },
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this rule? This action cannot be undone.')) {
      deleteMutation.mutate({ id });
    }
  };

  const handleToggleActive = (id: string, isActive: boolean) => {
    toggleActiveMutation.mutate({ id, isActive });
  };

  const handleTrigger = (ruleId: string) => {
    if (confirm('Are you sure you want to manually trigger this rule?')) {
      triggerMutation.mutate({ ruleId });
    }
  };

  const rules = data?.rules || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Breadcrumb
        items={[
          { label: 'Automation', href: '/automation' },
          { label: 'Task Automation Rules', href: '/automation/rules' },
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Task Automation Rules</h1>
          <p className="text-muted-foreground mt-1">
            Manage automated task creation and management based on business rules
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Create Automation Rule</DialogTitle>
                <DialogDescription>
                  Create a new automation rule to automatically create tasks
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Rule Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="e.g., Create QC Task on Order Creation"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Describe when this rule should trigger..."
                    rows={2}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="trigger_event">Trigger Event *</Label>
                  <Select name="trigger_event" required defaultValue="order_created">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="order_created">Order Created</SelectItem>
                      <SelectItem value="order_status_changed">Order Status Changed</SelectItem>
                      <SelectItem value="project_started">Project Started</SelectItem>
                      <SelectItem value="production_milestone">Production Milestone</SelectItem>
                      <SelectItem value="qc_failed">QC Failed</SelectItem>
                      <SelectItem value="payment_received">Payment Received</SelectItem>
                      <SelectItem value="custom">Custom Event</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-4">Task Template</h3>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="task_title">Task Title *</Label>
                      <Input
                        id="task_title"
                        name="task_title"
                        placeholder="e.g., Quality Control Inspection"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="task_description">Task Description</Label>
                      <Textarea
                        id="task_description"
                        name="task_description"
                        placeholder="What should be done..."
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="task_priority">Priority</Label>
                        <Select name="task_priority" defaultValue="medium">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="due_date_offset_days">Due Date (Days)</Label>
                        <Input
                          id="due_date_offset_days"
                          name="due_date_offset_days"
                          type="number"
                          placeholder="e.g., 7"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch id="is_active" name="is_active" defaultChecked />
                  <Label htmlFor="is_active">Active</Label>
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
                  {createMutation.isPending ? 'Creating...' : 'Create Rule'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Rules</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRules}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeRules}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Executions (24h)</CardTitle>
              <TrendingUp className="h-4 w-4 text-info" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.executionsLast24h}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.successRate}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="all">All Rules</TabsTrigger>
          <TabsTrigger value="history">Execution History</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label>Trigger Event</Label>
                  <Select value={triggerFilter} onValueChange={setTriggerFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Events</SelectItem>
                      <SelectItem value="order_created">Order Created</SelectItem>
                      <SelectItem value="order_status_changed">Order Status Changed</SelectItem>
                      <SelectItem value="project_started">Project Started</SelectItem>
                      <SelectItem value="production_milestone">Production Milestone</SelectItem>
                      <SelectItem value="qc_failed">QC Failed</SelectItem>
                      <SelectItem value="payment_received">Payment Received</SelectItem>
                      <SelectItem value="custom">Custom Event</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Select
                    value={activeFilter === undefined ? 'all' : activeFilter ? 'active' : 'inactive'}
                    onValueChange={(v) => setActiveFilter(v === 'all' ? undefined : v === 'active')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Rules</SelectItem>
                      <SelectItem value="active">Active Only</SelectItem>
                      <SelectItem value="inactive">Inactive Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setTriggerFilter('all');
                      setActiveFilter(undefined);
                    }}
                    className="w-full"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rules Table */}
          <Card>
            <CardHeader>
              <CardTitle>Automation Rules ({rules.length})</CardTitle>
              <CardDescription>
                {triggerFilter !== 'all'
                  ? `Showing rules triggered by ${TRIGGER_EVENT_LABELS[triggerFilter as keyof typeof TRIGGER_EVENT_LABELS]}`
                  : 'All automation rules'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading rules...</div>
              ) : rules.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No rules found. Create your first automation rule to get started.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rule Name</TableHead>
                      <TableHead>Trigger Event</TableHead>
                      <TableHead>Task</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{rule.name}</div>
                            {rule.description && (
                              <div className="text-sm text-muted-foreground line-clamp-1">
                                {rule.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {TRIGGER_EVENT_LABELS[rule.trigger_event as keyof typeof TRIGGER_EVENT_LABELS] || rule.trigger_event}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{rule.action_config?.title || 'N/A'}</div>
                            {rule.action_config?.priority && (
                              <Badge variant="secondary" className="mt-1">
                                {PRIORITY_LABELS[rule.action_config.priority as keyof typeof PRIORITY_LABELS]}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={rule.is_active}
                              onCheckedChange={(checked) =>
                                handleToggleActive(rule.id, checked)
                              }
                              disabled={toggleActiveMutation.isPending}
                            />
                            <span className="text-sm">
                              {rule.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(rule.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleTrigger(rule.id)}
                              disabled={!rule.is_active || triggerMutation.isPending}
                              title="Test trigger rule"
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedRule(rule as AutomationRule);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(rule.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
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
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Recent Executions</CardTitle>
              <CardDescription>Last 10 automation rule executions</CardDescription>
            </CardHeader>
            <CardContent>
              {!executionHistory || executionHistory.logs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No execution history available yet.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Rule ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Triggered By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {executionHistory.logs.map((log: any) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {new Date(log.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm font-mono text-muted-foreground">
                          {log.rule_id?.substring(0, 8)}...
                        </TableCell>
                        <TableCell>
                          {log.status === 'success' ? (
                            <Badge variant="default" className="bg-success">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Success
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {log.status}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {log.triggered_by ? 'Manual' : 'Automated'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle>Edit Automation Rule</DialogTitle>
              <DialogDescription>Update rule details</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Rule Name *</Label>
                <Input
                  id="edit-name"
                  name="name"
                  defaultValue={selectedRule?.name}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  name="description"
                  defaultValue={selectedRule?.description || ''}
                  rows={2}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-trigger_event">Trigger Event *</Label>
                <Select name="trigger_event" required defaultValue={selectedRule?.trigger_event}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="order_created">Order Created</SelectItem>
                    <SelectItem value="order_status_changed">Order Status Changed</SelectItem>
                    <SelectItem value="project_started">Project Started</SelectItem>
                    <SelectItem value="production_milestone">Production Milestone</SelectItem>
                    <SelectItem value="qc_failed">QC Failed</SelectItem>
                    <SelectItem value="payment_received">Payment Received</SelectItem>
                    <SelectItem value="custom">Custom Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4">Task Template</h3>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-task_title">Task Title *</Label>
                    <Input
                      id="edit-task_title"
                      name="task_title"
                      defaultValue={selectedRule?.action_config?.title}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-task_description">Task Description</Label>
                    <Textarea
                      id="edit-task_description"
                      name="task_description"
                      defaultValue={selectedRule?.action_config?.description || ''}
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-task_priority">Priority</Label>
                      <Select
                        name="task_priority"
                        defaultValue={selectedRule?.action_config?.priority || 'medium'}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-due_date_offset_days">Due Date (Days)</Label>
                      <Input
                        id="edit-due_date_offset_days"
                        name="due_date_offset_days"
                        type="number"
                        defaultValue={selectedRule?.action_config?.due_date_offset_days}
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-is_active"
                  name="is_active"
                  defaultChecked={selectedRule?.is_active}
                />
                <Label htmlFor="edit-is_active">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setSelectedRule(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Updating...' : 'Update Rule'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
