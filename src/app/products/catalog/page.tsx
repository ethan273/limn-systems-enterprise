"use client";

import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { useTableState } from "@/hooks/useTableFilters";
import { Plus, Package, DollarSign, Pencil, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  PageHeader,
  EmptyState,
  LoadingState,
  DataTable,
  StatsGrid,
  FormDialog,
  TableFilters,
  type DataTableColumn,
  type DataTableRowAction,
  type StatItem,
} from "@/components/common";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function CatalogItemsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  // Unified filter management with new hook
  const {
    rawFilters,
    setFilter,
    clearFilters,
    hasActiveFilters,
    queryParams,
  } = useTableState({
    initialFilters: {
      search: '',
      is_active: '',
    },
    debounceMs: 300,
    pageSize: 100,
  });

  // Backend query with unified params
  const { data, isLoading } = api.items.getAll.useQuery({
    ...queryParams,
    is_active: rawFilters.is_active || undefined,
  });

  // Query collections for the create form
  const { data: collectionsData } = api.collections.getAll.useQuery({});

  const items = data?.items || [];
  const collections = collectionsData?.items || [];

  // Filter to only show production-ready items
  const productionReadyItems = items.filter((item: any) =>
    item.status === 'production_ready' || item.type === 'Production Ready'
  );

  // Create mutation
  const createMutation = api.items.create.useMutation({
    onSuccess: (newItem) => {
      toast.success("Catalog item created successfully");
      // Invalidate queries for instant updates
      utils.items.getAll.invalidate();
      queryClient.invalidateQueries({ queryKey: ['items'] });
      // Navigate to the new item's detail page in edit mode
      router.push(`/products/catalog/${newItem.id}`);
    },
    onError: (error) => {
      toast.error("Failed to create catalog item: " + error.message);
    },
  });

  // Delete mutation
  const deleteMutation = api.items.delete.useMutation({
    onSuccess: () => {
      toast.success("Catalog item deleted successfully");
      // Invalidate queries for instant updates
      utils.items.getAll.invalidate();
      queryClient.invalidateQueries({ queryKey: ['items'] });
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    },
    onError: (error) => {
      toast.error("Failed to delete catalog item: " + error.message);
    },
  });

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate({ id: itemToDelete.id });
    }
  };

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
  ];

  // Status options for filter
  const statusOptions = [
    { value: '', label: 'All Items' },
    { value: 'true', label: 'Active' },
    { value: 'false', label: 'Inactive' },
  ];

  // Row actions configuration
  const rowActions: DataTableRowAction<any>[] = [
    {
      label: 'View Details',
      icon: Pencil,
      onClick: (row) => router.push(`/products/catalog/${row.id}`),
    },
    {
      label: 'Delete',
      icon: Trash2,
      variant: 'destructive',
      separator: true,
      onClick: (row) => {
        setItemToDelete(row);
        setDeleteDialogOpen(true);
      },
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
            onClick: () => setIsFormOpen(true),
          },
        ]}
      />

      {/* Stats Grid */}
      <StatsGrid stats={stats} columns={4} />

      {/* Filters - New Unified System */}
      <TableFilters.Bar
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
      >
        {/* Search Filter */}
        <TableFilters.Search
          value={rawFilters.search}
          onChange={(value) => setFilter('search', value)}
          placeholder="Search by name, SKU, or collection..."
        />

        {/* Status Filter */}
        <TableFilters.Select
          value={rawFilters.is_active}
          onChange={(value) => setFilter('is_active', value)}
          options={statusOptions}
          placeholder="All Items"
        />
      </TableFilters.Bar>

      {/* Catalog Items DataTable - No filters prop (server-side only) */}
      {isLoading ? (
        <LoadingState message="Loading catalog items..." size="lg" />
      ) : !productionReadyItems || productionReadyItems.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No catalog items found"
          description="Get started by creating your first catalog item."
          action={{
            label: 'Create First Catalog Item',
            onClick: () => setIsFormOpen(true),
            icon: Plus,
          }}
        />
      ) : (
        <DataTable
          data={productionReadyItems}
          columns={columns}
          rowActions={rowActions}
          onRowClick={(row) => router.push(`/products/catalog/${row.id}`)}
          pagination={{ pageSize: 20, showSizeSelector: true }}
          emptyState={{
            icon: Package,
            title: 'No items match your filters',
            description: 'Try adjusting your search or filter criteria',
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Catalog Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{itemToDelete?.name}&quot;? This action cannot be undone.
              This item will be removed from the catalog.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Catalog Item Form Dialog */}
      <FormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        title="Create New Catalog Item"
        description="Enter basic information to create a new catalog item. You'll be able to add all details on the next page."
        fields={[
          { name: 'name', label: 'Item Name', type: 'text', required: true, placeholder: 'Enter item name' },
          { name: 'sku', label: 'SKU', type: 'text', required: true, placeholder: 'Enter SKU' },
          {
            name: 'collection_id',
            label: 'Collection',
            type: 'select',
            required: true,
            options: collections.map((c: any) => ({ value: c.id, label: c.name }))
          },
          { name: 'list_price', label: 'List Price', type: 'number', required: true, placeholder: '0.00' },
        ]}
        onSubmit={async (data) => {
          await createMutation.mutateAsync({
            ...(data as any),
            type: 'Production Ready' as const,
            active: true,
            currency: 'USD',
            min_order_quantity: 1,
          });
        }}
      />
    </div>
  );
}
