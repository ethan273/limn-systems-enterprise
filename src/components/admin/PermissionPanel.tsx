'use client';

import { useState } from 'react';
import { api } from '@/lib/api/client';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ChevronDown, ChevronRight, X, RefreshCw, ChevronsDownUp, ChevronsUpDown, RotateCcw } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface PermissionPanelProps {
  userId: string;
  onClose: () => void;
}

const MODULES = [
  { key: 'dashboards', label: 'Dashboards', permissions: ['view'] },
  { key: 'tasks', label: 'Tasks', permissions: ['view', 'create', 'edit', 'delete'] },
  { key: 'crm', label: 'CRM', permissions: ['view', 'create', 'edit', 'delete'] },
  { key: 'partners', label: 'Partners', permissions: ['view', 'create', 'edit', 'delete'] },
  { key: 'design', label: 'Design', permissions: ['view', 'create', 'edit', 'delete', 'approve'] },
  { key: 'products', label: 'Products', permissions: ['view', 'create', 'edit', 'delete'] },
  { key: 'production', label: 'Production', permissions: ['view', 'create', 'edit', 'delete', 'approve'] },
  { key: 'shipping', label: 'Shipping', permissions: ['view', 'create', 'edit'] },
  { key: 'finance', label: 'Finance', permissions: ['view', 'create', 'edit', 'delete', 'approve'] },
  { key: 'documents', label: 'Documents', permissions: ['view', 'create', 'edit', 'delete'] },
  { key: 'admin', label: 'Admin', permissions: ['view', 'create', 'edit', 'delete'] },
];

const PERMISSION_LABELS = {
  view: 'View',
  create: 'Create',
  edit: 'Edit',
  delete: 'Delete',
  approve: 'Approve',
};

export function PermissionPanel({ userId, onClose }: PermissionPanelProps) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(['dashboards']));
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const { data: user } = api.admin.users.get.useQuery({ userId });
  const { data: permissions, refetch } = api.admin.permissions.getUserPermissions.useQuery({ userId });
  const updatePermission = api.admin.permissions.updateUserPermission.useMutation({
    onSuccess: () => {
      void refetch();
    },
  });
  const resetPermissions = api.admin.permissions.resetToDefaults.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Permissions reset to default values for this user type.',
      });
      void refetch();
      setResetDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reset permissions',
        variant: 'destructive',
      });
    },
  });

  const toggleModule = (moduleKey: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleKey)) {
        next.delete(moduleKey);
      } else {
        next.add(moduleKey);
      }
      return next;
    });
  };

  const getPermissionValue = (moduleKey: string, permission: string): boolean => {
    const modulePerm = permissions?.find((p) => p.module === moduleKey);
    if (!modulePerm) return false;

    const permKey = `can${permission.charAt(0).toUpperCase() + permission.slice(1)}` as keyof typeof modulePerm;
    // eslint-disable-next-line security/detect-object-injection
    return modulePerm[permKey] as boolean ?? false;
  };

  const handlePermissionToggle = async (moduleKey: string, permission: string, value: boolean) => {
    const permType = `can_${permission}` as 'can_view' | 'can_create' | 'can_edit' | 'can_delete' | 'can_approve';

    await updatePermission.mutateAsync({
      userId,
      module: moduleKey as any,
      permission: permType,
      value,
    });
  };

  const getEnabledCount = (moduleKey: string) => {
    const moduleItem = MODULES.find((m) => m.key === moduleKey);
    if (!moduleItem) return 0;

    let count = 0;
    for (const perm of moduleItem.permissions) {
      if (getPermissionValue(moduleKey, perm)) {
        count++;
      }
    }
    return count;
  };

  const handleExpandAll = () => {
    setExpandedModules(new Set(MODULES.map((m) => m.key)));
  };

  const handleCollapseAll = () => {
    setExpandedModules(new Set());
  };

  const handleResetConfirm = async () => {
    await resetPermissions.mutateAsync({ userId });
  };

  return (
    <Card className="permission-panel">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Permissions</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {user?.email}
              {user?.userType && (
                <span className={`ml-2 user-type-badge ${user.userType.replace('_', '-')}`}>
                  {user.userType.replace('_', ' ')}
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={expandedModules.size === MODULES.length ? handleCollapseAll : handleExpandAll}
            >
              {expandedModules.size === MODULES.length ? (
                <>
                  <ChevronsUpDown className="h-4 w-4 mr-2" />
                  Collapse All
                </>
              ) : (
                <>
                  <ChevronsDownUp className="h-4 w-4 mr-2" />
                  Expand All
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setResetDialogOpen(true)}
              disabled={resetPermissions.isPending}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => void refetch()}
              disabled={updatePermission.isPending}
            >
              <RefreshCw className={updatePermission.isPending ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="permission-categories">
          {MODULES.map((moduleItem) => {
            const isExpanded = expandedModules.has(moduleItem.key);
            const enabledCount = getEnabledCount(moduleItem.key);
            const totalCount = moduleItem.permissions.length;

            return (
              <div key={moduleItem.key} className="permission-category">
                <button
                  onClick={() => toggleModule(moduleItem.key)}
                  className="permission-category-header"
                >
                  <div className="permission-category-left">
                    {isExpanded ? (
                      <ChevronDown className="permission-chevron" />
                    ) : (
                      <ChevronRight className="permission-chevron" />
                    )}
                    <span className="permission-category-name">{moduleItem.label}</span>
                  </div>
                  <span className="permission-category-badge">
                    {enabledCount}/{totalCount}
                  </span>
                </button>

                {isExpanded && (
                  <div className="permission-items">
                    {moduleItem.permissions.map((perm) => {
                      const isEnabled = getPermissionValue(moduleItem.key, perm);

                      return (
                        <div key={perm} className="permission-item">
                          <div className="permission-item-info">
                            <div className="permission-item-label">
                              {PERMISSION_LABELS[perm as keyof typeof PERMISSION_LABELS]}
                            </div>
                          </div>
                          <Switch
                            checked={isEnabled}
                            onCheckedChange={(checked: boolean) =>
                              void handlePermissionToggle(moduleItem.key, perm, checked)
                            }
                            disabled={updatePermission.isPending}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Permissions to Defaults?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all custom permission overrides for this user and restore the default permissions for their user type ({user?.userType?.replace('_', ' ')}).
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetConfirm} disabled={resetPermissions.isPending}>
              {resetPermissions.isPending ? 'Resetting...' : 'Reset to Defaults'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
