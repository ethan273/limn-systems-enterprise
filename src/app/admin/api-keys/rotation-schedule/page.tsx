'use client';

import { useState } from 'react';
import { api } from '@/lib/api/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  RefreshCw,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Plus,
  Search,
  Filter,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function RotationSchedulePage() {
  const [activeTab, setActiveTab] = useState<'active' | 'history' | 'settings'>('active');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch rotation schedule
  const { data: scheduleData, isLoading } = api.apiCredentials.getRotationSchedule.useQuery();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overdue':
        return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300';
      case 'upcoming':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300';
      case 'current':
        return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'overdue':
        return <AlertCircle className="h-4 w-4" />;
      case 'upcoming':
        return <Clock className="h-4 w-4" />;
      case 'current':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const filteredSchedule = scheduleData?.schedule.filter((item: any) =>
    item.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.serviceName.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Rotation Schedule</h1>
          <p className="page-description">
            Manage and automate your API credential rotation schedule
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Rotation
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading rotation schedule...</p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <RefreshCw className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">Total Scheduled</span>
              </div>
              <div className="text-3xl font-bold">{scheduleData?.total || 0}</div>
              <p className="text-sm text-muted-foreground mt-2">Active credentials</p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="h-5 w-5 text-warning" />
                <span className="text-sm font-medium text-muted-foreground">Upcoming (30d)</span>
              </div>
              <div className="text-3xl font-bold">{scheduleData?.upcoming || 0}</div>
              <p className="text-sm text-muted-foreground mt-2">Need rotation soon</p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <span className="text-sm font-medium text-muted-foreground">Overdue</span>
              </div>
              <div className="text-3xl font-bold">{scheduleData?.overdue || 0}</div>
              <p className="text-sm text-muted-foreground mt-2">Require attention</p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="h-5 w-5 text-success" />
                <span className="text-sm font-medium text-muted-foreground">Current</span>
              </div>
              <div className="text-3xl font-bold">{scheduleData?.current || 0}</div>
              <p className="text-sm text-muted-foreground mt-2">Up to date</p>
            </Card>
          </div>

          {/* Tabs */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-2">
              <Button
                variant={activeTab === 'active' ? 'default' : 'outline'}
                onClick={() => setActiveTab('active')}
              >
                Active Schedules
              </Button>
              <Button
                variant={activeTab === 'history' ? 'default' : 'outline'}
                onClick={() => setActiveTab('history')}
              >
                Rotation History
              </Button>
              <Button
                variant={activeTab === 'settings' ? 'default' : 'outline'}
                onClick={() => setActiveTab('settings')}
              >
                Default Settings
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search credentials..."
                  className="pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>

          {/* Active Schedules */}
          {activeTab === 'active' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Rotation Schedule</h2>

              {filteredSchedule.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-lg font-medium">No Scheduled Rotations</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {searchQuery ? 'No credentials match your search' : 'Add credentials to start scheduling rotations'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredSchedule.map((item: any) => {
                    const daysText = Math.abs(item.daysUntilRotation);
                    const overdueText = item.daysUntilRotation < 0
                      ? `${daysText} day${daysText !== 1 ? 's' : ''} overdue`
                      : `in ${daysText} day${daysText !== 1 ? 's' : ''}`;

                    return (
                      <div
                        key={item.id}
                        className="flex items-start justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium">{item.displayName}</h3>
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}
                            >
                              {getStatusIcon(item.status)}
                              {item.status}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{item.serviceName}</p>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Created</p>
                              <p className="font-medium">{formatDate(item.createdAt)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Last Used</p>
                              <p className="font-medium">
                                {item.lastUsedAt ? formatDate(item.lastUsedAt) : 'Never'}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Age</p>
                              <p className="font-medium">{item.daysOld} days</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Next Rotation</p>
                              <p className={`font-medium ${item.status === 'overdue' ? 'text-destructive' : ''}`}>
                                {overdueText}
                              </p>
                            </div>
                          </div>

                          {item.expiresAt && (
                            <div className="mt-3 flex items-center gap-2 text-sm">
                              <AlertCircle className="h-4 w-4 text-warning" />
                              <span className="text-muted-foreground">
                                Expires on {formatDate(item.expiresAt)}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 ml-4">
                          <Button size="sm">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Rotate Now
                          </Button>
                          <Button size="sm" variant="outline">
                            Edit Schedule
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          )}

          {/* Rotation History */}
          {activeTab === 'history' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Rotation History</h2>
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-lg font-medium">No Rotation History</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Credential rotation history will appear here
                </p>
              </div>
            </Card>
          )}

          {/* Default Settings */}
          {activeTab === 'settings' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Default Rotation Settings</h2>

              <div className="space-y-6 max-w-2xl">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Default Rotation Interval
                  </label>
                  <Select defaultValue="90">
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="60">60 days</SelectItem>
                      <SelectItem value="90">90 days (Recommended)</SelectItem>
                      <SelectItem value="180">180 days</SelectItem>
                      <SelectItem value="365">365 days</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground mt-1">
                    How often credentials should be rotated by default
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Notification Timing
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" defaultChecked />
                      <span className="text-sm">30 days before expiration</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" defaultChecked />
                      <span className="text-sm">14 days before expiration</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" defaultChecked />
                      <span className="text-sm">7 days before expiration</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" defaultChecked />
                      <span className="text-sm">3 days before expiration</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Auto-Rotation
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">Enable automatic credential rotation (when supported)</span>
                  </label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Automatically rotate credentials when the service API supports it
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button>Save Settings</Button>
                  <Button variant="outline">Reset to Defaults</Button>
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
