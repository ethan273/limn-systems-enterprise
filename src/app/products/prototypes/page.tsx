"use client";

import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Plus, Package, MoreVertical, Eye, Edit, Trash } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  PageHeader,
  EmptyState,
  LoadingState,
  DataTable,
  StatsGrid,
  StatusBadge,
  type DataTableColumn,
  type DataTableFilter,
  type StatItem,
} from "@/components/common";

export default function PrototypesPage() {
  const router = useRouter();

  // Query items filtered by prototype status
  const { data, isLoading, refetch } = api.items.getAll.useQuery({
    limit: 100,
    offset: 0,
  });

  const items = data?.items || [];

  // Delete mutation
  const deleteMutation = api.items.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  // Filter to only show prototype items
  const prototypeItems = items.filter((item: any) =>
    item.status === 'prototype' || item.type === 'Prototype'
  );

  // Stats configuration
  const stats: StatItem[] = [
    {
      title: 'Total Prototypes',
      value: prototypeItems.length,
      description: 'All prototype items',
      icon: Package,
      iconColor: 'info',
    },
    {
      title: 'Active',
      value: prototypeItems.filter((item: any) => item.is_active).length,
      description: 'Active prototypes',
      icon: Package,
      iconColor: 'success',
    },
    {
      title: 'Inactive',
      value: prototypeItems.filter((item: any) => !item.is_active).length,
      description: 'Inactive prototypes',
      icon: Package,
      iconColor: 'info',
    },
  ];

  // DataTable columns configuration
  const columns: DataTableColumn<any>[] = [
    {
      key: 'name',
      label: 'Item Name',
      sortable: true,
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="data-table-avatar">
            <Package className="icon-sm" aria-hidden="true" />
          </div>
          <div>
            <div className="font-medium">{row.name}</div>
            {row.description && (
              <div className="text-sm text-secondary line-clamp-1">
                {row.description}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'base_sku',
      label: 'Base SKU',
      sortable: true,
      render: (value) => value ? (
        <span className="font-mono text-sm">{value as string}</span>
      ) : <span className="text-muted">—</span>,
    },
    {
      key: 'collections',
      label: 'Collection',
      render: (value: any) => value?.name ? (
        <StatusBadge status={value.name} />
      ) : <span className="text-muted">No collection</span>,
    },
    {
      key: 'furniture_type',
      label: 'Type',
      render: (value) => value ? (
        <span className="capitalize">{(value as string).replace('_', ' ')}</span>
      ) : <span className="text-muted">—</span>,
    },
    {
      key: 'list_price',
      label: 'Price',
      sortable: true,
      render: (value) => (
        <span className="font-medium">
          ${value ? (value as number).toFixed(2) : '0.00'}
        </span>
      ),
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (value) => (
        <StatusBadge status={value ? 'active' : 'inactive'} />
      ),
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      render: (value) => value ? (
        <span className="text-sm">
          {formatDistanceToNow(new Date(value as string), { addSuffix: true })}
        </span>
      ) : null,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" className="btn-icon">
              <MoreVertical className="icon-sm" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="card">
            <DropdownMenuItem
              className="dropdown-item"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/products/catalog/${row.id}`);
              }}
            >
              <Eye className="icon-sm" aria-hidden="true" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem
              className="dropdown-item"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/products/catalog/${row.id}/edit`);
              }}
            >
              <Edit className="icon-sm" aria-hidden="true" />
              Edit Item
            </DropdownMenuItem>
            <DropdownMenuItem
              className="dropdown-item-danger"
              onClick={async (e) => {
                e.stopPropagation();
                if (window.confirm(`Are you sure you want to delete "${row.name}"? This action cannot be undone.`)) {
                  try {
                    await deleteMutation.mutateAsync({ id: row.id });
                  } catch (error) {
                    console.error('Failed to delete item:', error);
                    alert('Failed to delete item. Please try again.');
                  }
                }
              }}
            >
              <Trash className="icon-sm" aria-hidden="true" />
              Delete Item
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  // DataTable filters configuration
  const filters: DataTableFilter[] = [
    {
      key: 'search',
      label: 'Search prototypes',
      type: 'search',
      placeholder: 'Search by name, SKU, or collection...',
    },
  ];

  return (
    <div className="page-container">
      {/* Page Header */}
      <PageHeader
        title="Prototypes"
        subtitle="Physical prototypes in testing"
        actions={[
          {
            label: 'New Prototype',
            icon: Plus,
            onClick: () => router.push('/products/prototypes/new'),
          },
        ]}
      />

      {/* Stats */}
      <StatsGrid stats={stats} columns={3} />

      {/* Prototypes DataTable */}
      {isLoading ? (
        <LoadingState message="Loading prototypes..." size="lg" />
      ) : !prototypeItems || prototypeItems.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No prototypes found"
          description="Get started by creating your first prototype."
          action={{
            label: 'Create First Prototype',
            onClick: () => router.push('/products/prototypes/new'),
            icon: Plus,
          }}
        />
      ) : (
        <DataTable
          data={prototypeItems}
          columns={columns}
          filters={filters}
          onRowClick={(row) => router.push(`/products/catalog/${row.id}`)}
          pagination={{ pageSize: 20, showSizeSelector: true }}
          emptyState={{
            icon: Package,
            title: 'No prototypes match your filters',
            description: 'Try adjusting your search or filter criteria',
          }}
        />
      )}
    </div>
  );
}
