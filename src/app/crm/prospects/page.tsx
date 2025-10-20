"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { useTableState } from "@/hooks/useTableFilters";
import {
  PageHeader,
  StatsGrid,
  DataTable,
  EmptyState,
  LoadingState,
  StatusBadge,
  TableFilters,
  type StatItem,
  type DataTableColumn,
  type DataTableRowAction,
} from "@/components/common";
import {
  Thermometer,
  Building,
  Mail,
  ArrowRight,
  Star,
  Pencil,
  Trash2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
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
import { Button } from "@/components/ui/button";

type ProspectStatus = 'cold' | 'warm' | 'hot';
type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';

const PROSPECT_STATUSES: {
  value: ProspectStatus;
  label: string;
  description: string;
}[] = [
  {
    value: 'hot',
    label: 'Hot',
    description: 'Ready to buy, high interest'
  },
  {
    value: 'warm',
    label: 'Warm',
    description: 'Engaged, needs nurturing'
  },
  {
    value: 'cold',
    label: 'Cold',
    description: 'Early stage, requires attention'
  },
];

export default function ProspectsPage() {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [prospectToDelete, setProspectToDelete] = useState<any>(null);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [prospectToConvert, setProspectToConvert] = useState<any>(null);

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
      prospect_status: 'all',
      status: 'all',
    },
    debounceMs: 300,
    pageSize: 100,
  });

  // Backend query with unified params
  const { data: prospectsData, isLoading, error } = api.crm.leads.getProspects.useQuery({
    ...queryParams,
    status: rawFilters.status === 'all' ? undefined : rawFilters.status,
    prospect_status: queryParams.prospect_status as 'cold' | 'warm' | 'hot' | undefined,
  });

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  const deleteLeadMutation = api.crm.leads.delete.useMutation({
    onSuccess: () => {
      toast.success("Prospect deleted successfully");
      setDeleteDialogOpen(false);
      setProspectToDelete(null);
      // Invalidate queries for instant updates
      utils.crm.leads.getProspects.invalidate();
      utils.crm.leads.getAll.invalidate();
      utils.crm.leads.getPipelineStats.invalidate();
    },
    onError: (error) => {
      toast.error("Failed to delete prospect: " + error.message);
    },
  });

  const convertToClientMutation = api.crm.leads.convertToClient.useMutation({
    onSuccess: (data) => {
      toast.success("Prospect converted to client successfully");
      setConvertDialogOpen(false);
      setProspectToConvert(null);
      // Invalidate queries for instant updates
      utils.crm.leads.getProspects.invalidate();
      utils.crm.leads.getAll.invalidate();
      utils.crm.leads.getPipelineStats.invalidate();
      utils.crm.customers.getAll.invalidate();
      // Navigate to the new customer page
      router.push(`/crm/customers/${data.client.id}`);
    },
    onError: (error) => {
      toast.error("Failed to convert prospect: " + error.message);
    },
  });

  const handleConfirmDelete = () => {
    if (prospectToDelete) {
      deleteLeadMutation.mutate({ id: prospectToDelete.id });
    }
  };

  const handleConfirmConvert = () => {
    if (prospectToConvert) {
      convertToClientMutation.mutate({
        leadId: prospectToConvert.id,
        clientData: {
          name: prospectToConvert.name,
          email: prospectToConvert.email,
          phone: prospectToConvert.phone,
          company: prospectToConvert.company,
          type: 'client',
        },
      });
    }
  };

  const getProspectPriority = (prospect: any): number => {
    const statusPriority = { 'hot': 3, 'warm': 2, 'cold': 1 };
    const statusScore = statusPriority[prospect.prospect_status as ProspectStatus] || 0;
    const valueScore = prospect.lead_value ? Math.min(Number(prospect.lead_value) / 10000, 3) : 0;
    const timeScore = prospect.created_at ?
      Math.max(0, 3 - Math.floor((Date.now() - new Date(prospect.created_at).getTime()) / (1000 * 60 * 60 * 24 * 7))) : 0;

    return Math.round(statusScore + valueScore + timeScore);
  };

  const prospects = prospectsData?.items || [];

  // Sort prospects by priority and status
  const sortedProspects = [...prospects].sort((a: any, b: any) => {
    const aPriority = getProspectPriority(a);
    const bPriority = getProspectPriority(b);
    if (aPriority !== bPriority) return bPriority - aPriority;

    // Secondary sort by prospect status (hot > warm > cold)
    const statusOrder = { 'hot': 3, 'warm': 2, 'cold': 1 };
    const aStatus = statusOrder[a.prospect_status as ProspectStatus] || 0;
    const bStatus = statusOrder[b.prospect_status as ProspectStatus] || 0;
    return bStatus - aStatus;
  });

  const prospectsByStatus = PROSPECT_STATUSES.map((status) => ({
    ...status,
    count: prospects.filter((p: any) => p.prospect_status === status.value).length,
    totalValue: prospects
      .filter((p: any) => p.prospect_status === status.value)
      .reduce((sum: number, p: any) => sum + (p.lead_value ? Number(p.lead_value) : 0), 0),
  }));

  // Stats configuration
  const stats: StatItem[] = prospectsByStatus.map((status) => ({
    title: `${status.label} Prospects`,
    value: status.count,
    description: `$${status.totalValue.toLocaleString()} total value`,
    icon: Thermometer,
    iconColor: status.value === 'hot' ? 'destructive' : status.value === 'warm' ? 'warning' : 'info',
  }));

  // DataTable columns
  const columns: DataTableColumn<any>[] = [
    {
      key: 'priority',
      label: 'Priority',
      render: (_, row) => {
        const priority = getProspectPriority(row);
        return (
          <div className="flex items-center gap-1">
            <Star className={`icon-sm ${priority >= 5 ? 'text-warning' : 'text-muted'}`} aria-hidden="true" />
            <span className="font-mono text-sm">{priority}</span>
          </div>
        );
      },
    },
    {
      key: 'first_name',
      label: 'First Name',
      sortable: true,
      render: (value) => value ? <span className="font-medium">{value as string}</span> : <span className="text-muted">—</span>,
    },
    {
      key: 'last_name',
      label: 'Last Name',
      sortable: true,
      render: (value) => value ? <span className="font-medium">{value as string}</span> : <span className="text-muted">—</span>,
    },
    {
      key: 'company',
      label: 'Company',
      render: (value) => value ? (
        <div className="flex items-center gap-2">
          <Building className="icon-xs text-muted" aria-hidden="true" />
          <span>{value as string}</span>
        </div>
      ) : <span className="text-muted">—</span>,
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
      key: 'status',
      label: 'Status',
      render: (value) => value ? <StatusBadge status={value as string} /> : <span className="text-muted">—</span>,
    },
    {
      key: 'prospect_status',
      label: 'Prospect',
      render: (value) => value ? <StatusBadge status={value as string} /> : <span className="text-muted">—</span>,
    },
    {
      key: 'lead_value',
      label: 'Value',
      sortable: true,
      render: (value) => value ? `$${Number(value).toLocaleString()}` : <span className="text-muted">—</span>,
    },
  ];

  // Filter options for TableFilters components
  const prospectStatusOptions = [
    { value: 'all', label: 'All Prospects' },
    ...PROSPECT_STATUSES.map(s => ({ value: s.value, label: `${s.label} Prospects` })),
  ];

  const leadStatusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'new', label: 'New' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'qualified', label: 'Qualified' },
    { value: 'proposal', label: 'Proposal' },
    { value: 'negotiation', label: 'Negotiation' },
  ];

  // Row actions configuration
  const rowActions: DataTableRowAction<any>[] = [
    {
      label: 'View Details',
      icon: Pencil,
      onClick: (row) => router.push(`/crm/prospects/${row.id}`),
    },
    {
      label: 'Convert to Client',
      icon: ArrowRight,
      separator: true,
      onClick: (row) => {
        setProspectToConvert(row);
        setConvertDialogOpen(true);
      },
    },
    {
      label: 'Delete',
      icon: Trash2,
      variant: 'destructive',
      separator: true,
      onClick: (row) => {
        setProspectToDelete(row);
        setDeleteDialogOpen(true);
      },
    },
  ];

  if (isLoading) {
    return (
      <div className="page-container">
        <LoadingState message="Loading prospects..." size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <h2 className="text-2xl font-semibold">Error Loading Prospects</h2>
          <p className="text-muted-foreground text-center max-w-md">
            {error.message || "Failed to load prospects data. Please try again."}
          </p>
          <Button
            onClick={() => {
              utils.crm.leads.getProspects.invalidate();
              utils.crm.leads.getAll.invalidate();
              utils.crm.leads.getPipelineStats.invalidate();
            }}
            variant="outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Page Header */}
      <PageHeader
        title="Prospects"
        subtitle="Manage qualified prospects in your sales pipeline"
      />

      {/* Pipeline Stats */}
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
          placeholder="Search by name, email, or company..."
        />

        {/* Prospect Status Filter */}
        <TableFilters.Select
          value={rawFilters.prospect_status}
          onChange={(value) => setFilter('prospect_status', value)}
          options={prospectStatusOptions}
          placeholder="All Prospects"
        />

        {/* Lead Status Filter */}
        <TableFilters.Select
          value={rawFilters.status}
          onChange={(value) => setFilter('status', value)}
          options={leadStatusOptions}
          placeholder="All Statuses"
        />
      </TableFilters.Bar>

      {/* Prospects DataTable - No filters prop (server-side only) */}
      {sortedProspects.length === 0 ? (
        <EmptyState
          icon={Thermometer}
          title="No prospects found"
          description="Try adjusting your filters or convert some leads to prospects."
        />
      ) : (
        <DataTable
          data={sortedProspects}
          columns={columns}
          rowActions={rowActions}
          onRowClick={(row) => router.push(`/crm/prospects/${row.id}`)}
          pagination={{ pageSize: 20, showSizeSelector: true }}
          emptyState={{
            icon: Thermometer,
            title: 'No prospects match your filters',
            description: 'Try adjusting your search or filter criteria',
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Prospect</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {getFullName(prospectToDelete || {})}? This action cannot be undone.
              All associated activities will be preserved but unlinked.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteLeadMutation.isPending}
            >
              {deleteLeadMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Convert to Client Confirmation Dialog */}
      <AlertDialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Convert to Client</AlertDialogTitle>
            <AlertDialogDescription>
              Convert {getFullName(prospectToConvert || {})} to a client? This will create a new customer record
              and move this prospect out of your sales pipeline.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmConvert}
              disabled={convertToClientMutation.isPending}
            >
              {convertToClientMutation.isPending ? 'Converting...' : 'Convert to Client'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
