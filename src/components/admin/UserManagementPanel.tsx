'use client';

import { useState } from 'react';
import Image from 'next/image';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, RefreshCw, User } from 'lucide-react';
import { PermissionPanel } from './PermissionPanel';

const USER_TYPES = [
  { value: 'all', label: 'All Users' },
  { value: 'employee', label: 'Employees' },
  { value: 'contractor', label: 'Contractors' },
  { value: 'designer', label: 'Designers' },
  { value: 'manufacturer', label: 'Manufacturers' },
  { value: 'finance', label: 'Finance' },
  { value: 'super_admin', label: 'Super Admins' },
] as const;

export function UserManagementPanel() {
  const [search, setSearch] = useState('');
  const [selectedUserType, setSelectedUserType] = useState<string>('all');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const userTypeFilter = selectedUserType === 'all' ? undefined : selectedUserType;

  const { data, isLoading, refetch } = api.admin.users.list.useQuery({
    search: search || undefined,
    userType: userTypeFilter as any,
    limit: 50,
    offset: 0,
  });

  const getUserInitials = (name: string | null, email: string | null) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return '?';
  };

  return (
    <div className="admin-panel-layout">
      {/* User List Section */}
      <div className="user-list-section">
        <Card className="user-list-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Users ({data?.total ?? 0})</CardTitle>
              <Button
                variant="outline"
                size="icon"
                onClick={() => void refetch()}
                disabled={isLoading}
              >
                <RefreshCw className={isLoading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
              </Button>
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
                data.users.map((user: NonNullable<typeof data>['users'][number]) => (
                  <div
                    key={user.id}
                    className={
                      selectedUserId === user.id
                        ? 'user-card selected'
                        : 'user-card'
                    }
                    onClick={() => setSelectedUserId(user.id)}
                  >
                    <div className="user-card-content">
                      <div className="user-avatar">
                        {user.avatarUrl ? (
                          <Image
                            src={user.avatarUrl}
                            alt={user.name || user.email || ''}
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                        ) : (
                          <span>{getUserInitials(user.name, user.email)}</span>
                        )}
                      </div>
                      <div className="user-info">
                        <div className="user-email">{user.email}</div>
                        <div className="user-meta">
                          <span className={`user-type-badge ${user.userType.replace('_', '-')}`}>
                            {user.userType.replace('_', ' ')}
                          </span>
                          {user.title && <span className="user-title">{user.title}</span>}
                          {user.department && <span className="user-department">{user.department}</span>}
                        </div>
                      </div>
                      {!user.isActive && (
                        <span className="user-status-inactive">Inactive</span>
                      )}
                    </div>
                  </div>
                ))
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
    </div>
  );
}
