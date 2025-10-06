"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Thermometer,
  MoreVertical,
  Building,
  Mail,
  Eye,
  Edit,
  Trash,
  ArrowRight,
  Star,
} from "lucide-react";
import { toast } from "sonner";

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
  const [_prospectFilter, _setProspectFilter] = useState<ProspectStatus | 'all'>('all');
  const [_statusFilter, _setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [_page, _setPage] = useState(0);
  const [limit] = useState(20);

  const { data: prospectsData, isLoading, refetch } = api.crm.leads.getProspects.useQuery({
    limit,
    offset: _page * limit,
    prospect_status: _prospectFilter === 'all' ? undefined : _prospectFilter,
    status: _statusFilter === 'all' ? undefined : _statusFilter,
  });

  const deleteLeadMutation = api.crm.leads.delete.useMutation({
    onSuccess: () => {
      toast.success("Prospect deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to delete prospect: " + error.message);
    },
  });

  const convertToClientMutation = api.crm.leads.convertToClient.useMutation({
    onSuccess: () => {
      toast.success("Prospect converted to client successfully");
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to convert prospect: " + error.message);
    },
  });

  const handleDeleteProspect = (prospectId: string) => {
    if (confirm("Are you sure you want to delete this prospect?")) {
      deleteLeadMutation.mutate({ id: prospectId });
    }
  };

  const handleConvertToClient = (prospect: any) => {
    convertToClientMutation.mutate({
      leadId: prospect.id,
      clientData: {
        name: prospect.name,
        email: prospect.email,
        phone: prospect.phone,
        company: prospect.company,
        type: 'client',
      },
    });
  };

  const getProspectPriority = (prospect: any): number => {
    const statusPriority = { 'hot': 3, 'warm': 2, 'cold': 1 };
    const statusScore = statusPriority[prospect.prospect_status as ProspectStatus] || 0;
    const valueScore = prospect.value ? Math.min(prospect.value / 10000, 3) : 0;
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
      .reduce((sum: number, p: any) => sum + (p.value || 0), 0),
  }));

  // Stats configuration
  const stats: StatItem[] = prospectsByStatus.map((status) => ({
    title: `${status.label} Prospects`,
    value: status.count,
    description: `$${status.totalValue.toLocaleString()} total value`,
    icon: Thermometer,
    iconColor: status.value === 'hot' ? 'error' : status.value === 'warm' ? 'warning' : 'info',
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
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (value) => <span className="font-medium">{value as string}</span>,
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
      key: 'value',
      label: 'Value',
      sortable: true,
      render: (value) => value ? `$${(value as number).toLocaleString()}` : <span className="text-muted">—</span>,
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
                router.push(`/crm/prospects/${row.id}`);
              }}
            >
              <Eye className="icon-sm" aria-hidden="true" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem className="dropdown-item">
              <Edit className="icon-sm" aria-hidden="true" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="dropdown-item"
              onClick={(e) => {
                e.stopPropagation();
                handleConvertToClient(row);
              }}
            >
              <ArrowRight className="icon-sm" aria-hidden="true" />
              Convert to Client
            </DropdownMenuItem>
            <DropdownMenuItem
              className="dropdown-item-danger"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteProspect(row.id);
              }}
            >
              <Trash className="icon-sm" aria-hidden="true" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  // Filters configuration
  const filters: DataTableFilter[] = [
    {
      key: 'search',
      label: 'Search prospects',
      type: 'search',
      placeholder: 'Search by name, email, or company...',
    },
    {
      key: 'prospect_status',
      label: 'Prospect Status',
      type: 'select',
      options: [
        { value: 'all', label: 'All Prospects' },
        ...PROSPECT_STATUSES.map(s => ({ value: s.value, label: `${s.label} Prospects` })),
      ],
    },
    {
      key: 'status',
      label: 'Lead Status',
      type: 'select',
      options: [
        { value: 'all', label: 'All Statuses' },
        { value: 'new', label: 'New' },
        { value: 'contacted', label: 'Contacted' },
        { value: 'qualified', label: 'Qualified' },
        { value: 'proposal', label: 'Proposal' },
        { value: 'negotiation', label: 'Negotiation' },
      ],
    },
  ];

  return (
    <div className="page-container">
      {/* Page Header */}
      <PageHeader
        title="Prospects"
        subtitle="Manage qualified prospects in your sales pipeline"
      />

      {/* Pipeline Stats */}
      <StatsGrid stats={stats} columns={3} />

      {/* Prospects DataTable */}
      {isLoading ? (
        <LoadingState message="Loading prospects..." size="lg" />
      ) : sortedProspects.length === 0 ? (
        <EmptyState
          icon={Thermometer}
          title="No prospects found"
          description="Try adjusting your filters or convert some leads to prospects."
        />
      ) : (
        <DataTable
          data={sortedProspects}
          columns={columns}
          filters={filters}
          onRowClick={(row) => router.push(`/crm/prospects/${row.id}`)}
          pagination={{ pageSize: 20, showSizeSelector: true }}
          emptyState={{
            icon: Thermometer,
            title: 'No prospects match your filters',
            description: 'Try adjusting your search or filter criteria',
          }}
        />
      )}
    </div>
  );
}
