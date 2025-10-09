'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';
import { useQualityInspectionsRealtime } from '@/hooks/useRealtimeSubscription';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/common/EmptyState';
import {
  ClipboardCheck,
  Search,
  Filter,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
} from 'lucide-react';

/**
 * QC Portal Inspections Listing
 * Displays all quality inspections with search and filter
 */
export default function QCInspectionsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: inspectionsData, isLoading } = api.portal.getQCInspections.useQuery({
    limit: 100,
    offset: 0,
  });

  const inspections = inspectionsData?.inspections || [];

  // Subscribe to realtime updates for quality inspections
  useQualityInspectionsRealtime({
    queryKey: ['portal', 'getQCInspections'],
  });

  // Client-side filtering
  const filteredInspections = inspections.filter((inspection: any) => {
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
        inspection.inspector_name?.toLowerCase().includes(searchLower) ||
        inspection.notes?.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  const getStatusBadge = (passed: boolean | null) => {
    if (passed === null) {
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      );
    }
    return passed ? (
      <Badge className="badge-success flex items-center gap-1">
        <CheckCircle className="h-3 w-3" />
        Passed
      </Badge>
    ) : (
      <Badge className="badge-error flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        Failed
      </Badge>
    );
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Quality Inspections</h1>
        <p className="page-subtitle">View and manage all quality control inspections</p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search inspections by project, inspector, or notes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
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
            <ClipboardCheck className="h-5 w-5" />
            Inspections ({filteredInspections.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading inspections...
            </div>
          ) : filteredInspections.length === 0 ? (
            <EmptyState
              icon={ClipboardCheck}
              title="No inspections found"
              description={search || statusFilter !== 'all'
                ? "Try adjusting your search or filters"
                : "No inspections have been assigned yet"}
            />
          ) : (
            <div className="space-y-4">
              {filteredInspections.map((inspection: any) => (
                <div
                  key={inspection.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/portal/qc/inspections/${inspection.id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">
                          {inspection.manufacturer_projects?.project_name || 'Inspection'}
                        </h3>
                        {getStatusBadge(inspection.passed)}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Inspected: {formatDate(inspection.inspection_date)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      {inspection.defects_found !== null && inspection.defects_found > 0 && (
                        <div className="flex items-center gap-1 text-destructive mb-2">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            {inspection.defects_found} defect{inspection.defects_found !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Inspector:</span>
                      <span className="ml-2 font-medium">
                        {inspection.inspector_name || 'N/A'}
                      </span>
                    </div>
                    {inspection.notes && (
                      <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <span className="text-muted-foreground line-clamp-2">
                          {inspection.notes}
                        </span>
                      </div>
                    )}
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
