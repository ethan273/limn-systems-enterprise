'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import {
  History,
  Search,
  Filter,
  Calendar,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

/**
 * QC Portal History
 * View complete history of all inspections
 */
export default function QCHistoryPage() {
  const router = useRouter();
  const utils = api.useUtils();
  const [search, setSearch] = useState('');
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: inspectionsData, isLoading, error } = api.portal.getQCInspections.useQuery({
    limit: 100,
    offset: 0,
  });

  const inspections = inspectionsData?.inspections || [];

  // Calculate statistics
  const totalInspections = inspections.length;
  const passedInspections = inspections.filter((i: any) => i.passed === true).length;
  const failedInspections = inspections.filter((i: any) => i.passed === false).length;
  const passRate = totalInspections > 0 ? ((passedInspections / totalInspections) * 100).toFixed(1) : '0';

  // Filter inspections
  const filteredInspections = inspections.filter((inspection: any) => {
    // Time filter
    if (timeFilter !== 'all') {
      const inspectionDate = new Date(inspection.inspection_date);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - inspectionDate.getTime()) / (1000 * 60 * 60 * 24));

      if (timeFilter === '7days' && daysDiff > 7) return false;
      if (timeFilter === '30days' && daysDiff > 30) return false;
      if (timeFilter === '90days' && daysDiff > 90) return false;
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'pending' && inspection.passed !== null) return false;
      if (statusFilter === 'passed' && inspection.passed !== true) return false;
      if (statusFilter === 'failed' && inspection.passed !== false) return false;
    }

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        inspection.manufacturer_projects?.project_name?.toLowerCase().includes(searchLower) ||
        inspection.inspector_name?.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  const getStatusBadge = (passed: boolean | null) => {
    if (passed === null) {
      return <Badge variant="outline">Pending</Badge>;
    }
    return passed ? (
      <Badge className="badge-success">Passed</Badge>
    ) : (
      <Badge className="badge-error">Failed</Badge>
    );
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Handle query error
  if (error) {
    return (
      <div className="page-container">
        <PageHeader
          title="Inspection History"
          subtitle="Complete record of all quality inspections"
        />
        <EmptyState
          icon={AlertTriangle}
          title="Failed to load inspection history"
          description={error.message || "An unexpected error occurred. Please try again."}
          action={{
            label: 'Try Again',
            onClick: () => utils.portal.getQCInspections.invalidate(),
            icon: RefreshCw,
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Inspection History</h1>
        <p className="page-subtitle">Complete record of all quality inspections</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inspections</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInspections}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Passed</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{passedInspections}</div>
            <p className="text-xs text-muted-foreground">Quality approved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{failedInspections}</div>
            <p className="text-xs text-muted-foreground">Issues found</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
            {parseFloat(passRate) >= 80 ? (
              <TrendingUp className="h-4 w-4 text-success" />
            ) : (
              <TrendingDown className="h-4 w-4 text-destructive" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${parseFloat(passRate) >= 80 ? 'text-success' : 'text-destructive'}`}>
              {passRate}%
            </div>
            <p className="text-xs text-muted-foreground">Overall quality</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search inspections..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Time period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="90days">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="passed">Passed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Inspections List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Inspection Records ({filteredInspections.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading inspection history...
            </div>
          ) : filteredInspections.length === 0 ? (
            <EmptyState
              icon={History}
              title="No inspections found"
              description={search || timeFilter !== 'all' || statusFilter !== 'all'
                ? "Try adjusting your search or filters"
                : "No inspection history available"}
            />
          ) : (
            <div className="space-y-3">
              {filteredInspections.map((inspection: any) => (
                <div
                  key={inspection.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/portal/qc/inspections/${inspection.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-medium">
                          {inspection.manufacturer_projects?.project_name || 'Inspection'}
                        </h3>
                        {getStatusBadge(inspection.passed)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(inspection.inspection_date)}
                        </span>
                        <span>Inspector: {inspection.inspector_name || 'N/A'}</span>
                        {inspection.defects_found > 0 && (
                          <span className="flex items-center gap-1 text-destructive">
                            <AlertTriangle className="h-3 w-3" />
                            {inspection.defects_found} defect{inspection.defects_found !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
