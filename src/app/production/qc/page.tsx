"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { Badge } from "@/components/ui/badge";
import { useQualityInspectionsRealtime } from "@/hooks/useRealtimeSubscription";
import { useTableState } from "@/hooks/useTableFilters";
import {
  ClipboardCheck,
  AlertCircle,
  CheckCircle2,
  Clock,
  Camera,
  Plus,
  XCircle,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  PageHeader,
  EmptyState,
  LoadingState,
  DataTable,
  StatsGrid,
  TableFilters,
  type DataTableColumn,
  type StatItem,
} from "@/components/common";

// Dynamic route configuration
export const dynamic = 'force-dynamic';

const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  pending: {
    label: "Pending",
    className: "badge-neutral",
    icon: <Clock className="w-3 h-3" aria-hidden="true" />,
  },
  in_progress: {
    label: "In Progress",
    className: "bg-info-muted text-info border-info",
    icon: <ClipboardCheck className="w-3 h-3" aria-hidden="true" />,
  },
  passed: {
    label: "Passed",
    className: "bg-success-muted text-success border-success",
    icon: <CheckCircle2 className="w-3 h-3" aria-hidden="true" />,
  },
  failed: {
    label: "Failed",
    className: "bg-destructive-muted text-destructive border-destructive",
    icon: <XCircle className="w-3 h-3" aria-hidden="true" />,
  },
  on_hold: {
    label: "On Hold",
    className: "bg-warning-muted text-warning border-warning",
    icon: <AlertCircle className="w-3 h-3" aria-hidden="true" />,
  },
};

export default function QCInspectionsPage() {
  const router = useRouter();

  // Unified filter management with new hook
  const {
    rawFilters,
    setFilter,
    clearFilters,
    hasActiveFilters,
    queryParams,
  } = useTableState({
    initialFilters: {
      status: '',
    },
    debounceMs: 300,
    pageSize: 50,
  });

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  // Fetch QC inspections - backend filtering only
  const { data, isLoading, error } = api.qc.getAllInspections.useQuery({
    ...queryParams,
    status: (rawFilters.status || undefined) as 'pending' | 'in_progress' | 'passed' | 'failed' | 'on_hold' | undefined,
  });

  const inspections = data?.inspections || [];

  // Subscribe to realtime updates for quality inspections
  useQualityInspectionsRealtime({
    queryKey: ['qc', 'getAllInspections'],
  });

  const stats: StatItem[] = [
    {
      title: "Total",
      value: inspections.length,
      description: "All inspections",
      icon: ClipboardCheck,
      iconColor: 'primary',
    },
    {
      title: "Pending",
      value: inspections.filter((i) => i.status === "pending").length,
      description: "Awaiting inspection",
      icon: Clock,
      iconColor: 'warning',
    },
    {
      title: "In Progress",
      value: inspections.filter((i) => i.status === "in_progress").length,
      description: "Currently inspecting",
      icon: ClipboardCheck,
      iconColor: 'info',
    },
    {
      title: "Passed",
      value: inspections.filter((i) => i.status === "passed").length,
      description: "Quality approved",
      icon: CheckCircle2,
      iconColor: 'success',
    },
    {
      title: "Failed",
      value: inspections.filter((i) => i.status === "failed").length,
      description: "Requires rework",
      icon: XCircle,
      iconColor: 'destructive',
    },
  ];

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'passed', label: 'Passed' },
    { value: 'failed', label: 'Failed' },
    { value: 'on_hold', label: 'On Hold' },
  ];

  const columns: DataTableColumn<typeof inspections[0]>[] = [
    {
      key: "prototype_production",
      label: "Item/Prototype",
      render: (_, row) => (
        <div>
          <p className="font-medium">
            {row.prototype_production?.prototypes?.name ||
              row.production_items?.item_name ||
              "—"}
          </p>
          {row.prototype_production && (
            <p className="text-sm text-muted-foreground">
              {row.prototype_production.prototypes?.prototype_number}
            </p>
          )}
          {row.batch_id && (
            <p className="text-sm text-muted-foreground">
              Batch: {row.batch_id}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "qc_stage",
      label: "QC Stage",
      render: (value) => (
        <Badge variant="outline" className="capitalize">
          {(value as string).replace(/_/g, " ")}
        </Badge>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (value) => {
        // eslint-disable-next-line security/detect-object-injection
        const config = statusConfig[value as string] || statusConfig.pending;
        return (
          <Badge variant="outline" className={cn(config.className, "flex items-center gap-1 w-fit")}>
            {config.icon}
            {config.label}
          </Badge>
        );
      },
    },
    {
      key: "defects_count",
      label: "Defects",
      render: (value) => (
        <div className="flex items-center gap-1">
          <AlertCircle className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
          {(value as any)?.qc_defects || 0}
        </div>
      ),
    },
    {
      key: "photos_count",
      label: "Photos",
      render: (value) => (
        <div className="flex items-center gap-1">
          <Camera className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
          {(value as any)?.qc_photos || 0}
        </div>
      ),
    },
    {
      key: "priority",
      label: "Priority",
      render: (value) => (
        <Badge
          variant="outline"
          className={cn(
            "capitalize",
            value === "high" && "bg-destructive-muted text-destructive border-destructive",
            value === "normal" && "bg-info-muted text-info border-info",
            value === "low" && "badge-neutral"
          )}
        >
          {value as string}
        </Badge>
      ),
    },
    {
      key: "started_at",
      label: "Started",
      render: (value) =>
        value ? format(new Date(value as string), "MMM d, yyyy") : "—",
    },
  ];

  // Handle query error
  if (error) {
    return (
      <div className="page-container">
        <PageHeader
          title="Quality Control"
          description="Mobile QC inspections and defect tracking"
        />
        <EmptyState
          icon={AlertTriangle}
          title="Failed to load QC inspections"
          description={error.message || "An unexpected error occurred. Please try again."}
          action={{
            label: 'Try Again',
            onClick: () => utils.qc.getAllInspections.invalidate(),
            icon: RefreshCw,
          }}
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Quality Control"
        description="Mobile QC inspections and defect tracking"
        actions={[
          {
            label: "New Inspection",
            icon: Plus,
            onClick: () => router.push("/production/qc/new"),
          },
        ]}
      />

      <StatsGrid stats={stats} columns={4} />

      {/* Filters - New Unified System */}
      <TableFilters.Bar
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
      >
        {/* Status Filter */}
        <TableFilters.Select
          value={rawFilters.status}
          onChange={(value) => setFilter('status', value)}
          options={statusOptions}
          placeholder="All Statuses"
        />
      </TableFilters.Bar>

      {/* QC Inspections DataTable - No filters prop (server-side only) */}
      {isLoading ? (
        <LoadingState message="Loading inspections..." />
      ) : inspections.length === 0 && !hasActiveFilters ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No QC inspections found"
          description="Get started by creating your first inspection."
          action={{
            label: "New Inspection",
            icon: Plus,
            onClick: () => router.push("/production/qc/new"),
          }}
        />
      ) : (
        <DataTable
          data={inspections}
          columns={columns}
          onRowClick={(row) => router.push(`/production/qc/${row.id}`)}
          pagination={{ pageSize: 20, showSizeSelector: true }}
          emptyState={{
            icon: ClipboardCheck,
            title: "No inspections found",
            description: "Try adjusting your search criteria.",
          }}
        />
      )}
    </div>
  );
}
