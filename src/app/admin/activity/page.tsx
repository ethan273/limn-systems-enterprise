"use client";

import React, { useState } from "react";
import { api } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Activity, Shield, LogIn, Search, Filter, RefreshCw } from "lucide-react";
import { format } from "date-fns";

// Dynamic route configuration
export const dynamic = 'force-dynamic';

type LogType = 'admin' | 'security' | 'login';

export default function ActivityLogsPage() {
  const [activeTab, setActiveTab] = useState<LogType>('admin');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');

  // Fetch admin logs
  const { data: adminLogs, isLoading: isLoadingAdmin, refetch: refetchAdmin } =
    api.audit.getAdminLogs.useQuery(
      {
        search: searchQuery || undefined,
        action: actionFilter === 'all' ? undefined : actionFilter || undefined,
        limit: 50,
        offset: 0,
      },
      { enabled: activeTab === 'admin' }
    );

  // Fetch security logs
  const { data: securityLogs, isLoading: isLoadingSecurity, refetch: refetchSecurity } =
    api.audit.getSecurityLogs.useQuery(
      {
        search: searchQuery || undefined,
        action: actionFilter === 'all' ? undefined : actionFilter || undefined,
        limit: 50,
        offset: 0,
      },
      { enabled: activeTab === 'security' }
    );

  // Fetch login logs
  const { data: loginLogs, isLoading: isLoadingLogin, refetch: refetchLogin } =
    api.audit.getLoginLogs.useQuery(
      {
        search: searchQuery || undefined,
        limit: 50,
        offset: 0,
      },
      { enabled: activeTab === 'login' }
    );

  // Fetch activity stats
  const { data: stats } = api.audit.getActivityStats.useQuery({ days: 30 });

  const handleRefresh = () => {
    if (activeTab === 'admin') refetchAdmin();
    if (activeTab === 'security') refetchSecurity();
    if (activeTab === 'login') refetchLogin();
  };

  const isLoading =
    (activeTab === 'admin' && isLoadingAdmin) ||
    (activeTab === 'security' && isLoadingSecurity) ||
    (activeTab === 'login' && isLoadingLogin);

  return (
    <div className="container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Activity Logs</h1>
          <p className="page-description">
            Monitor system activity, security events, and user logins
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <Card>
          <CardHeader className="card-header-compact">
            <div className="card-header-row">
              <CardTitle className="card-title-sm">Admin Actions</CardTitle>
              <Activity className="icon-muted" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{stats?.adminLogsCount || 0}</div>
            <p className="stat-label">Last 30 days</p>
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
            <p className="stat-label">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-compact">
            <div className="card-header-row">
              <CardTitle className="card-title-sm">Login Attempts</CardTitle>
              <LogIn className="icon-muted" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{stats?.loginLogsCount || 0}</div>
            <p className="stat-label">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-compact">
            <div className="card-header-row">
              <CardTitle className="card-title-sm">Failed Logins</CardTitle>
              <Shield className="icon-destructive" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="stat-value-destructive">{stats?.failedLoginsCount || 0}</div>
            <p className="stat-label">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Logs Tabs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Activity Logs</CardTitle>
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="input-group">
                <Search className="input-icon" aria-hidden="true" />
                <Input
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-with-icon"
                />
              </div>

              {/* Action Filter */}
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="select-trigger-compact">
                  <Filter className="icon-sm" aria-hidden="true" />
                  <SelectValue placeholder="Filter by action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="logout">Logout</SelectItem>
                </SelectContent>
              </Select>

              {/* Refresh */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={`icon-sm ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as LogType)}>
            <TabsList className="tabs-list-full">
              <TabsTrigger value="admin">Admin Logs ({adminLogs?.total || 0})</TabsTrigger>
              <TabsTrigger value="security">Security Logs ({securityLogs?.total || 0})</TabsTrigger>
              <TabsTrigger value="login">Login Logs ({loginLogs?.total || 0})</TabsTrigger>
            </TabsList>

            {/* Admin Logs */}
            <TabsContent value="admin">
              {isLoadingAdmin ? (
                <div className="loading-state">Loading admin logs...</div>
              ) : adminLogs?.logs.length === 0 ? (
                <div className="empty-state">No admin logs found</div>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>Action</th>
                        <th>User</th>
                        <th>Resource</th>
                        <th>IP Address</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminLogs?.logs.map((log) => (
                        <tr key={log.id}>
                          <td>
                            {log.createdAt ? format(new Date(log.createdAt), 'MMM d, yyyy h:mm a') : '—'}
                          </td>
                          <td>
                            <Badge variant="outline" className="badge-neutral">
                              {log.action}
                            </Badge>
                          </td>
                          <td>{log.userEmail || '—'}</td>
                          <td>
                            <div className="table-cell-stacked">
                              <span className="table-cell-main">{log.resourceType || '—'}</span>
                              {log.resourceId && (
                                <span className="table-cell-sub">{log.resourceId}</span>
                              )}
                            </div>
                          </td>
                          <td>{log.ipAddress || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            {/* Security Logs */}
            <TabsContent value="security">
              {isLoadingSecurity ? (
                <div className="loading-state">Loading security logs...</div>
              ) : securityLogs?.logs.length === 0 ? (
                <div className="empty-state">No security logs found</div>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>Action</th>
                        <th>User</th>
                        <th>Table</th>
                        <th>Record ID</th>
                        <th>IP Address</th>
                      </tr>
                    </thead>
                    <tbody>
                      {securityLogs?.logs.map((log) => (
                        <tr key={log.id}>
                          <td>
                            {log.eventTime ? format(new Date(log.eventTime), 'MMM d, yyyy h:mm a') : '—'}
                          </td>
                          <td>
                            <Badge variant="outline" className="badge-warning">
                              {log.action}
                            </Badge>
                          </td>
                          <td>{log.userEmail || '—'}</td>
                          <td>{log.tableName || '—'}</td>
                          <td className="table-cell-mono">{log.recordId ? log.recordId.substring(0, 8) : '—'}</td>
                          <td>{log.ipAddress?.toString() || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            {/* Login Logs */}
            <TabsContent value="login">
              {isLoadingLogin ? (
                <div className="loading-state">Loading login logs...</div>
              ) : loginLogs?.logs.length === 0 ? (
                <div className="empty-state">No login logs found</div>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>User</th>
                        <th>Email</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>IP Address</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loginLogs?.logs.map((log) => (
                        <tr key={log.id}>
                          <td>
                            {log.loginTime ? format(new Date(log.loginTime), 'MMM d, yyyy h:mm a') : '—'}
                          </td>
                          <td>{log.userName || '—'}</td>
                          <td>{log.googleEmail || '—'}</td>
                          <td>
                            <Badge variant="outline" className="badge-neutral">
                              {log.loginType || 'SSO'}
                            </Badge>
                          </td>
                          <td>
                            {log.success ? (
                              <Badge variant="outline" className="badge-success">Success</Badge>
                            ) : (
                              <Badge variant="outline" className="badge-destructive">Failed</Badge>
                            )}
                          </td>
                          <td>{log.ipAddress?.toString() || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
