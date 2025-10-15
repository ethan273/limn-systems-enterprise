"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
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
} from "lucide-react";
import {
  PageHeader,
  EmptyState,
  LoadingState,
  DataTable,
  StatsGrid,
  StatusBadge,
  type DataTableColumn,
  type DataTableFilter,
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

  const { data: customersData, isLoading } = api.customers.getAll.useQuery({
    limit: 100,
    offset: 0,
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
      label: 'Client Name',
      sortable: true,
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="data-table-avatar">
            <Building className="icon-sm" aria-hidden="true" />
          </div>
          <span className="font-medium">{getFullName(row)}</span>
        </div>
      ),
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

  // DataTable filters configuration
  const filters: DataTableFilter[] = [
    {
      key: 'search',
      label: 'Search clients',
      type: 'search',
      placeholder: 'Search by name, email, or phone...',
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'all', label: 'All Statuses' },
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
      ],
    },
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

  return (
    <div className="page-container">
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

      {/* Clients DataTable */}
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
          filters={filters}
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
