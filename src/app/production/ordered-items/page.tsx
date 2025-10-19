"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api/client";
import {
  PageHeader,
  StatsGrid,
  DataTable,
  EmptyState,
  LoadingState,
  StatusBadge,
  type StatItem,
  type DataTableColumn,
  type DataTableFilter,
} from "@/components/common";
import {
  Package,
  CheckCircle2,
  Factory,
} from "lucide-react";
import { format } from "date-fns";

// Dynamic route configuration
export const dynamic = 'force-dynamic';

export default function OrderedItemsProductionPage() {
  const router = useRouter();
  const { user: _user } = useAuth();
  const [_statusFilter, _setStatusFilter] = useState<string>("all");
  const [_qcStatusFilter, _setQcStatusFilter] = useState<string>("all");
  const [_searchQuery, _setSearchQuery] = useState("");

  // Fetch ordered items production
  const { data, isLoading } = api.orderedItemsProduction.getAll.useQuery(
    {
      status: _statusFilter === "all" ? undefined : _statusFilter,
      qcStatus: _qcStatusFilter === "all" ? undefined : _qcStatusFilter,
      search: _searchQuery || undefined,
      limit: 100,
      offset: 0,
    },
    {
      enabled: true,
    }
  );

  const items = data?.items || [];

  // Statistics
  const stats: StatItem[] = [
    {
      title: 'Total Units',
      value: items.length,
      description: 'All individual units',
      icon: Package,
      iconColor: 'info',
    },
    {
      title: 'In Production',
      value: items.filter((i) => i.status === "in_production").length,
      description: 'Currently being produced',
      icon: Factory,
      iconColor: 'info',
    },
    {
      title: 'Quality Check',
      value: items.filter((i) => i.status === "quality_check").length,
      description: 'Undergoing QC inspection',
      icon: CheckCircle2,
      iconColor: 'primary',
    },
    {
      title: 'QC Pass Rate',
      value: items.length > 0
        ? `${Math.round((items.filter((i) => i.qc_status === "pass").length / items.length) * 100)}%`
        : "0%",
      description: 'Quality control pass rate',
      icon: CheckCircle2,
      iconColor: 'success',
    },
  ];

  // DataTable columns
  const columns: DataTableColumn<any>[] = [
    {
      key: 'sku',
      label: 'SKU',
      sortable: true,
      render: (value) => <span className="font-medium">{value as string}</span>,
    },
    {
      key: 'item_number',
      label: 'Item #',
      render: (value) => <span className="font-mono text-sm">#{value as string}</span>,
    },
    {
      key: 'production_orders',
      label: 'Production Order',
      render: (value) => {
        const order = value as any;
        const customer = order?.projects?.customers;
        return order ? (
          <div>
            <div className="font-medium">{order.order_number}</div>
            {customer && (
              <div className="text-xs text-muted">
                {customer.company_name || customer.name}
              </div>
            )}
          </div>
        ) : <span className="text-muted">—</span>;
      },
    },
    {
      key: 'production_orders',
      label: 'Item Name',
      render: (value) => {
        const order = value as any;
        return order?.item_name ? (
          <span className="font-medium">{order.item_name}</span>
        ) : <span className="text-muted">—</span>;
      },
    },
    {
      key: 'production_orders',
      label: 'Project',
      render: (value) => {
        const project = (value as any)?.projects;
        return project ? (
          <span className="text-sm">{project.project_name}</span>
        ) : <span className="text-muted">—</span>;
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusBadge status={value as string} />,
    },
    {
      key: 'qc_status',
      label: 'QC Status',
      render: (value) => value ? <StatusBadge status={value as string} /> : <span className="text-muted">—</span>,
    },
    {
      key: 'shipments',
      label: 'Shipment',
      render: (value) => {
        const shipment = value as any;
        return shipment ? (
          <div>
            <div className="font-medium">{shipment.shipment_number}</div>
            {shipment.tracking_number && (
              <div className="text-xs text-muted font-mono">{shipment.tracking_number}</div>
            )}
          </div>
        ) : <span className="text-muted">Not assigned</span>;
      },
    },
    {
      key: 'qc_date',
      label: 'QC Date',
      render: (value, row) => {
        if (!value) return <span className="text-muted">—</span>;
        return (
          <div>
            <div className="text-sm">{format(new Date(value as string), "MMM d, yyyy")}</div>
            {row.users && (
              <div className="text-xs text-muted">by {row.users.name}</div>
            )}
          </div>
        );
      },
    },
  ];

  // Filters
  const filters: DataTableFilter[] = [
    {
      key: 'search',
      label: 'Search',
      type: 'search',
      placeholder: 'Search by SKU, serial number...',
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'all', label: 'All Statuses' },
        { value: 'pending', label: 'Pending' },
        { value: 'in_production', label: 'In Production' },
        { value: 'quality_check', label: 'Quality Check' },
        { value: 'approved', label: 'Approved' },
        { value: 'packed', label: 'Packed' },
        { value: 'shipped', label: 'Shipped' },
        { value: 'delivered', label: 'Delivered' },
      ],
    },
    {
      key: 'qc_status',
      label: 'QC Status',
      type: 'select',
      options: [
        { value: 'all', label: 'All QC Status' },
        { value: 'pending', label: 'Pending' },
        { value: 'pass', label: 'Pass' },
        { value: 'fail', label: 'Fail' },
        { value: 'repaired', label: 'Repaired' },
      ],
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Ordered Items - Individual Units"
        subtitle="Track individual units with QC status and production progress"
      />

      <StatsGrid stats={stats} columns={4} />

      {isLoading ? (
        <LoadingState message="Loading ordered items..." size="lg" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No Units Found"
          description="No individual units match your current filters."
        />
      ) : (
        <DataTable
          data={items}
          columns={columns}
          filters={filters}
          onRowClick={(row) => router.push(`/production/ordered-items/${row.id}`)}
          pagination={{ pageSize: 20, showSizeSelector: true }}
          emptyState={{
            icon: Package,
            title: 'No units match your filters',
            description: 'Try adjusting your search or filter criteria',
          }}
        />
      )}
    </div>
  );
}
