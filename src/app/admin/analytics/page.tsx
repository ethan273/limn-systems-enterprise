"use client";

import React, { useState } from "react";
import { api } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Activity,
  Shield,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/common";

// Dynamic route configuration
export const dynamic = 'force-dynamic';

export default function AnalyticsDashboardPage() {
  const [timeRange, setTimeRange] = useState<number>(30);

  // Fetch activity stats
  const { data: stats, isLoading: isLoadingStats } = api.audit.getActivityStats.useQuery({
    days: timeRange,
  });

  // Fetch all users
  const { data: usersData, isLoading: isLoadingUsers } = api.admin.users.list.useQuery({
    limit: 100,
    offset: 0,
  });

  const activeUsers = usersData?.users.filter((u) => u.isActive).length || 0;
  const inactiveUsers = usersData?.users.filter((u) => !u.isActive).length || 0;
  const totalUsers = usersData?.total || 0;

  const isLoading = isLoadingStats || isLoadingUsers;

  // Prepare recently active users data
  const recentlyActiveUsers = usersData?.users
    ? usersData.users
        .filter((u) => u.lastSignInAt)
        .sort((a, b) => {
          const dateA = a.lastSignInAt ? new Date(a.lastSignInAt).getTime() : 0;
          const dateB = b.lastSignInAt ? new Date(b.lastSignInAt).getTime() : 0;
          return dateB - dateA;
        })
        .slice(0, 10)
    : [];

  // DataTable columns configuration
  const columns: DataTableColumn<any>[] = [
    {
      key: 'name',
      label: 'User',
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
      label: 'Type',
      render: (value) => (
        <Badge variant="outline" className="badge-neutral">
          {value as string}
        </Badge>
      ),
    },
    {
      key: 'department',
      label: 'Department',
      render: (value) => (value as string) || '—',
    },
    {
      key: 'lastSignInAt',
      label: 'Last Sign In',
      sortable: true,
      render: (value) => {
        if (!value) return '—';
        return (
          <div className="flex items-center gap-2">
            <Clock className="icon-sm icon-muted" aria-hidden="true" />
            <span>{new Date(value as string).toLocaleDateString()}</span>
          </div>
        );
      },
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
  ];

  return (
    <div className="container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics Dashboard</h1>
          <p className="page-description">
            System activity metrics and user analytics
          </p>
        </div>
        <div>
          <Select value={timeRange.toString()} onValueChange={(value) => setTimeRange(Number(value))}>
            <SelectTrigger className="select-trigger-compact">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="60">Last 60 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-state">Loading analytics...</div>
      ) : (
        <>
          {/* Overview Stats */}
          <div className="stats-grid-lg">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{totalUsers}</div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="badge-success">
                    {activeUsers} Active
                  </Badge>
                  <Badge variant="outline" className="badge-neutral">
                    {inactiveUsers} Inactive
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Admin Actions</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stats?.adminLogsCount || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Last {timeRange} days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Security Events</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stats?.securityLogsCount || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Last {timeRange} days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Login Attempts</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stats?.loginLogsCount || 0}</div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="icon-success" aria-hidden="true" />
                    <span className="text-xs text-muted-foreground">
                      {(stats?.loginLogsCount || 0) - (stats?.failedLoginsCount || 0)} Success
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <XCircle className="icon-destructive" aria-hidden="true" />
                    <span className="text-xs text-muted-foreground">{stats?.failedLoginsCount || 0} Failed</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Top Actions (Last {timeRange} days)</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </CardHeader>
              <CardContent>
                {stats?.recentActions && stats.recentActions.length > 0 ? (
                  <div className="list-container">
                    {stats.recentActions.map((action, index) => (
                      <div key={index} className="list-item">
                        <div className="list-item-main">
                          <Activity className="icon-muted" aria-hidden="true" />
                          <span className="list-item-title">{action.action || 'Unknown'}</span>
                        </div>
                        <Badge variant="outline" className="badge-neutral">
                          {action.count}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state-sm">No actions recorded</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Most Active Users (Last {timeRange} days)</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </CardHeader>
              <CardContent>
                {stats?.topUsers && stats.topUsers.length > 0 ? (
                  <div className="list-container">
                    {stats.topUsers.map((user, index) => (
                      <div key={index} className="list-item">
                        <div className="list-item-main">
                          <Users className="icon-muted" aria-hidden="true" />
                          <span className="list-item-title">{user.email || 'Unknown'}</span>
                        </div>
                        <Badge variant="outline" className="badge-info">
                          {user.count} actions
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state-sm">No user activity recorded</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* User Type Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>User Distribution by Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {usersData?.users && (
                  <>
                    <div className="stat-card">
                      <div className="stat-label">Employees</div>
                      <div className="stat-value-sm">
                        {usersData.users.filter((u) => u.userType === 'employee').length}
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">Contractors</div>
                      <div className="stat-value-sm">
                        {usersData.users.filter((u) => u.userType === 'contractor').length}
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">Designers</div>
                      <div className="stat-value-sm">
                        {usersData.users.filter((u) => u.userType === 'designer').length}
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">Manufacturers</div>
                      <div className="stat-value-sm">
                        {usersData.users.filter((u) => u.userType === 'manufacturer').length}
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">Finance</div>
                      <div className="stat-value-sm">
                        {usersData.users.filter((u) => u.userType === 'finance').length}
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">Customers</div>
                      <div className="stat-value-sm">
                        {usersData.users.filter((u) => u.userType === 'customer').length}
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">Super Admins</div>
                      <div className="stat-value-sm">
                        {usersData.users.filter((u) => u.userType === 'super_admin').length}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent User Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recently Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={recentlyActiveUsers}
                columns={columns}
                emptyState={{
                  icon: Users,
                  title: 'No users found',
                  description: 'No user activity recorded yet',
                }}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
