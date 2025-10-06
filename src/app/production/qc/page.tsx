"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardCheck,
  AlertCircle,
  CheckCircle2,
  Clock,
  Camera,
  Plus,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  PageHeader,
  EmptyState,
  LoadingState,
  DataTable,
  StatsGrid,
  type DataTableColumn,
  type DataTableFilter,
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
  const [statusFilter, _setStatusFilter] = useState<string>("all");
  const [searchQuery, _setSearchQuery] = useState("");

  // Fetch QC inspections
  const { data, isLoading } = api.qc.getAllInspections.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter as any,
    limit: 50,
    offset: 0,
  });

  const inspections = data?.inspections || [];

  const filteredInspections = inspections.filter((inspection) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      inspection.prototype_production?.prototypes?.name.toLowerCase().includes(searchLower) ||
      inspection.production_items?.item_name.toLowerCase().includes(searchLower) ||
      inspection.batch_id?.toLowerCase().includes(searchLower)
    );
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

  const filters: DataTableFilter[] = [
    {
      key: "status",
      label: "Status",
      type: "select",
      options: [
        { label: "All Statuses", value: "all" },
        { label: "Pending", value: "pending" },
        { label: "In Progress", value: "in_progress" },
        { label: "Passed", value: "passed" },
        { label: "Failed", value: "failed" },
        { label: "On Hold", value: "on_hold" },
      ],
    },
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
      key: "_count",
      label: "Defects",
      render: (value) => (
        <div className="flex items-center gap-1">
          <AlertCircle className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
          {(value as any)?.qc_defects || 0}
        </div>
      ),
    },
    {
      key: "_count",
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

  return (
    <div className="page-container">
      <PageHeader
        title="Quality Control"
        description="Mobile QC inspections and defect tracking"
        actions={[
          {
            label: "New Inspection",
            icon: Plus,
            onClick: () => router.push("/qc/new"),
          },
        ]}
      />

      <StatsGrid stats={stats} columns={4} />

      {isLoading ? (
        <LoadingState message="Loading inspections..." />
      ) : filteredInspections.length === 0 && !searchQuery ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No QC inspections found"
          description="Get started by creating your first inspection."
          action={{
            label: "New Inspection",
            icon: Plus,
            onClick: () => router.push("/qc/new"),
          }}
        />
      ) : (
        <DataTable
          data={filteredInspections}
          columns={columns}
          filters={filters}
          onRowClick={(row) => router.push(`/qc/${row.id}`)}
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
