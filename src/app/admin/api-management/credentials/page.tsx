'use client';

import { useState } from 'react';
import { api } from '@/lib/api/client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  Key,
  Plus,
  Search,
  Shield,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';
import { FormDialog } from '@/components/common/FormDialog';
import type { FormField } from '@/components/common/FormDialog';
import { DataTable } from '@/components/common/DataTable';
import type { DataTableColumn } from '@/components/common/DataTable';
import { EmptyState } from '@/components/common';
import { SERVICE_TEMPLATES, getTemplate } from '@/lib/api-management/service-templates';

interface ApiCredential {
  id: string;
  service_name: string;
  display_name: string;
  description: string | null;
  credential_type: string;
  credentials: Record<string, string>;
  environment: string | null;
  is_active: boolean;
  last_used_at: Date | null;
  expires_at: Date | null;
  created_at: Date;
  updated_at: Date;
  service_template: string | null;
  users_api_credentials_created_byTousers?: {
    email: string | null;
    id: string;
  } | null;
}

export default function ApiCredentialsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCredential, setEditingCredential] = useState<ApiCredential | null>(null);
  const [selectedService, setSelectedService] = useState('');
  const [showExpiringOnly, setShowExpiringOnly] = useState(false);

  // Fetch credentials
  const { data: credentials, error, isLoading } = api.apiCredentials.getAll.useQuery();
  const { data: expiringCredentials } = api.apiCredentials.getExpiring.useQuery();
  const { data: envScan } = api.apiCredentials.scanEnvironment.useQuery();

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  // Mutations
  const createMutation = api.apiCredentials.create.useMutation({
    onSuccess: () => {
      // Invalidate queries for instant updates
      utils.apiCredentials.getAll.invalidate();
      utils.apiCredentials.getExpiring.invalidate();
      setIsCreateDialogOpen(false);
    },
  });

  const updateMutation = api.apiCredentials.update.useMutation({
    onSuccess: () => {
      // Invalidate queries for instant updates
      utils.apiCredentials.getAll.invalidate();
      utils.apiCredentials.getExpiring.invalidate();
      setIsEditDialogOpen(false);
      setEditingCredential(null);
    },
  });

  const deleteMutation = api.apiCredentials.delete.useMutation({
    onSuccess: () => {
      // Invalidate queries for instant updates
      utils.apiCredentials.getAll.invalidate();
      utils.apiCredentials.getExpiring.invalidate();
    },
  });

  // Calculate days until expiration
  const getDaysUntilExpiration = (expiresAt: Date | null): number | null => {
    if (!expiresAt) return null;
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get rotation recommendation
  const getRotationStatus = (createdAt: Date, _lastUsedAt: Date | null): {
    status: 'good' | 'warning' | 'urgent';
    message: string;
    daysOld: number;
  } => {
    const now = new Date();
    const created = new Date(createdAt);
    const daysOld = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));

    if (daysOld < 60) {
      return { status: 'good', message: 'Recently created', daysOld };
    } else if (daysOld < 90) {
      return { status: 'warning', message: 'Consider rotating soon', daysOld };
    } else {
      return { status: 'urgent', message: 'Rotation recommended', daysOld };
    }
  };

  // Handle create form submission
  const handleCreate = async (data: Record<string, unknown>) => {
    const template = getTemplate(data.service_template as string);

    // Build credentials object from dynamic fields
    const credentials: Record<string, unknown> = {};
    if (template) {
      template.fields.forEach((field) => {
        if (data[field.name]) {
          credentials[field.name] = data[field.name];
        }
      });
    }

    // Add expiration date (default to template recommendation)
    const expiresAt = template
      ? new Date(Date.now() + template.rotationDays * 24 * 60 * 60 * 1000).toISOString()
      : undefined;

    await createMutation.mutateAsync({
      service_name: data.service_name as string,
      display_name: data.display_name as string,
      description: (data.description as string) || undefined,
      credential_type: 'api_key',
      credentials,
      environment: (data.environment as string) || 'production',
      expires_at: expiresAt,
      service_template: (data.service_template as string) || undefined,
    });
  };

  // Handle edit
  const handleEdit = (credential: ApiCredential) => {
    setEditingCredential(credential);
    setIsEditDialogOpen(true);
  };

  // Handle update form submission
  const handleUpdate = async (data: Record<string, unknown>) => {
    if (!editingCredential) return;

    await updateMutation.mutateAsync({
      id: editingCredential.id,
      display_name: data.display_name as string,
      description: (data.description as string) || undefined,
      environment: data.environment as string,
      is_active: data.is_active as boolean,
      expires_at: data.expires_at ? (data.expires_at as string) : null,
    });
  };

  // Handle delete
  const handleDelete = async (id: string, displayName: string) => {
    if (confirm(`Are you sure you want to delete "${displayName}"? This cannot be undone.`)) {
      await deleteMutation.mutateAsync({ id });
    }
  };

  // Dynamic form fields based on selected service
  const getCreateFormFields = (): FormField[] => {
    const template = getTemplate(selectedService);

    const baseFields: FormField[] = [
      {
        name: 'service_template',
        label: 'Service Type',
        type: 'select',
        required: true,
        options: SERVICE_TEMPLATES.map((t) => ({ value: t.value, label: t.label })),
        defaultValue: selectedService,
      },
      {
        name: 'display_name',
        label: 'Display Name',
        type: 'text',
        required: true,
        placeholder: template?.label || 'My API Service',
      },
      {
        name: 'service_name',
        label: 'Unique Service ID',
        type: 'text',
        required: true,
        placeholder: 'my_service_prod',
        helperText: 'Lowercase, underscores only. Used internally to reference this credential.',
      },
      {
        name: 'description',
        label: 'Description',
        type: 'textarea',
        placeholder: template?.description || 'Describe this API integration...',
      },
      {
        name: 'environment',
        label: 'Environment',
        type: 'select',
        required: true,
        options: [
          { value: 'production', label: 'Production' },
          { value: 'staging', label: 'Staging' },
          { value: 'sandbox', label: 'Sandbox' },
          { value: 'development', label: 'Development' },
        ],
        defaultValue: 'production',
      },
    ];

    // Add dynamic credential fields based on template
    if (template && template.fields.length > 0) {
      template.fields.forEach((field) => {
        baseFields.push({
          name: field.name,
          label: field.label,
          type: field.type === 'password' ? 'password' : 'text',
          required: field.required,
          placeholder: field.placeholder || `Enter ${field.name}...`,
          helperText: field.description,
        });
      });
    }

    return baseFields;
  };

  // Table columns
  const columns: DataTableColumn<ApiCredential>[] = [
    {
      key: 'display_name',
      label: 'Service',
      render: (_, row) => {
        const template = row.service_template ? getTemplate(row.service_template) : null;
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              {template?.icon ? (
                <span className="text-xl">{template.icon}</span>
              ) : (
                <Key className="h-5 w-5 text-primary" />
              )}
            </div>
            <div>
              <div className="font-medium">{row.display_name}</div>
              <div className="text-sm text-muted-foreground">{row.service_name}</div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'service_template',
      label: 'Type',
      render: (value) => {
        if (!value) return <span className="text-muted-foreground text-sm">Custom</span>;
        const template = getTemplate(value as string);
        return (
          <Badge variant="outline" className="font-normal">
            {template?.label || (value as string)}
          </Badge>
        );
      },
    },
    {
      key: 'environment',
      label: 'Environment',
      render: (value) => {
        const env = value as string | null;
        if (!env) return <span className="text-muted-foreground text-sm">N/A</span>;
        const colors = {
          production: 'badge-success',
          staging: 'badge-info',
          sandbox: 'badge-warning',
          development: 'badge-secondary',
        };
        return (
          <Badge variant="outline" className={colors[env as keyof typeof colors] || ''}>
            {env}
          </Badge>
        );
      },
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (value) =>
        value ? (
          <Badge variant="outline" className="bg-success/10 text-success border-success/20">
            <CheckCircle className="mr-1 h-3 w-3" />
            Active
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-muted text-muted-foreground">
            Inactive
          </Badge>
        ),
    },
    {
      key: 'created_at',
      label: 'Age & Rotation',
      render: (_, row) => {
        const rotation = getRotationStatus(row.created_at, row.last_used_at);
        const statusColors = {
          good: 'text-success',
          warning: 'text-warning',
          urgent: 'text-destructive',
        };
        return (
          <div>
            <div className="text-sm">{rotation.daysOld} days old</div>
            <div className={`text-xs ${statusColors[rotation.status]}`}>{rotation.message}</div>
          </div>
        );
      },
    },
    {
      key: 'expires_at',
      label: 'Expires',
      render: (value) => {
        if (!value) return <span className="text-muted-foreground text-sm">Never</span>;
        const daysUntil = getDaysUntilExpiration(value as Date);
        if (daysUntil === null) return <span className="text-muted-foreground text-sm">Never</span>;

        if (daysUntil < 0) {
          return (
            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
              <AlertCircle className="mr-1 h-3 w-3" />
              Expired
            </Badge>
          );
        } else if (daysUntil < 30) {
          return (
            <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
              <AlertTriangle className="mr-1 h-3 w-3" />
              {daysUntil}d
            </Badge>
          );
        } else {
          return <span className="text-sm text-muted-foreground">{daysUntil} days</span>;
        }
      },
    },
    {
      key: 'last_used_at',
      label: 'Last Used',
      render: (value) => {
        if (!value) return <span className="text-muted-foreground text-sm">Never</span>;
        const date = new Date(value as Date);
        const now = new Date();
        const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

        if (diffHours < 24) {
          return <span className="text-sm">Today</span>;
        } else if (diffHours < 48) {
          return <span className="text-sm">Yesterday</span>;
        } else {
          const diffDays = Math.floor(diffHours / 24);
          return <span className="text-sm text-muted-foreground">{diffDays}d ago</span>;
        }
      },
    },
  ];

  // Handle query error
  if (error) {
    return (
      <div className="page-container">
        <Link
          href="/admin/api-management"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to API Management
        </Link>
        <div className="page-header">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="page-title">API Credentials</h1>
              <p className="page-description">
                Securely manage API keys and credentials for all integrations
              </p>
            </div>
          </div>
        </div>
        <EmptyState
          icon={AlertTriangle}
          title="Failed to load credentials"
          description={error.message || "An unexpected error occurred. Please try again."}
          action={{
            label: 'Try Again',
            onClick: () => utils.apiCredentials.getAll.invalidate(),
            icon: RefreshCw,
          }}
        />
      </div>
    );
  }

  // Filter credentials
  const filteredCredentials = credentials?.filter((cred) => {
    const matchesSearch =
      cred.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cred.service_name.toLowerCase().includes(searchQuery.toLowerCase());

    if (showExpiringOnly) {
      const daysUntil = getDaysUntilExpiration(cred.expires_at);
      return matchesSearch && daysUntil !== null && daysUntil < 30;
    }

    return matchesSearch;
  });

  return (
    <div className="page-container">
      {/* Back Navigation */}
      <Link
        href="/admin/api-management"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to API Management
      </Link>

      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="page-title">API Credentials</h1>
            <p className="page-description">
              Securely manage API keys and credentials for all integrations
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <Key className="h-8 w-8 text-primary" />
            <div>
              <div className="text-2xl font-bold">{credentials?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Total Credentials</div>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-success" />
            <div>
              <div className="text-2xl font-bold">
                {credentials?.filter((c) => c.is_active).length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Active</div>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-warning" />
            <div>
              <div className="text-2xl font-bold">{expiringCredentials?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Expiring Soon</div>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-muted-foreground" />
            <div>
              <div className="text-2xl font-bold">
                {credentials?.filter((c) => {
                  const rotation = getRotationStatus(c.created_at, c.last_used_at);
                  return rotation.status === 'urgent';
                }).length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Need Rotation</div>
            </div>
          </div>
        </div>
      </div>

      {/* Environment Detection Section */}
      {envScan && (
        <div className="space-y-4 mb-6">
          {/* Detected APIs from .env files */}
          {envScan.detected.length > 0 && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Eye className="h-5 w-5 text-primary" />
                    Detected in Environment Files
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Found {envScan.detected.length} API configuration{envScan.detected.length > 1 ? 's' : ''} in .env files
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {envScan.detected.map((api: any) => (
                  <div
                    key={api.service}
                    className={`border rounded-lg p-4 ${
                      api.isConfigured
                        ? 'border-success/30 bg-success/5'
                        : 'border-warning/30 bg-warning/5'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {api.isConfigured ? (
                          <CheckCircle className="h-5 w-5 text-success" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-warning" />
                        )}
                        <h4 className="font-medium">{api.displayName}</h4>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {api.source}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      {Object.keys(api.keys).map((key) => (
                        <div key={key} className="flex items-center gap-2">
                          <Key className="h-3 w-3" />
                          <span className="font-mono text-xs">{key}</span>
                        </div>
                      ))}
                    </div>
                    {!api.isConfigured && (
                      <p className="text-xs text-warning mt-2">
                        Some required keys are missing
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended APIs */}
          {envScan.recommended.filter((api: any) => !api.isConfigured).length > 0 && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Plus className="h-5 w-5 text-muted-foreground" />
                    Recommended APIs to Configure
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {envScan.summary.needed} integration{envScan.summary.needed > 1 ? 's' : ''} still needed for full platform functionality
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {envScan.recommended
                  .filter((api: any) => !api.isConfigured)
                  .map((api: any) => (
                    <div
                      key={api.service}
                      className="border border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium">{api.displayName}</h4>
                        <Badge variant="outline" className="text-xs bg-muted">
                          Not Configured
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {api.description}
                      </p>
                      <div className="text-xs text-muted-foreground mb-3">
                        <span className="font-semibold">Required keys:</span>
                        <div className="mt-1 space-y-1">
                          {api.requiredKeys.map((key: string) => (
                            <div key={key} className="flex items-center gap-1">
                              <Key className="h-3 w-3" />
                              <span className="font-mono">{key}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setSelectedService(api.service);
                          setIsCreateDialogOpen(true);
                        }}
                      >
                        <Plus className="h-3 w-3 mr-2" />
                        Configure {api.displayName}
                      </Button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Summary Stats */}
          <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              <span className="text-sm font-medium">
                {envScan.summary.configured} of {envScan.summary.total} APIs Configured
              </span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-warning" />
              <span className="text-sm text-muted-foreground">
                {envScan.summary.needed} Still Needed
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Expiring Credentials Alert */}
      {expiringCredentials && expiringCredentials.length > 0 && (
        <div className="alert alert-warning mb-6">
          <AlertTriangle className="h-5 w-5" />
          <div className="flex-1">
            <strong>Attention Required:</strong> {expiringCredentials.length} credential
            {expiringCredentials.length > 1 ? 's' : ''} expiring within 30 days
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowExpiringOnly(!showExpiringOnly)}
          >
            {showExpiringOnly ? 'Show All' : 'View'}
          </Button>
        </div>
      )}

      {/* Actions Bar */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search credentials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Credential
        </Button>
      </div>

      {/* Credentials Table */}
      <div className="card">
        <DataTable
          data={(filteredCredentials || []) as unknown as Record<string, unknown>[]}
          columns={columns as unknown as DataTableColumn<Record<string, unknown>>[]}
          isLoading={isLoading}
          rowActions={[
            {
              label: 'Edit',
              onClick: (row) => handleEdit(row as unknown as ApiCredential),
            },
            {
              label: 'Delete',
              onClick: (row) => handleDelete((row as unknown as ApiCredential).id, (row as unknown as ApiCredential).display_name),
              variant: 'destructive',
            },
          ]}
          emptyState={{
            icon: Key,
            title: 'No API credentials',
            description: 'Add your first API credential to get started with integrations.',
            action: {
              label: 'Add Credential',
              onClick: () => setIsCreateDialogOpen(true),
            },
          }}
        />
      </div>

      {/* Create Dialog */}
      <FormDialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) setSelectedService('');
        }}
        title="Add API Credential"
        description="Add a new API credential for service integration. Credentials are encrypted at rest."
        fields={getCreateFormFields()}
        onSubmit={handleCreate}
        submitLabel="Add Credential"
        isLoading={createMutation.isPending}
      />

      {/* Edit Dialog */}
      {editingCredential && (
        <FormDialog
          open={isEditDialogOpen}
          onOpenChange={(open) => {
            setIsEditDialogOpen(open);
            if (!open) setEditingCredential(null);
          }}
          title="Edit API Credential"
          description="Update credential settings. Credentials cannot be edited directly for security reasons."
          fields={[
            {
              name: 'display_name',
              label: 'Display Name',
              type: 'text',
              required: true,
              defaultValue: editingCredential.display_name,
            },
            {
              name: 'description',
              label: 'Description',
              type: 'textarea',
              defaultValue: editingCredential.description || '',
            },
            {
              name: 'environment',
              label: 'Environment',
              type: 'select',
              required: true,
              options: [
                { value: 'production', label: 'Production' },
                { value: 'staging', label: 'Staging' },
                { value: 'sandbox', label: 'Sandbox' },
                { value: 'development', label: 'Development' },
              ],
              defaultValue: editingCredential.environment,
            },
            {
              name: 'expires_at',
              label: 'Expiration Date',
              type: 'date',
              defaultValue: editingCredential.expires_at
                ? new Date(editingCredential.expires_at).toISOString().split('T')[0]
                : '',
            },
            {
              name: 'is_active',
              label: 'Active',
              type: 'checkbox',
              defaultValue: editingCredential.is_active,
            },
          ]}
          onSubmit={handleUpdate}
          submitLabel="Update Credential"
          isLoading={updateMutation.isPending}
        />
      )}
    </div>
  );
}
