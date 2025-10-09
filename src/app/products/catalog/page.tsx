"use client";

import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Plus, Package, MoreVertical, Eye, Edit, Trash, DollarSign } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
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

export default function CatalogItemsPage() {
  const router = useRouter();

  // Query items filtered by production_ready status
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

  // Filter to only show production-ready items
  const productionReadyItems = items.filter((item: any) =>
    item.status === 'production_ready' || item.type === 'Production Ready'
  );

  // Stats configuration
  const stats: StatItem[] = [
    {
      title: 'Total Items',
      value: productionReadyItems.length,
      description: 'Production-ready items',
      icon: Package,
      iconColor: 'info',
    },
    {
      title: 'Active',
      value: productionReadyItems.filter((item: any) => item.is_active).length,
      description: 'Currently active',
      icon: Package,
      iconColor: 'success',
    },
    {
      title: 'Inactive',
      value: productionReadyItems.filter((item: any) => !item.is_active).length,
      description: 'Not currently active',
      icon: Package,
      iconColor: 'muted' as any,
    },
    {
      title: 'Avg Price',
      value: productionReadyItems.length > 0
        ? `$${(productionReadyItems.reduce((sum: number, item: any) => sum + (item.list_price || 0), 0) / productionReadyItems.length).toFixed(2)}`
        : '$0.00',
      description: 'Average list price',
      icon: DollarSign,
      iconColor: 'warning',
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
      render: (value) => (
        <Badge variant="secondary" className="font-mono">
          {value as string}
        </Badge>
      ),
    },
    {
      key: 'collections',
      label: 'Collection',
      render: (value) => (
        <Badge variant="outline">
          {(value as any)?.name || 'No collection'}
        </Badge>
      ),
    },
    {
      key: 'furniture_type',
      label: 'Type',
      render: (value) => value ? (
        <Badge variant="secondary" className="capitalize">
          {(value as string).replace('_', ' ')}
        </Badge>
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
        <Badge
          variant="outline"
          className={value ? "status-active" : "status-inactive"}
        >
          {value ? "Active" : "Inactive"}
        </Badge>
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
      label: 'Search items',
      type: 'search',
      placeholder: 'Search by name, SKU, or collection...',
    },
    {
      key: 'is_active',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'all', label: 'All Items' },
        { value: 'true', label: 'Active' },
        { value: 'false', label: 'Inactive' },
      ],
    },
  ];

  return (
    <div className="page-container">
      {/* Page Header */}
      <PageHeader
        title="Catalog Items"
        subtitle="Production-ready items available for order"
        actions={[
          {
            label: 'New Catalog Item',
            icon: Plus,
            onClick: () => router.push('/products/catalog/new'),
          },
        ]}
      />

      {/* Stats Grid */}
      <StatsGrid stats={stats} columns={4} />

      {/* Catalog Items DataTable */}
      {isLoading ? (
        <LoadingState message="Loading catalog items..." size="lg" />
      ) : !productionReadyItems || productionReadyItems.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No catalog items found"
          description="Get started by creating your first catalog item."
          action={{
            label: 'Create First Catalog Item',
            onClick: () => router.push('/products/catalog/new'),
            icon: Plus,
          }}
        />
      ) : (
        <DataTable
          data={productionReadyItems}
          columns={columns}
          filters={filters}
          onRowClick={(row) => router.push(`/products/catalog/${row.id}`)}
          pagination={{ pageSize: 20, showSizeSelector: true }}
          emptyState={{
            icon: Package,
            title: 'No items match your filters',
            description: 'Try adjusting your search or filter criteria',
          }}
        />
      )}
    </div>
  );
}
