"use client";

import React, { useState } from "react";
import { api } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileDown, Download, Database, Users, Activity, Settings as SettingsIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";

// Dynamic route configuration
export const dynamic = 'force-dynamic';

type ExportType = 'users' | 'admin-logs' | 'security-logs' | 'login-logs' | 'settings';
type ExportFormat = 'csv' | 'json';

export default function DataExportPage() {
  const [exportType, setExportType] = useState<ExportType>('users');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');

  // Fetch export stats
  const { data: stats } = api.export.getExportStats.useQuery();

  // Export mutations
  const exportUsersMutation = api.export.exportUsers.useMutation({
    onSuccess: (data) => {
      downloadFile(data.data, data.filename, data.format);
      toast({
        title: "Success",
        description: "Data exported successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to export data",
        variant: "destructive",
      });
    },
  });

  const exportLogsMutation = api.export.exportActivityLogs.useMutation({
    onSuccess: (data) => {
      downloadFile(data.data, data.filename, data.format);
      toast({
        title: "Success",
        description: "Logs exported successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to export logs",
        variant: "destructive",
      });
    },
  });

  const exportSettingsMutation = api.export.exportSettings.useMutation({
    onSuccess: (data) => {
      downloadFile(data.data, data.filename, data.format);
      toast({
        title: "Success",
        description: "Settings exported successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to export settings",
        variant: "destructive",
      });
    },
  });

  const downloadFile = (data: string, filename: string, format: string) => {
    const blob = new Blob([data], { type: format === 'csv' ? 'text/csv' : 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    if (exportType === 'users') {
      exportUsersMutation.mutate({ format: exportFormat });
    } else if (exportType === 'admin-logs') {
      exportLogsMutation.mutate({ format: exportFormat, logType: 'admin', limit: 1000 });
    } else if (exportType === 'security-logs') {
      exportLogsMutation.mutate({ format: exportFormat, logType: 'security', limit: 1000 });
    } else if (exportType === 'login-logs') {
      exportLogsMutation.mutate({ format: exportFormat, logType: 'login', limit: 1000 });
    } else if (exportType === 'settings') {
      exportSettingsMutation.mutate({ format: exportFormat });
    }
  };

  const isExporting = exportUsersMutation.isPending || exportLogsMutation.isPending || exportSettingsMutation.isPending;

  return (
    <div className="container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Data Export</h1>
          <p className="page-description">
            Export system data in CSV or JSON format
          </p>
        </div>
      </div>

      {/* Export Stats */}
      <div className="stats-grid">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats?.users || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Total records</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Admin Logs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats?.adminLogs || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Total records</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Security Logs</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats?.securityLogs || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Total records</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Settings</CardTitle>
            <SettingsIcon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats?.settings || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Total records</p>
          </CardContent>
        </Card>
      </div>

      {/* Export Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Export Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-field">
              <label className="form-label">Data Type</label>
              <Select value={exportType} onValueChange={(value) => setExportType(value as ExportType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="users">
                    <div className="flex items-center gap-2">
                      <Users className="icon-sm" aria-hidden="true" />
                      <span>Users</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="admin-logs">
                    <div className="flex items-center gap-2">
                      <Activity className="icon-sm" aria-hidden="true" />
                      <span>Admin Logs</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="security-logs">
                    <div className="flex items-center gap-2">
                      <Database className="icon-sm" aria-hidden="true" />
                      <span>Security Logs</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="login-logs">
                    <div className="flex items-center gap-2">
                      <Activity className="icon-sm" aria-hidden="true" />
                      <span>Login Logs</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="settings">
                    <div className="flex items-center gap-2">
                      <SettingsIcon className="icon-sm" aria-hidden="true" />
                      <span>System Settings</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="form-field">
              <label className="form-label">Export Format</label>
              <Select value={exportFormat} onValueChange={(value) => setExportFormat(value as ExportFormat)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">
                    <div className="flex items-center gap-2">
                      <FileDown className="icon-sm" aria-hidden="true" />
                      <span>CSV (Comma-Separated)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="json">
                    <div className="flex items-center gap-2">
                      <FileDown className="icon-sm" aria-hidden="true" />
                      <span>JSON (JavaScript Object)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between mt-6 p-4 card rounded-lg">
            <div>
              <p className="font-medium">Ready to export</p>
              <p className="text-sm text-muted-foreground">
                Click the button to download your data
              </p>
            </div>
            <Button onClick={handleExport} disabled={isExporting} size="lg">
              <Download className="icon-sm" aria-hidden="true" />
              {isExporting ? 'Exporting...' : 'Export Data'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Export Templates */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="card-title-sm">Quick Export: Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="badge-info">
                  {stats?.users || 0} records
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setExportType('users');
                    setExportFormat('csv');
                    exportUsersMutation.mutate({ format: 'csv' });
                  }}
                  disabled={isExporting}
                >
                  CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setExportType('users');
                    setExportFormat('json');
                    exportUsersMutation.mutate({ format: 'json' });
                  }}
                  disabled={isExporting}
                >
                  JSON
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="card-title-sm">Quick Export: Admin Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="badge-info">
                  {stats?.adminLogs || 0} records
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setExportType('admin-logs');
                    setExportFormat('csv');
                    exportLogsMutation.mutate({ format: 'csv', logType: 'admin', limit: 1000 });
                  }}
                  disabled={isExporting}
                >
                  CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setExportType('admin-logs');
                    setExportFormat('json');
                    exportLogsMutation.mutate({ format: 'json', logType: 'admin', limit: 1000 });
                  }}
                  disabled={isExporting}
                >
                  JSON
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="card-title-sm">Quick Export: Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="badge-info">
                  {stats?.settings || 0} records
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setExportType('settings');
                    setExportFormat('csv');
                    exportSettingsMutation.mutate({ format: 'csv' });
                  }}
                  disabled={isExporting}
                >
                  CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setExportType('settings');
                    setExportFormat('json');
                    exportSettingsMutation.mutate({ format: 'json' });
                  }}
                  disabled={isExporting}
                >
                  JSON
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
