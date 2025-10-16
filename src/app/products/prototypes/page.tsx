"use client";

import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { Plus, Package, Pencil, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  PageHeader,
  EmptyState,
  LoadingState,
  DataTable,
  StatsGrid,
  StatusBadge,
  FormDialog,
  type DataTableColumn,
  type DataTableFilter,
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

export default function PrototypesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  // Query prototypes
  const { data, isLoading } = api.products.getAllPrototypes.useQuery();

  const prototypeItems = data || [];

  // Create mutation
  const createMutation = api.products.createPrototype.useMutation({
    onSuccess: () => {
      toast.success("Prototype created successfully");
      // Invalidate queries for instant updates
      utils.products.getAllPrototypes.invalidate();
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsFormOpen(false);
    },
    onError: (error) => {
      toast.error("Failed to create prototype: " + error.message);
    },
  });

  // Delete mutation
  const deleteMutation = api.products.deletePrototype.useMutation({
    onSuccess: () => {
      toast.success("Prototype deleted successfully");
      // Invalidate queries for instant updates
      utils.products.getAllPrototypes.invalidate();
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    },
    onError: (error) => {
      toast.error("Failed to delete prototype: " + error.message);
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

  // Row actions configuration
  const rowActions: DataTableRowAction<any>[] = [
    {
      label: 'View Details',
      icon: Pencil,
      onClick: (row) => router.push(`/products/prototypes/${row.id}`),
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
        title="Prototypes"
        subtitle="Physical prototypes in testing"
        actions={[
          {
            label: 'New Prototype',
            icon: Plus,
            onClick: () => setIsFormOpen(true),
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
            onClick: () => setIsFormOpen(true),
            icon: Plus,
          }}
        />
      ) : (
        <DataTable
          data={prototypeItems}
          columns={columns}
          filters={filters}
          rowActions={rowActions}
          onRowClick={(row) => router.push(`/products/prototypes/${row.id}`)}
          pagination={{ pageSize: 20, showSizeSelector: true }}
          emptyState={{
            icon: Package,
            title: 'No prototypes match your filters',
            description: 'Try adjusting your search or filter criteria',
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Prototype</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{itemToDelete?.name}&quot;? This action cannot be undone.
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

      {/* Create Prototype Form Dialog */}
      <FormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        title="Create New Prototype"
        description="Add a new furniture prototype to the system"
        fields={[
          { name: 'name', label: 'Prototype Name', type: 'text', required: true },
          { name: 'prototype_number', label: 'Prototype Number', type: 'text', required: true },
          { name: 'description', label: 'Description', type: 'textarea' },
          { name: 'prototype_type', label: 'Prototype Type', type: 'text' },
          { name: 'status', label: 'Status', type: 'text' },
          { name: 'priority', label: 'Priority', type: 'text' },
          { name: 'target_price_usd', label: 'Target Price (USD)', type: 'number' },
          { name: 'target_cost_usd', label: 'Target Cost (USD)', type: 'number' },
        ]}
        onSubmit={async (data) => {
          await createMutation.mutateAsync(data as any);
        }}
      />
    </div>
  );
}
