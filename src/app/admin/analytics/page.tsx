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
              <CardHeader className="card-header-compact">
                <div className="card-header-row">
                  <CardTitle className="card-title-sm">Total Users</CardTitle>
                  <Users className="icon-muted" aria-hidden="true" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="stat-value">{totalUsers}</div>
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
              <CardHeader className="card-header-compact">
                <div className="card-header-row">
                  <CardTitle className="card-title-sm">Admin Actions</CardTitle>
                  <Activity className="icon-muted" aria-hidden="true" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="stat-value">{stats?.adminLogsCount || 0}</div>
                <p className="stat-label">Last {timeRange} days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="card-header-compact">
                <div className="card-header-row">
                  <CardTitle className="card-title-sm">Security Events</CardTitle>
                  <Shield className="icon-muted" aria-hidden="true" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="stat-value">{stats?.securityLogsCount || 0}</div>
                <p className="stat-label">Last {timeRange} days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="card-header-compact">
                <div className="card-header-row">
                  <CardTitle className="card-title-sm">Login Attempts</CardTitle>
                  <TrendingUp className="icon-muted" aria-hidden="true" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="stat-value">{stats?.loginLogsCount || 0}</div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="icon-success" aria-hidden="true" />
                    <span className="stat-label">
                      {(stats?.loginLogsCount || 0) - (stats?.failedLoginsCount || 0)} Success
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <XCircle className="icon-destructive" aria-hidden="true" />
                    <span className="stat-label">{stats?.failedLoginsCount || 0} Failed</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Actions (Last {timeRange} days)</CardTitle>
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
              <CardHeader>
                <CardTitle>Most Active Users (Last {timeRange} days)</CardTitle>
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
              {usersData?.users && usersData.users.length > 0 ? (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Email</th>
                        <th>Type</th>
                        <th>Department</th>
                        <th>Last Sign In</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersData.users
                        .filter((u) => u.lastSignInAt)
                        .sort((a, b) => {
                          const dateA = a.lastSignInAt ? new Date(a.lastSignInAt).getTime() : 0;
                          const dateB = b.lastSignInAt ? new Date(b.lastSignInAt).getTime() : 0;
                          return dateB - dateA;
                        })
                        .slice(0, 10)
                        .map((user) => (
                          <tr key={user.id}>
                            <td>{user.name || '—'}</td>
                            <td>{user.email}</td>
                            <td>
                              <Badge variant="outline" className="badge-neutral">
                                {user.userType}
                              </Badge>
                            </td>
                            <td>{user.department || '—'}</td>
                            <td>
                              {user.lastSignInAt ? (
                                <div className="flex items-center gap-2">
                                  <Clock className="icon-sm icon-muted" aria-hidden="true" />
                                  <span>
                                    {new Date(user.lastSignInAt).toLocaleDateString()}
                                  </span>
                                </div>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td>
                              {user.isActive ? (
                                <Badge variant="outline" className="badge-success">Active</Badge>
                              ) : (
                                <Badge variant="outline" className="badge-neutral">Inactive</Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">No users found</div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
