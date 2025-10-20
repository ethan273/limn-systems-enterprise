'use client';

import { useState } from 'react';
import Image from 'next/image';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, RefreshCw, User, Plus, Edit2, Check, X, Download } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { PermissionPanel } from './PermissionPanel';
import { CreateUserModal } from './CreateUserModal';
import { getUserFullName, getUserInitials as getInitials } from '@/lib/utils/user-utils';

const USER_TYPES = [
  { value: 'all', label: 'All Users' },
  { value: 'employee', label: 'Employees' },
  { value: 'contractor', label: 'Contractors' },
  { value: 'designer', label: 'Designers' },
  { value: 'manufacturer', label: 'Manufacturers' },
  { value: 'factory', label: 'Factory Users' },
  { value: 'qc_tester', label: 'QC Testers' },
  { value: 'finance', label: 'Finance' },
  { value: 'super_admin', label: 'Super Admins' },
] as const;

const EDITABLE_USER_TYPES = [
  { value: 'employee', label: 'Employee' },
  { value: 'contractor', label: 'Contractor' },
  { value: 'designer', label: 'Designer' },
  { value: 'manufacturer', label: 'Manufacturer' },
  { value: 'factory', label: 'Factory User' },
  { value: 'qc_tester', label: 'QC Tester' },
  { value: 'finance', label: 'Finance' },
  { value: 'super_admin', label: 'Super Admin' },
] as const;

export function UserManagementPanel() {
  const [search, setSearch] = useState('');
  const [selectedUserType, setSelectedUserType] = useState<string>('all');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<{
    userType: string;
    title: string;
    department: string;
  }>({ userType: '', title: '', department: '' });
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const userTypeFilter = selectedUserType === 'all' ? undefined : selectedUserType;

  const { data, isLoading, refetch } = api.admin.users.list.useQuery({
    search: search || undefined,
    userType: userTypeFilter as any,
    limit: 50,
    offset: 0,
  });

  const updateUserMutation = api.admin.users.update.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'User updated successfully!',
      });
      void refetch();
      setEditingUserId(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user',
        variant: 'destructive',
      });
    },
  });

  // Removed local getUserInitials function - now using utility function

  const handleEditUser = (user: NonNullable<typeof data>['users'][number]) => {
    setEditingUserId(user.id);
    setEditFormData({
      userType: user.userType,
      title: user.title || '',
      department: user.department || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingUserId) return;

    await updateUserMutation.mutateAsync({
      userId: editingUserId,
      data: {
        userType: editFormData.userType as any,
        title: editFormData.title || undefined,
        department: editFormData.department || undefined,
      },
    });
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditFormData({ userType: '', title: '', department: '' });
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    await updateUserMutation.mutateAsync({
      userId,
      data: {
        isActive: !currentStatus,
      },
    });
  };

  const handleExportCSV = () => {
    if (!data?.users || data.users.length === 0) {
      toast({
        title: 'No Data',
        description: 'No users to export',
        variant: 'destructive',
      });
      return;
    }

    const csv = [
      ['Email', 'Name', 'User Type', 'Title', 'Department', 'Status', 'Last Sign In'],
      ...data.users.map((user) => [
        user.email || '',
        getUserFullName(user) || '',
        user.userType.replace('_', ' '),
        user.title || '',
        user.department || '',
        user.isActive ? 'Active' : 'Inactive',
        user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleDateString() : 'Never',
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Success',
      description: `Exported ${data.users.length} users to CSV`,
    });
  };

  return (
    <div className="admin-panel-layout">
      {/* User List Section */}
      <div className="user-list-section">
        <Card className="user-list-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Users ({data?.total ?? 0})</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                  disabled={isLoading || !data?.users || data.users.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setCreateModalOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create User
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => void refetch()}
                  disabled={isLoading}
                >
                  <RefreshCw className={isLoading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search Bar */}
            <div className="user-search-bar">
              <Search className="user-search-icon" />
              <Input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="user-search-input"
              />
            </div>

            {/* User Type Tabs */}
            <div className="user-type-tabs">
              {USER_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setSelectedUserType(type.value)}
                  className={
                    selectedUserType === type.value
                      ? 'user-type-tab active'
                      : 'user-type-tab'
                  }
                >
                  {type.label}
                </button>
              ))}
            </div>

            {/* User List */}
            <div className="user-list">
              {isLoading ? (
                <div className="user-list-loading">
                  <div className="loading-spinner" />
                  <p>Loading users...</p>
                </div>
              ) : data?.users && data.users.length > 0 ? (
                data.users.map((user: NonNullable<typeof data>['users'][number]) => {
                  const isEditing = editingUserId === user.id;

                  return (
                    <div
                      key={user.id}
                      className={
                        selectedUserId === user.id
                          ? 'user-card selected'
                          : 'user-card'
                      }
                    >
                      <div className="user-card-content">
                        <div
                          className="user-avatar"
                          onClick={() => !isEditing && setSelectedUserId(user.id)}
                        >
                          {user.avatarUrl ? (
                            <Image
                              src={user.avatarUrl}
                              alt={getUserFullName(user) || user.email || ''}
                              width={40}
                              height={40}
                              className="rounded-full"
                            />
                          ) : (
                            <span>{getInitials(user)}</span>
                          )}
                        </div>

                        {isEditing ? (
                          <div className="user-edit-form">
                            <div className="user-email-static">{user.email}</div>
                            <div className="user-edit-fields">
                              <Select
                                value={editFormData.userType}
                                onValueChange={(value) => setEditFormData({ ...editFormData, userType: value })}
                              >
                                <SelectTrigger className="h-8 w-[140px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {EDITABLE_USER_TYPES.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                      {type.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Input
                                placeholder="Title"
                                value={editFormData.title}
                                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                                className="h-8"
                              />
                              <Input
                                placeholder="Department"
                                value={editFormData.department}
                                onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                                className="h-8"
                              />
                            </div>
                          </div>
                        ) : (
                          <div
                            className="user-info"
                            onClick={() => setSelectedUserId(user.id)}
                          >
                            <div className="user-email">{user.email}</div>
                            <div className="user-meta">
                              <span className={`user-type-badge ${user.userType.replace('_', '-')}`}>
                                {user.userType.replace('_', ' ')}
                              </span>
                              {user.title && <span className="user-title">{user.title}</span>}
                              {user.department && <span className="user-department">{user.department}</span>}
                            </div>
                          </div>
                        )}

                        <div className="user-actions">
                          {isEditing ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={handleSaveEdit}
                                disabled={updateUserMutation.isPending}
                              >
                                <Check className="h-4 w-4 text-success" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={handleCancelEdit}
                                disabled={updateUserMutation.isPending}
                              >
                                <X className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                  {user.isActive ? 'Active' : 'Inactive'}
                                </span>
                                <Switch
                                  checked={user.isActive}
                                  onCheckedChange={() => void handleToggleActive(user.id, user.isActive)}
                                  disabled={updateUserMutation.isPending}
                                />
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditUser(user);
                                }}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="user-list-empty">
                  <User className="h-12 w-12 text-muted-foreground" />
                  <p>No users found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Permission Panel Section */}
      <div className="permission-panel-section">
        {selectedUserId ? (
          <PermissionPanel userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
        ) : (
          <Card className="permission-panel-empty">
            <CardContent className="permission-empty-state">
              <User className="h-16 w-16 text-muted-foreground" />
              <p className="text-lg font-semibold">Select a user</p>
              <p className="text-sm text-muted-foreground">
                Choose a user from the list to view and manage their permissions
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create User Modal */}
      <CreateUserModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={() => void refetch()}
      />
    </div>
  );
}
