"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTableState } from "@/hooks/useTableFilters";
import {
  Plus,
  Users,
  Building,
  Mail,
  Phone,
  MapPin,
  TrendingUp,
  DollarSign,
  Eye,
  Trash2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import {
  PageHeader,
  EmptyState,
  LoadingState,
  DataTable,
  StatsGrid,
  StatusBadge,
  TableFilters,
  Breadcrumb,
  type DataTableColumn,
  type DataTableRowAction,
  type StatItem,
} from "@/components/common";
import { getFullName } from "@/lib/utils/name-utils";
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

export default function CustomersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<any>(null);

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
      status: 'all',
    },
    debounceMs: 300,
    pageSize: 100,
  });

  // Backend query with unified params
  const { data: customersData, isLoading, error } = api.customers.getAll.useQuery({
    ...queryParams,
    status: rawFilters.status === 'all' ? undefined : rawFilters.status,
  });

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  const deleteCustomer = api.customers.delete.useMutation({
    onSuccess: () => {
      toast({
        title: "Client deleted",
        description: "Client has been successfully deleted.",
      });
      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
      // Invalidate queries for instant updates
      utils.customers.getAll.invalidate();
      utils.crm.customers.list.invalidate();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete client",
        variant: "destructive",
      });
    },
  });

  const customers = customersData?.items || [];

  // Stats configuration
  const stats: StatItem[] = [
    {
      title: 'Total Clients',
      value: customers.length,
      description: 'Active clients',
      icon: Users,
      iconColor: 'info',
    },
    {
      title: 'With Active Projects',
      value: customers.filter((c: any) => c.projects_count > 0).length,
      description: 'Currently engaged',
      icon: TrendingUp,
      iconColor: 'success',
    },
    {
      title: 'Total Revenue',
      value: `$${customers.reduce((sum: number, c: any) => sum + Number(c.total_revenue || 0), 0).toLocaleString()}`,
      description: 'Lifetime value',
      icon: DollarSign,
      iconColor: 'warning',
    },
  ];

  // DataTable columns configuration
  const columns: DataTableColumn<any>[] = [
    {
      key: 'first_name',
      label: 'First Name',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <div className="data-table-avatar">
            <Building className="icon-sm" aria-hidden="true" />
          </div>
          <span className="font-medium">{value as string || row.name || '—'}</span>
        </div>
      ),
    },
    {
      key: 'last_name',
      label: 'Last Name',
      sortable: true,
      render: (value) => value ? <span className="font-medium">{value as string}</span> : <span className="text-muted">—</span>,
    },
    {
      key: 'email',
      label: 'Email',
      render: (value) => value ? (
        <div className="flex items-center gap-2">
          <Mail className="icon-xs text-muted" aria-hidden="true" />
          <span className="truncate max-w-[200px]">{value as string}</span>
        </div>
      ) : <span className="text-muted">—</span>,
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (value) => value ? (
        <div className="flex items-center gap-2">
          <Phone className="icon-xs text-muted" aria-hidden="true" />
          <span>{value as string}</span>
        </div>
      ) : <span className="text-muted">—</span>,
    },
    {
      key: 'city',
      label: 'Location',
      render: (value, row) => value || row.country ? (
        <div className="flex items-center gap-2">
          <MapPin className="icon-xs text-muted" aria-hidden="true" />
          <span>{value ? `${value}${row.country ? ', ' + row.country : ''}` : row.country}</span>
        </div>
      ) : <span className="text-muted">—</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => value ? <StatusBadge status={value as string} /> : <StatusBadge status="active" />,
    },
  ];

  // Status filter options
  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  // Row actions configuration
  const rowActions: DataTableRowAction<any>[] = [
    {
      label: 'View Details',
      icon: Eye,
      onClick: (row) => router.push(`/crm/customers/${row.id}`),
    },
    {
      label: 'Delete',
      icon: Trash2,
      variant: 'destructive',
      separator: true,
      onClick: (row) => {
        setCustomerToDelete(row);
        setDeleteDialogOpen(true);
      },
    },
  ];

  const handleConfirmDelete = () => {
    if (customerToDelete) {
      deleteCustomer.mutate({ id: customerToDelete.id });
    }
  };

  // Query error handling
  if (error) {
    return (
      <div className="page-container">
        <PageHeader
          title="Clients"
          subtitle="Manage your client relationships and accounts"
        />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4 max-w-md">
            <div className="flex justify-center">
              <div className="rounded-full bg-destructive/10 p-3">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">Failed to Load Clients</h3>
              <p className="text-sm text-muted-foreground">
                {error.message || "An error occurred while fetching clients data"}
              </p>
            </div>
            <button
              onClick={() => utils.customers.getAll.invalidate()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Breadcrumb />
      {/* Page Header */}
      <PageHeader
        title="Clients"
        subtitle="Manage your client relationships and accounts"
        action={
          <Button
            className="btn-primary"
            onClick={() => router.push('/crm/customers/new')}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Client
          </Button>
        }
      />

      {/* Customer Stats */}
      <StatsGrid stats={stats} columns={3} />

      {/* Filters - New Unified System */}
      <TableFilters.Bar
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
      >
        {/* Search Filter */}
        <TableFilters.Search
          value={rawFilters.search}
          onChange={(value) => setFilter('search', value)}
          placeholder="Search by name, email, or phone..."
        />

        {/* Status Filter */}
        <TableFilters.Select
          value={rawFilters.status}
          onChange={(value) => setFilter('status', value)}
          options={statusOptions}
          placeholder="All Statuses"
        />
      </TableFilters.Bar>

      {/* Clients DataTable - No filters prop (server-side only) */}
      {isLoading ? (
        <LoadingState message="Loading clients..." size="lg" />
      ) : !customers || customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No clients found"
          description="Get started by creating your first client."
          action={{
            label: 'Add Client',
            onClick: () => router.push('/crm/customers/new'),
            icon: Plus,
          }}
        />
      ) : (
        <DataTable
          data={customers}
          columns={columns}
          rowActions={rowActions}
          onRowClick={(row) => router.push(`/crm/customers/${row.id}`)}
          pagination={{ pageSize: 20, showSizeSelector: true }}
          emptyState={{
            icon: Users,
            title: 'No clients match your filters',
            description: 'Try adjusting your search or filter criteria',
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {getFullName(customerToDelete || {})}? This action cannot be undone.
              All associated orders, invoices, and activities will be preserved but unlinked.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteCustomer.isPending}
            >
              {deleteCustomer.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
