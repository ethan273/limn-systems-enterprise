/**
 * Alert Management Page - Phase 3D
 *
 * UI for managing workflow monitoring alerts and notifications
 *
 * @module automation/alerts
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Plus,
  Edit,
  Trash2,
  Bell,
  BellOff,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Activity,
} from 'lucide-react';
import { toast } from 'sonner';

const METRIC_LABELS = {
  execution_time: 'Execution Time',
  failure_rate: 'Failure Rate',
  queue_size: 'Queue Size',
  resource_usage: 'Resource Usage',
  custom: 'Custom Metric',
};

const THRESHOLD_TYPE_LABELS = {
  above: 'Above',
  below: 'Below',
  equals: 'Equals',
};

const CHANNEL_LABELS = {
  email: 'Email',
  in_app: 'In-App',
  google_chat: 'Google Chat',
};

export default function AlertManagementPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAcknowledgeDialogOpen, setIsAcknowledgeDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<any | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<any | null>(null);
  const [acknowledgmentNotes, setAcknowledgmentNotes] = useState('');
  const [activeTab, setActiveTab] = useState('rules');
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['in_app']);

  // Queries
  const { data: rules, isLoading: rulesLoading, refetch: refetchRules } =
    api.workflowMonitoring.getAlertRules.useQuery({});

  const { data: triggeredAlerts, refetch: refetchAlerts } =
    api.workflowMonitoring.getTriggeredAlerts.useQuery({});

  // Mutations
  const createMutation = api.workflowMonitoring.createAlertRule.useMutation({
    onSuccess: () => {
      toast.success('Alert rule created successfully');
      setIsCreateDialogOpen(false);
      setSelectedChannels(['in_app']);
      refetchRules();
    },
    onError: (error) => {
      toast.error(`Failed to create alert rule: ${error.message}`);
    },
  });

  const updateMutation = api.workflowMonitoring.updateAlertRule.useMutation({
    onSuccess: () => {
      toast.success('Alert rule updated successfully');
      setIsEditDialogOpen(false);
      setSelectedRule(null);
      refetchRules();
    },
    onError: (error) => {
      toast.error(`Failed to update alert rule: ${error.message}`);
    },
  });

  const deleteMutation = api.workflowMonitoring.deleteAlertRule.useMutation({
    onSuccess: () => {
      toast.success('Alert rule deleted successfully');
      refetchRules();
    },
    onError: (error) => {
      toast.error(`Failed to delete alert rule: ${error.message}`);
    },
  });

  const acknowledgeMutation = api.workflowMonitoring.acknowledgeAlert.useMutation({
    onSuccess: () => {
      toast.success('Alert acknowledged successfully');
      setIsAcknowledgeDialogOpen(false);
      setSelectedAlert(null);
      setAcknowledgmentNotes('');
      refetchAlerts();
    },
    onError: (error) => {
      toast.error(`Failed to acknowledge alert: ${error.message}`);
    },
  });

  const handleCreate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    createMutation.mutate({
      name: formData.get('name') as string,
      description: (formData.get('description') as string) || undefined,
      metric: formData.get('metric') as any,
      threshold_type: formData.get('threshold_type') as any,
      threshold_value: parseFloat(formData.get('threshold_value') as string),
      alert_channels: selectedChannels as any[],
      is_active: formData.get('is_active') === 'on',
    });
  };

  const handleUpdate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedRule) return;

    const formData = new FormData(event.currentTarget);

    updateMutation.mutate({
      id: selectedRule.id,
      data: {
        name: formData.get('name') as string,
        description: (formData.get('description') as string) || undefined,
        metric: formData.get('metric') as any,
        threshold_type: formData.get('threshold_type') as any,
        threshold_value: parseFloat(formData.get('threshold_value') as string),
        is_active: formData.get('is_active') === 'on',
      },
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this alert rule? This action cannot be undone.')) {
      deleteMutation.mutate({ id });
    }
  };

  const handleAcknowledge = () => {
    if (!selectedAlert) return;

    acknowledgeMutation.mutate({
      alertId: selectedAlert.id,
      notes: acknowledgmentNotes || undefined,
    });
  };

  const toggleChannel = (channel: string) => {
    setSelectedChannels((prev) =>
      prev.includes(channel)
        ? prev.filter((c) => c !== channel)
        : [...prev, channel]
    );
  };

  const alertRules = rules?.rules || [];
  const alerts = triggeredAlerts?.alerts || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Breadcrumb
        items={[
          { label: 'Automation', href: '/automation' },
          { label: 'Alert Management', href: '/automation/alerts' },
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alert Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage workflow monitoring alerts and notification rules
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Alert Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Create Alert Rule</DialogTitle>
                <DialogDescription>
                  Create a new monitoring alert rule to get notified when thresholds are exceeded
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Rule Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="e.g., High Failure Rate Alert"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Describe when this alert should trigger..."
                    rows={2}
                  />
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-4">Metric Configuration</h3>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="metric">Metric to Monitor *</Label>
                      <Select name="metric" required defaultValue="failure_rate">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="execution_time">Execution Time</SelectItem>
                          <SelectItem value="failure_rate">Failure Rate</SelectItem>
                          <SelectItem value="queue_size">Queue Size</SelectItem>
                          <SelectItem value="resource_usage">Resource Usage</SelectItem>
                          <SelectItem value="custom">Custom Metric</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="threshold_type">Threshold Type *</Label>
                        <Select name="threshold_type" required defaultValue="above">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="above">Above</SelectItem>
                            <SelectItem value="below">Below</SelectItem>
                            <SelectItem value="equals">Equals</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="threshold_value">Threshold Value *</Label>
                        <Input
                          id="threshold_value"
                          name="threshold_value"
                          type="number"
                          step="0.1"
                          placeholder="e.g., 10.0"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-4">Alert Channels</h3>
                  <div className="space-y-2">
                    {Object.entries(CHANNEL_LABELS).map(([key, label]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <Checkbox
                          id={`channel-${key}`}
                          checked={selectedChannels.includes(key)}
                          onCheckedChange={() => toggleChannel(key)}
                        />
                        <Label
                          htmlFor={`channel-${key}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {label}
                        </Label>
                      </div>
                    ))}
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
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setSelectedChannels(['in_app']);
                  }}
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
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rules</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alertRules.length}</div>
            <p className="text-xs text-muted-foreground">configured alert rules</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {alerts.filter((a: any) => a.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">unacknowledged</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acknowledged</CardTitle>
            <Clock className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {alerts.filter((a: any) => a.status === 'acknowledged').length}
            </div>
            <p className="text-xs text-muted-foreground">pending resolution</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {alerts.filter((a: any) => a.status === 'resolved').length}
            </div>
            <p className="text-xs text-muted-foreground">resolved alerts</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="rules">Alert Rules</TabsTrigger>
          <TabsTrigger value="alerts">Triggered Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="rules">
          <Card>
            <CardHeader>
              <CardTitle>Alert Rules ({alertRules.length})</CardTitle>
              <CardDescription>
                Configured monitoring rules and notification settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rulesLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading alert rules...</div>
              ) : alertRules.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BellOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No alert rules configured yet.</p>
                  <p className="text-sm mt-1">Create your first alert rule to get started with monitoring.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rule Name</TableHead>
                      <TableHead>Metric</TableHead>
                      <TableHead>Threshold</TableHead>
                      <TableHead>Channels</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alertRules.map((rule: any) => (
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
                            {METRIC_LABELS[rule.metric as keyof typeof METRIC_LABELS]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {THRESHOLD_TYPE_LABELS[rule.threshold_type as keyof typeof THRESHOLD_TYPE_LABELS]}{' '}
                          {rule.threshold_value}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {rule.alert_channels?.map((channel: string) => (
                              <Badge key={channel} variant="secondary" className="text-xs">
                                {CHANNEL_LABELS[channel as keyof typeof CHANNEL_LABELS]}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          {rule.is_active ? (
                            <Badge className="bg-success">
                              <Activity className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedRule(rule);
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

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Triggered Alerts ({alerts.length})</CardTitle>
              <CardDescription>Recent alerts requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-success opacity-50" />
                  <p>No alerts triggered.</p>
                  <p className="text-sm mt-1">All systems are operating normally.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts.map((alert: any) => (
                      <TableRow key={alert.id}>
                        <TableCell className="text-sm">
                          {new Date(alert.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-warning" />
                            <span className="font-medium">{alert.message}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {alert.status === 'active' && (
                            <Badge variant="destructive">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          )}
                          {alert.status === 'acknowledged' && (
                            <Badge className="bg-warning">
                              <Clock className="h-3 w-3 mr-1" />
                              Acknowledged
                            </Badge>
                          )}
                          {alert.status === 'resolved' && (
                            <Badge className="bg-success">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Resolved
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {alert.status === 'active' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedAlert(alert);
                                setIsAcknowledgeDialogOpen(true);
                              }}
                            >
                              Acknowledge
                            </Button>
                          )}
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
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle>Edit Alert Rule</DialogTitle>
              <DialogDescription>Update alert rule settings</DialogDescription>
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
                <Label htmlFor="edit-metric">Metric to Monitor *</Label>
                <Select name="metric" required defaultValue={selectedRule?.metric}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="execution_time">Execution Time</SelectItem>
                    <SelectItem value="failure_rate">Failure Rate</SelectItem>
                    <SelectItem value="queue_size">Queue Size</SelectItem>
                    <SelectItem value="resource_usage">Resource Usage</SelectItem>
                    <SelectItem value="custom">Custom Metric</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-threshold_type">Threshold Type *</Label>
                  <Select name="threshold_type" required defaultValue={selectedRule?.threshold_type}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="above">Above</SelectItem>
                      <SelectItem value="below">Below</SelectItem>
                      <SelectItem value="equals">Equals</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-threshold_value">Threshold Value *</Label>
                  <Input
                    id="edit-threshold_value"
                    name="threshold_value"
                    type="number"
                    step="0.1"
                    defaultValue={selectedRule?.threshold_value}
                    required
                  />
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

      {/* Acknowledge Alert Dialog */}
      <Dialog open={isAcknowledgeDialogOpen} onOpenChange={setIsAcknowledgeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Acknowledge Alert</DialogTitle>
            <DialogDescription>
              Acknowledge this alert and optionally add notes about investigation or resolution.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="ack-notes">Notes (Optional)</Label>
              <Textarea
                id="ack-notes"
                value={acknowledgmentNotes}
                onChange={(e) => setAcknowledgmentNotes(e.target.value)}
                placeholder="Add notes about this alert..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsAcknowledgeDialogOpen(false);
                setSelectedAlert(null);
                setAcknowledgmentNotes('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAcknowledge} disabled={acknowledgeMutation.isPending}>
              {acknowledgeMutation.isPending ? 'Acknowledging...' : 'Acknowledge Alert'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
