"use client";

import React, { useState } from "react";
import { api } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserCog, Plus, Trash2, Search, AlertTriangle, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { DataTable, type DataTableColumn, LoadingState } from "@/components/common";

// Dynamic route configuration
export const dynamic = 'force-dynamic';

const AVAILABLE_ROLES = [
  'admin',
  'super_admin',
  'manager',
  'team_lead',
  'developer',
  'designer',
  'analyst',
  'viewer',
];

export default function RolesManagementPage() {
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [assignData, setAssignData] = useState({
    userId: '',
    role: '',
  });

  // Fetch role statistics
  const { data: roleStats, isLoading, error: roleStatsError } = api.admin.roles.getRoleStats.useQuery();

  // Auto-select first role when roleStats loads
  React.useEffect(() => {
    if (roleStats && roleStats.length > 0 && !selectedRole) {
      setSelectedRole(roleStats[0].role);
    }
  }, [roleStats, selectedRole]);

  // Fetch users by role - MOVED BEFORE CONDITIONAL RETURN
  const { data: roleUsers, error: roleUsersError } = api.admin.roles.getUsersByRole.useQuery(
    { role: selectedRole },
    { enabled: !!selectedRole }
  );

  // Fetch all users for assignment - MOVED BEFORE CONDITIONAL RETURN
  const { data: allUsers, error: allUsersError } = api.admin.users.list.useQuery({
    search: searchQuery || undefined,
    limit: 50,
    offset: 0,
  });

  // Get tRPC utils for cache invalidation - MOVED BEFORE CONDITIONAL RETURN
  const utils = api.useUtils();

  // Assign role mutation - MOVED BEFORE CONDITIONAL RETURN
  const assignMutation = api.admin.roles.assignRole.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Role assigned successfully",
      });
      // Invalidate queries for instant updates
      utils.admin.roles.getRoleStats.invalidate();
      utils.admin.roles.getUsersByRole.invalidate();
      setIsAssignDialogOpen(false);
      setAssignData({ userId: '', role: '' });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign role",
        variant: "destructive",
      });
    },
  });

  // Remove role mutation - MOVED BEFORE CONDITIONAL RETURN
  const removeMutation = api.admin.roles.removeRole.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Role removed successfully",
      });
      // Invalidate queries for instant updates
      utils.admin.roles.getRoleStats.invalidate();
      utils.admin.roles.getUsersByRole.invalidate();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove role",
        variant: "destructive",
      });
    },
  });

  // Handle loading state
  if (isLoading) {
    return (
      <div className="page-container">
        <LoadingState message="Loading roles..." size="lg" />
      </div>
    );
  }

  // Handle query errors
  const error = roleStatsError || roleUsersError || allUsersError;
  if (error) {
    return (
      <div className="page-container">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="h-8 w-8 text-destructive flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">Failed to Load Role Data</h3>
                <p className="text-muted-foreground mb-4">{error.message}</p>
                <Button
                  onClick={() => {
                    utils.admin.roles.getRoleStats.invalidate();
                    utils.admin.roles.getUsersByRole.invalidate();
                    utils.admin.users.list.invalidate();
                  }}
                  variant="outline"
                >
                  <RefreshCw className="icon-sm" />
                  Retry
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleAssign = () => {
    if (!assignData.userId || !assignData.role) {
      toast({
        title: "Validation Error",
        description: "User and role are required",
        variant: "destructive",
      });
      return;
    }

    assignMutation.mutate({
      userId: assignData.userId,
      role: assignData.role,
    });
  };

  const handleRemove = (userId: string, role: string) => {
    if (confirm(`Are you sure you want to remove the ${role} role from this user?`)) {
      removeMutation.mutate({ userId, role });
    }
  };

  const displayRole = selectedRole || (roleStats && roleStats.length > 0 ? roleStats[0].role : '');

  // DataTable columns configuration
  const columns: DataTableColumn<any>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (value) => <span className="font-medium">{(value as string) || '—'}</span>,
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
    },
    {
      key: 'userType',
      label: 'User Type',
      render: (value) => (
        <Badge variant="outline" className="badge-neutral">
          {(value as string) || 'employee'}
        </Badge>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (value) => (
        value ? (
          <Badge variant="outline" className="badge-success">Active</Badge>
        ) : (
          <Badge variant="outline" className="badge-neutral">Inactive</Badge>
        )
      ),
    },
    {
      key: 'assignedAt',
      label: 'Assigned At',
      sortable: true,
      render: (value) => value ? new Date(value as string).toLocaleDateString() : '—',
    },
    {
      key: 'userId',
      label: 'Actions',
      render: (_value, row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleRemove(row.userId as string, displayRole)}
        >
          <Trash2 className="icon-sm icon-destructive" aria-hidden="true" />
        </Button>
      ),
    },
  ];

  return (
    <div className="container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Role Management</h1>
          <p className="page-description">
            Manage user role assignments and permissions
          </p>
        </div>
        <Button onClick={() => setIsAssignDialogOpen(true)}>
          <Plus className="icon-sm" aria-hidden="true" />
          Assign Role
        </Button>
      </div>

      {/* Role Stats */}
      <div className="stats-grid">
        {roleStats?.map((stat) => (
          <Card key={stat.role}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.role}</CardTitle>
              <UserCog className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.count}</div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedRole(stat.role)}
                className="mt-2"
              >
                View Users
              </Button>
            </CardContent>
          </Card>
        ))}
        {(!roleStats || roleStats.length === 0) && (
          <Card>
            <CardContent className="empty-state">
              <UserCog className="icon-lg icon-muted" aria-hidden="true" />
              <p className="empty-state-title">No Roles Assigned</p>
              <p className="empty-state-description">
                Start by assigning roles to users
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Role Users Table */}
      {displayRole && (
        <Card>
          <CardHeader>
            <CardTitle>Users with {displayRole} Role</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={roleUsers || []}
              columns={columns}
              emptyState={{
                icon: UserCog,
                title: 'No users with this role',
                description: 'Assign roles to users to see them here',
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Assign Role Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Role to User</DialogTitle>
            <DialogDescription>
              Select a user and role to assign
            </DialogDescription>
          </DialogHeader>
          <div className="form-container">
            <div className="form-field">
              <Label htmlFor="user-search">Search User</Label>
              <div className="input-group">
                <Search className="input-icon" aria-hidden="true" />
                <Input
                  id="user-search"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-with-icon"
                />
              </div>
            </div>
            <div className="form-field">
              <Label htmlFor="user-select">User</Label>
              <Select value={assignData.userId} onValueChange={(value) => setAssignData({ ...assignData, userId: value })}>
                <SelectTrigger id="user-select">
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {allUsers?.users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="form-field">
              <Label htmlFor="role-select">Role</Label>
              <Select value={assignData.role} onValueChange={(value) => setAssignData({ ...assignData, role: value })}>
                <SelectTrigger id="role-select">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={assignMutation.isPending}>
              Assign Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
