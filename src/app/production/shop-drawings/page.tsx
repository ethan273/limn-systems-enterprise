"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Building2,
  Package,
  Plus,
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
  type DataTableColumn,
  type DataTableFilter,
  type StatItem,
} from "@/components/common";

// Status badge configuration
const statusConfig: Record<string, {
  label: string;
  className: string;
}> = {
  in_review: {
    label: "In Review",
    className: "bg-warning-muted text-warning border-warning"
  },
  designer_approved: {
    label: "Designer Approved",
    className: "bg-info-muted text-info border-info"
  },
  approved: {
    label: "Approved",
    className: "bg-success-muted text-success border-success"
  },
  rejected: {
    label: "Rejected",
    className: "bg-destructive-muted text-destructive border-destructive"
  },
  revision_requested: {
    label: "Revision Requested",
    className: "bg-orange-100 text-warning border-orange-300"
  }
};

export default function ShopDrawingsPage() {
  const router = useRouter();
  const [searchQuery, _setSearchQuery] = useState("");
  const [orderFilter, _setOrderFilter] = useState<string>("all");
  const [factoryFilter, _setFactoryFilter] = useState<string>("all");
  const [statusFilter, _setStatusFilter] = useState<string>("all");
  const [page, _setPage] = useState(0);
  const limit = 20;
  const utils = api.useUtils();

  // Fetch shop drawings with filters
  const { data, isLoading, error } = api.shopDrawings.getAll.useQuery({
    productionOrderId: orderFilter === "all" ? undefined : orderFilter,
    factoryId: factoryFilter === "all" ? undefined : factoryFilter,
    status: statusFilter === "all" ? undefined : statusFilter,
    search: searchQuery || undefined,
    limit,
    offset: page * limit,
  });

  // Fetch production orders for filter
  const { data: ordersData, error: ordersError } = api.productionOrders.getAll.useQuery({
    limit: 100,
  });

  // Fetch factories for filter
  const { data: factoriesData, error: factoriesError } = api.partners.getAll.useQuery({
    type: "factory",
    limit: 100,
  });

  const drawings = data?.drawings ?? [];
  const total = data?.total ?? 0;
  const _hasMore = data?.hasMore ?? false;

  const stats: StatItem[] = [
    {
      title: "Total Drawings",
      value: drawings.length,
      description: "All shop drawings",
      icon: FileText,
      iconColor: 'primary',
    },
    {
      title: "Pending Review",
      value: drawings.filter(d => d.status === 'in_review' || d.status === 'designer_approved').length,
      description: "Awaiting approval",
      icon: FileText,
      iconColor: 'warning',
    },
    {
      title: "Approved",
      value: drawings.filter(d => d.status === 'approved').length,
      description: "Ready for production",
      icon: FileText,
      iconColor: 'success',
    },
    {
      title: "Rejected",
      value: drawings.filter(d => d.status === 'rejected' || d.status === 'revision_requested').length,
      description: "Needs revision",
      icon: FileText,
      iconColor: 'destructive',
    },
  ];

  const filters: DataTableFilter[] = [
    {
      key: "order",
      label: "Production Order",
      type: "select",
      options: [
        { label: "All Orders", value: "all" },
        ...(ordersData?.items?.map((order: any) => ({
          label: `${order.order_number} - ${order.item_name}`,
          value: order.id,
        })) || []),
      ],
    },
    {
      key: "factory",
      label: "Factory",
      type: "select",
      options: [
        { label: "All Factories", value: "all" },
        ...(factoriesData?.partners?.map((factory: any) => ({
          label: factory.company_name,
          value: factory.id,
        })) || []),
      ],
    },
    {
      key: "status",
      label: "Status",
      type: "select",
      options: [
        { label: "All Statuses", value: "all" },
        { label: "In Review", value: "in_review" },
        { label: "Designer Approved", value: "designer_approved" },
        { label: "Approved", value: "approved" },
        { label: "Rejected", value: "rejected" },
        { label: "Revision Requested", value: "revision_requested" },
      ],
    },
  ];

  const columns: DataTableColumn<typeof drawings[0]>[] = [
    {
      key: "drawing_number",
      label: "Drawing Number",
      render: (value) => (
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
          {value as string}
        </div>
      ),
    },
    {
      key: "drawing_name",
      label: "Name",
    },
    {
      key: "production_orders",
      label: "Production Order",
      render: (value) => {
        const order = value as any;
        return order ? (
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <div>
              <div className="font-medium">{order.order_number}</div>
              <div className="text-xs text-muted-foreground">
                {order.item_name}
              </div>
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      key: "partners",
      label: "Factory",
      render: (value) => {
        const partner = value as any;
        return partner ? (
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
            {partner.company_name}
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      key: "current_version",
      label: "Version",
      render: (value) => (
        <span className="font-mono text-sm">
          v{value as string}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (value) => {
        const status = value as string;
        // eslint-disable-next-line security/detect-object-injection
        const config = statusConfig[status] || statusConfig.in_review;
        return (
          <Badge variant="outline" className={cn("text-xs", config.className)}>
            {config.label}
          </Badge>
        );
      },
    },
    {
      key: "created_at",
      label: "Created",
      render: (value) =>
        value ? (
          <time dateTime={new Date(value as string).toISOString()}>
            {format(new Date(value as string), "MMM d, yyyy")}
          </time>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
  ];

  // Handle query error
  if (error) {
    return (
      <div className="page-container">
        <PageHeader
          title="Shop Drawings"
          description="Manage production drawings with version control and approvals"
        />
        <EmptyState
          icon={AlertTriangle}
          title="Failed to load shop drawings"
          description={error.message || "An unexpected error occurred. Please try again."}
          action={{
            label: 'Try Again',
            onClick: () => utils.shopDrawings.getAll.invalidate(),
            icon: RefreshCw,
          }}
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Shop Drawings"
        description="Manage production drawings with version control and approvals"
        actions={[
          {
            label: "Upload Drawing",
            icon: Plus,
            onClick: () => router.push("/production/shop-drawings/new"),
          },
        ]}
      />

      <StatsGrid stats={stats} />

      {isLoading ? (
        <LoadingState message="Loading shop drawings..." />
      ) : drawings.length === 0 && !searchQuery && orderFilter === "all" && factoryFilter === "all" && statusFilter === "all" ? (
        <EmptyState
          icon={FileText}
          title="No Shop Drawings Found"
          description="Get started by uploading your first shop drawing."
          action={{
            label: "Upload First Drawing",
            icon: Plus,
            onClick: () => router.push("/production/shop-drawings/new"),
          }}
        />
      ) : (
        <DataTable
          data={drawings as any[]}
          columns={columns}
          filters={filters}
          onRowClick={(row) => router.push(`/production/shop-drawings/${row.id}`)}
          emptyState={{
            icon: FileText,
            title: "No Shop Drawings Found",
            description: "Try adjusting your filters to see more results.",
          }}
          pagination={
            total > limit
              ? {
                  pageSize: limit,
                  showSizeSelector: false,
                }
              : undefined
          }
        />
      )}
    </div>
  );
}
