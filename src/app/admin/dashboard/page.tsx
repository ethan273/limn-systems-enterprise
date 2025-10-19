"use client";

import React from "react";
import { api } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import { LoadingState } from "@/components/common";
import {
  Users,
  Activity,
  Shield,
  Settings,
  FileDown,
  UserCog,
  BarChart3,
  Clock,
  XCircle,
} from "lucide-react";
import Link from "next/link";

// Dynamic route configuration
export const dynamic = 'force-dynamic';

export default function AdminDashboardPage() {
  // Fetch overview data
  const { data: usersData, isLoading: isLoadingUsers } = api.admin.users.list.useQuery({ limit: 100, offset: 0 });
  const { data: activityStats, isLoading: isLoadingActivity } = api.audit.getActivityStats.useQuery({ days: 30 });
  const { data: roleStats, isLoading: isLoadingRoles } = api.admin.roles.getRoleStats.useQuery();
  const { data: exportStats, isLoading: isLoadingExport } = api.export.getExportStats.useQuery();

  if (isLoadingUsers || isLoadingActivity || isLoadingRoles || isLoadingExport) {
    return (
      <div className="page-container">
        <LoadingState message="Loading admin dashboard..." size="lg" />
      </div>
    );
  }

  const totalUsers = usersData?.total || 0;
  const activeUsers = usersData?.users.filter((u) => u.isActive).length || 0;
  const pendingApprovals = 0; // Can be fetched from approvals endpoint if needed

  return (
    <div className="container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-description">
            Administrative control center and system overview
          </p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="stats-grid-lg">
        <DashboardStatCard
          title="Total Users"
          value={totalUsers}
          description={`${activeUsers} active users`}
          icon={Users}
          iconColor="info"
        />

        <DashboardStatCard
          title="Activity Logs"
          value={activityStats?.adminLogsCount || 0}
          description="Last 30 days"
          icon={Activity}
          iconColor="primary"
        />

        <DashboardStatCard
          title="Security Events"
          value={activityStats?.securityLogsCount || 0}
          description="Last 30 days"
          icon={Shield}
          iconColor="warning"
        />

        <DashboardStatCard
          title="Failed Logins"
          value={activityStats?.failedLoginsCount || 0}
          description="Last 30 days"
          icon={XCircle}
          iconColor="destructive"
        />
      </div>

      {/* Quick Actions */}
      <div className="card-grid-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/admin/users">
                <Button variant="outline" className="w-full h-auto flex-col gap-2 p-4">
                  <Users className="icon-lg" aria-hidden="true" />
                  <span>Manage Users</span>
                </Button>
              </Link>
              <Link href="/admin/roles">
                <Button variant="outline" className="w-full h-auto flex-col gap-2 p-4">
                  <UserCog className="icon-lg" aria-hidden="true" />
                  <span>Manage Roles</span>
                </Button>
              </Link>
              <Link href="/admin/activity">
                <Button variant="outline" className="w-full h-auto flex-col gap-2 p-4">
                  <Activity className="icon-lg" aria-hidden="true" />
                  <span>View Activity</span>
                </Button>
              </Link>
              <Link href="/admin/settings">
                <Button variant="outline" className="w-full h-auto flex-col gap-2 p-4">
                  <Settings className="icon-lg" aria-hidden="true" />
                  <span>System Settings</span>
                </Button>
              </Link>
              <Link href="/admin/analytics">
                <Button variant="outline" className="w-full h-auto flex-col gap-2 p-4">
                  <BarChart3 className="icon-lg" aria-hidden="true" />
                  <span>Analytics</span>
                </Button>
              </Link>
              <Link href="/admin/export">
                <Button variant="outline" className="w-full h-auto flex-col gap-2 p-4">
                  <FileDown className="icon-lg" aria-hidden="true" />
                  <span>Export Data</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Role Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {roleStats && roleStats.length > 0 ? (
              <div className="list-container">
                {roleStats.slice(0, 6).map((stat) => (
                  <div key={stat.role} className="list-item">
                    <div className="list-item-main">
                      <UserCog className="icon-muted" aria-hidden="true" />
                      <span className="list-item-title">{stat.role}</span>
                    </div>
                    <Badge variant="outline" className="badge-info">
                      {stat.count}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p className="empty-state-title">No roles assigned</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <div className="card-grid-3">
        <Card>
          <CardHeader>
            <CardTitle>Pending Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="list-item">
                <div className="list-item-main">
                  <Clock className="icon-warning" aria-hidden="true" />
                  <span>Sign-up Approvals</span>
                </div>
                <Badge variant="outline" className="badge-warning">
                  {pendingApprovals}
                </Badge>
              </div>
              <Link href="/admin/approvals">
                <Button variant="outline" size="sm" className="w-full">
                  View Approvals
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Exportable Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="data-rows-container">
              <div className="data-row">
                <span className="stat-label">Users</span>
                <span className="stat-value-sm">{exportStats?.users || 0}</span>
              </div>
              <div className="data-row">
                <span className="stat-label">Admin Logs</span>
                <span className="stat-value-sm">{exportStats?.adminLogs || 0}</span>
              </div>
              <div className="data-row">
                <span className="stat-label">Security Logs</span>
                <span className="stat-value-sm">{exportStats?.securityLogs || 0}</span>
              </div>
              <div className="data-row">
                <span className="stat-label">Settings</span>
                <span className="stat-value-sm">{exportStats?.settings || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="data-rows-container">
              {activityStats?.recentActions?.slice(0, 5).map((action, index) => (
                <div key={index} className="data-row">
                  <span className="stat-label">{action.action || 'Unknown'}</span>
                  <span className="stat-value-sm">{action.count}</span>
                </div>
              ))}
              {(!activityStats?.recentActions || activityStats.recentActions.length === 0) && (
                <div className="empty-state">
                  <p className="empty-state-title">No recent activity</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
