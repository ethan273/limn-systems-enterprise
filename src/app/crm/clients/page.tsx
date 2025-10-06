"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MoreVertical,
  Building,
  Mail,
  Phone,
  Edit,
  Trash,
  Eye,
  Package,
  Users,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  PageHeader,
  FormDialog,
  EmptyState,
  LoadingState,
  DataTable,
  StatsGrid,
  StatusBadge,
  type FormField,
  type DataTableColumn,
  type DataTableFilter,
  type StatItem,
} from "@/components/common";

type CustomerStatus = "active" | "inactive" | "pending" | "suspended";
type CustomerType = "individual" | "business" | "enterprise";

export default function ClientsPage() {
  const router = useRouter();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editCustomerId, setEditCustomerId] = useState<string>("");

  const { data: customersData, isLoading, refetch } = api.crm.customers.getAll.useQuery({
    limit: 100,
    offset: 0,
  });

  const customers = useMemo(() => customersData?.items || [], [customersData?.items]);

  const createCustomer = api.crm.customers.create.useMutation({
    onSuccess: () => {
      toast.success("Client created successfully");
      setIsCreateDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error("Error creating client: " + error.message);
    },
  });

  const updateCustomer = api.crm.customers.update.useMutation({
    onSuccess: () => {
      toast.success("Client updated successfully");
      setIsEditDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error("Error updating client: " + error.message);
    },
  });

  const deleteCustomer = api.crm.customers.delete.useMutation({
    onSuccess: () => {
      toast.success("Client deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error("Error deleting client: " + error.message);
    },
  });

  const handleDeleteCustomer = (customerId: string) => {
    if (confirm("Are you sure you want to delete this client?")) {
      deleteCustomer.mutate({ id: customerId });
    }
  };

  const handleEditCustomer = (customer: any) => {
    setEditCustomerId(customer.id);
    setIsEditDialogOpen(true);
  };

  // Customer stats
  const stats: StatItem[] = useMemo(() => {
    const total = customers.length;
    const active = customers.filter((c) => c.status === "active").length;
    const totalValue = customers.reduce((sum, c) => sum + (c.lifetime_value || 0), 0);
    const averageValue = total > 0 ? totalValue / total : 0;

    return [
      {
        title: 'Total Clients',
        value: total,
        description: 'All registered clients',
        icon: Users,
        iconColor: 'info',
      },
      {
        title: 'Active',
        value: active,
        description: 'Currently active clients',
        icon: Package,
        iconColor: 'success',
      },
      {
        title: 'Total Value',
        value: `$${totalValue.toLocaleString()}`,
        description: 'Lifetime customer value',
        icon: DollarSign,
        iconColor: 'warning',
      },
      {
        title: 'Avg Value',
        value: `$${Math.round(averageValue).toLocaleString()}`,
        description: 'Average per client',
        icon: TrendingUp,
        iconColor: 'success',
      },
    ];
  }, [customers]);

  // Form fields for create dialog
  const createFormFields: FormField[] = [
    { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Client name' },
    { name: 'company', label: 'Company', type: 'text', placeholder: 'Company name' },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'email@example.com' },
    { name: 'phone', label: 'Phone', type: 'text', placeholder: '+1 (555) 123-4567' },
    {
      name: 'type',
      label: 'Client Type',
      type: 'select',
      options: [
        { value: 'individual', label: 'Individual' },
        { value: 'business', label: 'Business' },
        { value: 'enterprise', label: 'Enterprise' },
      ],
      defaultValue: 'business',
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'pending', label: 'Pending' },
        { value: 'suspended', label: 'Suspended' },
      ],
      defaultValue: 'active',
    },
    { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Additional notes about this client...' },
  ];

  // Form fields for edit dialog
  const selectedCustomer = customers.find(c => c.id === editCustomerId);
  const editFormFields: FormField[] = [
    { name: 'name', label: 'Name', type: 'text', required: true, defaultValue: selectedCustomer?.name },
    { name: 'company', label: 'Company', type: 'text', defaultValue: selectedCustomer?.company },
    { name: 'email', label: 'Email', type: 'email', defaultValue: selectedCustomer?.email },
    { name: 'phone', label: 'Phone', type: 'text', defaultValue: selectedCustomer?.phone },
    {
      name: 'type',
      label: 'Client Type',
      type: 'select',
      options: [
        { value: 'individual', label: 'Individual' },
        { value: 'business', label: 'Business' },
        { value: 'enterprise', label: 'Enterprise' },
      ],
      defaultValue: selectedCustomer?.type,
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'pending', label: 'Pending' },
        { value: 'suspended', label: 'Suspended' },
      ],
      defaultValue: selectedCustomer?.status,
    },
    { name: 'notes', label: 'Notes', type: 'textarea', defaultValue: selectedCustomer?.notes },
  ];

  // DataTable columns configuration
  const columns: DataTableColumn<any>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="data-table-avatar">
            <Users className="icon-sm" aria-hidden="true" />
          </div>
          <span className="font-medium">{row.name}</span>
        </div>
      ),
    },
    {
      key: 'company',
      label: 'Company',
      sortable: true,
      render: (value) => value ? (
        <div className="flex items-center gap-2">
          <Building className="icon-xs text-muted" aria-hidden="true" />
          <span>{value as string}</span>
        </div>
      ) : <span className="text-muted">—</span>,
    },
    {
      key: 'type',
      label: 'Type',
      render: (value) => value ? <StatusBadge status={value as string} /> : <span className="text-muted">—</span>,
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
      key: 'status',
      label: 'Status',
      render: (value) => value ? <StatusBadge status={value as string} /> : <span className="text-muted">—</span>,
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
                router.push(`/crm/customers/${row.id}`);
              }}
            >
              <Eye className="icon-sm" aria-hidden="true" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem
              className="dropdown-item"
              onClick={(e) => {
                e.stopPropagation();
                handleEditCustomer(row);
              }}
            >
              <Edit className="icon-sm" aria-hidden="true" />
              Edit Client
            </DropdownMenuItem>
            <DropdownMenuItem
              className="dropdown-item-danger"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteCustomer(row.id);
              }}
            >
              <Trash className="icon-sm" aria-hidden="true" />
              Delete Client
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
      label: 'Search clients',
      type: 'search',
      placeholder: 'Search by name, email, or company...',
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'all', label: 'All Status' },
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'pending', label: 'Pending' },
        { value: 'suspended', label: 'Suspended' },
      ],
    },
    {
      key: 'type',
      label: 'Type',
      type: 'select',
      options: [
        { value: 'all', label: 'All Types' },
        { value: 'individual', label: 'Individual' },
        { value: 'business', label: 'Business' },
        { value: 'enterprise', label: 'Enterprise' },
      ],
    },
  ];

  return (
    <div className="page-container">
      {/* Page Header */}
      <PageHeader
        title="Clients"
        subtitle="Manage your customer relationships and accounts"
        actions={[
          {
            label: 'Add Client',
            icon: Plus,
            onClick: () => setIsCreateDialogOpen(true),
          },
        ]}
      />

      {/* Create Client Dialog */}
      <FormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        title="Create New Client"
        description="Add a new client to your CRM system"
        fields={createFormFields}
        onSubmit={async (data) => {
          await createCustomer.mutateAsync({
            name: data.name as string,
            email: data.email as string || undefined,
            phone: data.phone as string || undefined,
            company: data.company as string || undefined,
            type: data.type as CustomerType,
            status: data.status as CustomerStatus,
            notes: data.notes as string || undefined,
          });
        }}
        submitLabel="Create Client"
        isLoading={createCustomer.isPending}
      />

      {/* Edit Client Dialog */}
      <FormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        title="Edit Client"
        description="Update client information"
        fields={editFormFields}
        onSubmit={async (data) => {
          await updateCustomer.mutateAsync({
            id: editCustomerId,
            name: data.name as string,
            email: data.email as string || undefined,
            phone: data.phone as string || undefined,
            company: data.company as string || undefined,
            type: data.type as CustomerType,
            status: data.status as CustomerStatus,
            notes: data.notes as string || undefined,
          });
        }}
        submitLabel="Update Client"
        isLoading={updateCustomer.isPending}
      />

      {/* Stats Grid */}
      <StatsGrid stats={stats} columns={4} />

      {/* Clients DataTable */}
      {isLoading ? (
        <LoadingState message="Loading clients..." size="lg" />
      ) : !customers || customers.length === 0 ? (
        <EmptyState
          icon={Building}
          title="No clients found"
          description="Get started by creating your first client."
          action={{
            label: 'Add Client',
            onClick: () => setIsCreateDialogOpen(true),
            icon: Plus,
          }}
        />
      ) : (
        <DataTable
          data={customers}
          columns={columns}
          filters={filters}
          onRowClick={(row) => router.push(`/crm/customers/${row.id}`)}
          pagination={{ pageSize: 20, showSizeSelector: true }}
          emptyState={{
            icon: Building,
            title: 'No clients match your filters',
            description: 'Try adjusting your search or filter criteria',
          }}
        />
      )}
    </div>
  );
}
