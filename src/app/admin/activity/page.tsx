"use client";

import { useState } from "react";
import { api } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Shield, LogIn, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import {
  PageHeader,
  DataTable,
  StatsGrid,
  EmptyState,
  LoadingState,
  type DataTableColumn,
  type DataTableFilter,
  type StatItem,
} from "@/components/common";

export const dynamic = 'force-dynamic';

type LogType = 'admin' | 'security' | 'login';

export default function ActivityLogsPage() {
  const [activeTab, setActiveTab] = useState<LogType>('admin');

  // Get current user from tRPC (standardized auth pattern)
  const { data: _currentUser, isLoading: authLoading } = api.userProfile.getCurrentUser.useQuery();

  const { data: adminLogs, isLoading: isLoadingAdmin } =
    api.audit.getAdminLogs.useQuery(
      { limit: 50, offset: 0 },
      { enabled: activeTab === 'admin' }
    );

  const { data: securityLogs, isLoading: isLoadingSecurity } =
    api.audit.getSecurityLogs.useQuery(
      { limit: 50, offset: 0 },
      { enabled: activeTab === 'security' }
    );

  const { data: loginLogs, isLoading: isLoadingLogin } =
    api.audit.getLoginLogs.useQuery(
      { limit: 50, offset: 0 },
      { enabled: activeTab === 'login' }
    );

  const { data: stats } = api.audit.getActivityStats.useQuery({ days: 30 });

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  const handleRefresh = () => {
    // Invalidate queries for instant updates
    if (activeTab === 'admin') utils.audit.getAdminLogs.invalidate();
    if (activeTab === 'security') utils.audit.getSecurityLogs.invalidate();
    if (activeTab === 'login') utils.audit.getLoginLogs.invalidate();
  };

  const _isLoading =
    (activeTab === 'admin' && isLoadingAdmin) ||
    (activeTab === 'security' && isLoadingSecurity) ||
    (activeTab === 'login' && isLoadingLogin);

  const statsData: StatItem[] = stats ? [
    {
      title: 'Admin Actions',
      value: stats.adminLogsCount || 0,
      description: 'Last 30 days',
      icon: Activity,
      iconColor: 'primary',
    },
    {
      title: 'Security Events',
      value: stats.securityLogsCount || 0,
      description: 'Last 30 days',
      icon: Shield,
      iconColor: 'warning',
    },
    {
      title: 'Login Attempts',
      value: stats.loginLogsCount || 0,
      description: 'Last 30 days',
      icon: LogIn,
      iconColor: 'info',
    },
    {
      title: 'Failed Logins',
      value: stats.failedLoginsCount || 0,
      description: 'Last 30 days',
      icon: Shield,
      iconColor: 'destructive',
    },
  ] : [];

  const adminColumns: DataTableColumn<any>[] = [
    {
      key: 'createdAt',
      label: 'Timestamp',
      sortable: true,
      render: (value) => value ? format(new Date(value as string), 'MMM d, yyyy h:mm a') : '—',
    },
    {
      key: 'action',
      label: 'Action',
      render: (value) => <Badge variant="outline" className="badge-neutral">{value as string}</Badge>,
    },
    {
      key: 'userEmail',
      label: 'User',
      render: (value) => value as string || '—',
    },
    {
      key: 'resourceType',
      label: 'Resource',
      render: (value, row) => {
        // Map technical resource types to user-friendly names
        const resourceTypeMap: Record<string, string> = {
          'user_role': 'User Role',
          'user_profile': 'User Profile',
          'user_permission': 'User Permission',
          'sign_up': 'Sign-up Request',
        };

        const friendlyType = resourceTypeMap[value as string] || (value as string);

        // Get target user email from metadata if available
        const metadata = row.metadata as any;
        const targetEmail = metadata?.target_user_email;

        return (
          <div className="table-cell-stacked">
            <span className="table-cell-main">{friendlyType || '—'}</span>
            {targetEmail && (
              <span className="table-cell-sub">{targetEmail}</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'ipAddress',
      label: 'IP Address',
      render: (value) => value as string || '—',
    },
  ];

  const securityColumns: DataTableColumn<any>[] = [
    {
      key: 'eventTime',
      label: 'Timestamp',
      sortable: true,
      render: (value) => value ? format(new Date(value as string), 'MMM d, yyyy h:mm a') : '—',
    },
    {
      key: 'action',
      label: 'Action',
      render: (value) => <Badge variant="outline" className="badge-warning">{value as string}</Badge>,
    },
    {
      key: 'userEmail',
      label: 'User',
      render: (value) => value as string || '—',
    },
    {
      key: 'tableName',
      label: 'Table',
      render: (value) => value as string || '—',
    },
    {
      key: 'recordId',
      label: 'Record ID',
      render: (value) => value ? (value as string).substring(0, 8) : '—',
    },
    {
      key: 'ipAddress',
      label: 'IP Address',
      render: (value) => value?.toString() || '—',
    },
  ];

  const loginColumns: DataTableColumn<any>[] = [
    {
      key: 'loginTime',
      label: 'Timestamp',
      sortable: true,
      render: (value) => value ? format(new Date(value as string), 'MMM d, yyyy h:mm a') : '—',
    },
    {
      key: 'userName',
      label: 'User',
      render: (value) => value as string || '—',
    },
    {
      key: 'googleEmail',
      label: 'Email',
      render: (value) => value as string || '—',
    },
    {
      key: 'loginType',
      label: 'Type',
      render: (value) => (
        <Badge variant="outline" className="badge-neutral">
          {value as string || 'SSO'}
        </Badge>
      ),
    },
    {
      key: 'success',
      label: 'Status',
      render: (value) => value ? (
        <Badge variant="outline" className="badge-success">Success</Badge>
      ) : (
        <Badge variant="outline" className="badge-destructive">Failed</Badge>
      ),
    },
    {
      key: 'ipAddress',
      label: 'IP Address',
      render: (value) => value?.toString() || '—',
    },
  ];

  const filters: DataTableFilter[] = [
    {
      key: 'search',
      label: 'Search logs',
      type: 'search',
      placeholder: 'Search logs...',
    },
    {
      key: 'action',
      label: 'Action',
      type: 'select',
      options: [
        { value: 'all', label: 'All Actions' },
        { value: 'create', label: 'Create' },
        { value: 'update', label: 'Update' },
        { value: 'delete', label: 'Delete' },
        { value: 'login', label: 'Login' },
        { value: 'logout', label: 'Logout' },
      ],
    },
  ];

  // Handle auth loading
  if (authLoading) {
    return (
      <div className="page-container">
        <LoadingState message="Loading..." size="lg" />
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Activity Logs"
        subtitle="Monitor system activity, security events, and user logins"
        actions={[
          {
            label: 'Refresh',
            icon: RefreshCw,
            onClick: handleRefresh,
            variant: 'outline',
          },
        ]}
      />

      <StatsGrid stats={statsData} columns={4} />

      <Card>
        <CardHeader>
          <CardTitle>Activity Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as LogType)}>
            <TabsList className="tabs-list-full">
              <TabsTrigger value="admin">Admin Logs ({adminLogs?.total || 0})</TabsTrigger>
              <TabsTrigger value="security">Security Logs ({securityLogs?.total || 0})</TabsTrigger>
              <TabsTrigger value="login">Login Logs ({loginLogs?.total || 0})</TabsTrigger>
            </TabsList>

            <TabsContent value="admin">
              {isLoadingAdmin ? (
                <LoadingState message="Loading admin logs..." />
              ) : !adminLogs?.logs || adminLogs.logs.length === 0 ? (
                <EmptyState
                  icon={Activity}
                  title="No admin logs found"
                  description="No admin activity has been recorded."
                />
              ) : (
                <DataTable
                  data={adminLogs.logs}
                  columns={adminColumns}
                  filters={filters}
                  pagination={{ pageSize: 20, showSizeSelector: true }}
                  emptyState={{
                    icon: Activity,
                    title: 'No admin logs match your filters',
                    description: 'Try adjusting your search criteria',
                  }}
                />
              )}
            </TabsContent>

            <TabsContent value="security">
              {isLoadingSecurity ? (
                <LoadingState message="Loading security logs..." />
              ) : !securityLogs?.logs || securityLogs.logs.length === 0 ? (
                <EmptyState
                  icon={Shield}
                  title="No security logs found"
                  description="No security events have been recorded."
                />
              ) : (
                <DataTable
                  data={securityLogs.logs}
                  columns={securityColumns}
                  filters={filters}
                  pagination={{ pageSize: 20, showSizeSelector: true }}
                  emptyState={{
                    icon: Shield,
                    title: 'No security logs match your filters',
                    description: 'Try adjusting your search criteria',
                  }}
                />
              )}
            </TabsContent>

            <TabsContent value="login">
              {isLoadingLogin ? (
                <LoadingState message="Loading login logs..." />
              ) : !loginLogs?.logs || loginLogs.logs.length === 0 ? (
                <EmptyState
                  icon={LogIn}
                  title="No login logs found"
                  description="No login attempts have been recorded."
                />
              ) : (
                <DataTable
                  data={loginLogs.logs}
                  columns={loginColumns}
                  filters={filters}
                  pagination={{ pageSize: 20, showSizeSelector: true }}
                  emptyState={{
                    icon: LogIn,
                    title: 'No login logs match your filters',
                    description: 'Try adjusting your search criteria',
                  }}
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
