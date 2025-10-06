"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MoreVertical,
  Building,
  Mail,
  Phone,
  DollarSign,
  Edit,
  Trash,
  Eye,
  Users,
  TrendingUp,
  Target,
  ArrowRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
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

type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
type ProspectStatus = 'cold' | 'warm' | 'hot';

const LEAD_STATUSES: { value: LeadStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
];

const PROSPECT_STATUSES: { value: ProspectStatus; label: string }[] = [
  { value: 'cold', label: 'Cold' },
  { value: 'warm', label: 'Warm' },
  { value: 'hot', label: 'Hot' },
];

export default function LeadsPage() {
  const router = useRouter();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false);
  const [selectedLeadForConversion, setSelectedLeadForConversion] = useState<any>(null);
  const [editLeadId, setEditLeadId] = useState<string>("");

  const { data: leadsData, isLoading, refetch } = api.crm.leads.getAll.useQuery({
    limit: 100,
    offset: 0,
    orderBy: { created_at: 'desc' },
  });

  const { data: pipelineStats } = api.crm.leads.getPipelineStats.useQuery();

  const createLeadMutation = api.crm.leads.create.useMutation({
    onSuccess: () => {
      toast.success("Lead created successfully");
      setIsCreateDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to create lead: " + error.message);
    },
  });

  const updateLeadMutation = api.crm.leads.update.useMutation({
    onSuccess: () => {
      toast.success("Lead updated successfully");
      setIsEditDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to update lead: " + error.message);
    },
  });

  const deleteLeadMutation = api.crm.leads.delete.useMutation({
    onSuccess: () => {
      toast.success("Lead deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to delete lead: " + error.message);
    },
  });

  const convertToClientMutation = api.crm.leads.convertToClient.useMutation({
    onSuccess: () => {
      toast.success("Lead converted to client successfully");
      setIsConvertDialogOpen(false);
      setSelectedLeadForConversion(null);
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to convert lead: " + error.message);
    },
  });

  const handleDeleteLead = (leadId: string) => {
    if (confirm("Are you sure you want to delete this lead?")) {
      deleteLeadMutation.mutate({ id: leadId });
    }
  };

  const handleEditLead = (lead: any) => {
    setEditLeadId(lead.id);
    setIsEditDialogOpen(true);
  };

  const openConversionDialog = (lead: any) => {
    setSelectedLeadForConversion(lead);
    setIsConvertDialogOpen(true);
  };

  // Form fields for create dialog
  const createFormFields: FormField[] = [
    { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Contact name' },
    { name: 'company', label: 'Company', type: 'text', required: true, placeholder: 'Company name' },
    { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'email@example.com' },
    { name: 'phone', label: 'Phone', type: 'text', placeholder: '+1 (555) 123-4567' },
    { name: 'value', label: 'Lead Value', type: 'number', placeholder: '10000' },
    {
      name: 'prospect_status',
      label: 'Prospect Status',
      type: 'select',
      options: [
        { value: '', label: 'No prospect status' },
        ...PROSPECT_STATUSES.map(s => ({ value: s.value, label: s.label })),
      ],
    },
    { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Additional notes...' },
  ];

  // Form fields for edit dialog
  const selectedLead = leadsData?.items?.find(l => l.id === editLeadId);
  const editFormFields: FormField[] = [
    { name: 'name', label: 'Name', type: 'text', required: true, defaultValue: selectedLead?.name },
    { name: 'email', label: 'Email', type: 'email', defaultValue: selectedLead?.email },
    { name: 'phone', label: 'Phone', type: 'text', defaultValue: selectedLead?.phone },
    { name: 'company', label: 'Company', type: 'text', defaultValue: selectedLead?.company },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: LEAD_STATUSES.map(s => ({ value: s.value, label: s.label })),
      defaultValue: selectedLead?.status,
    },
    {
      name: 'prospect_status',
      label: 'Prospect Status',
      type: 'select',
      options: [
        { value: '', label: 'No prospect status' },
        ...PROSPECT_STATUSES.map(s => ({ value: s.value, label: s.label })),
      ],
      defaultValue: selectedLead?.prospect_status,
    },
    { name: 'lead_value', label: 'Lead Value', type: 'number', defaultValue: selectedLead?.lead_value?.toString() },
    { name: 'notes', label: 'Notes', type: 'textarea', defaultValue: selectedLead?.notes },
  ];

  // Form fields for conversion dialog
  const conversionFormFields: FormField[] = [
    { name: 'name', label: 'Client Name', type: 'text', required: true, defaultValue: selectedLeadForConversion?.name, placeholder: 'Client name' },
    { name: 'email', label: 'Email', type: 'email', defaultValue: selectedLeadForConversion?.email, placeholder: 'email@example.com' },
    { name: 'phone', label: 'Phone', type: 'text', defaultValue: selectedLeadForConversion?.phone, placeholder: '+1 (555) 123-4567' },
    { name: 'company', label: 'Company', type: 'text', defaultValue: selectedLeadForConversion?.company, placeholder: 'Company name' },
    { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Conversion notes...' },
  ];

  // Pipeline stats configuration
  const stats: StatItem[] = pipelineStats ? [
    {
      title: 'Total Leads',
      value: pipelineStats.totalLeads,
      description: 'All leads in pipeline',
      icon: Users,
      iconColor: 'info',
    },
    {
      title: 'Pipeline Value',
      value: `$${(pipelineStats.totalValue || 0).toLocaleString()}`,
      description: 'Total potential revenue',
      icon: DollarSign,
      iconColor: 'success',
    },
    {
      title: 'Hot Prospects',
      value: (pipelineStats.prospectStats as any[]).find((s: any) => s.prospect_status === 'hot')?._count || 0,
      description: 'High-priority leads',
      icon: Target,
      iconColor: 'warning',
    },
    {
      title: 'Won This Month',
      value: (pipelineStats.statusStats as any[]).find((s: any) => s.status === 'won')?._count || 0,
      description: 'Converted leads',
      icon: TrendingUp,
      iconColor: 'success',
    },
  ] : [];

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
      key: 'prospect_status',
      label: 'Prospect',
      render: (value) => value ? <StatusBadge status={value as string} /> : <span className="text-muted">—</span>,
    },
    {
      key: 'value',
      label: 'Value',
      sortable: true,
      render: (value) => value ? (
        <div className="flex items-center gap-1">
          <DollarSign className="icon-xs text-muted" aria-hidden="true" />
          <span>${(value as number).toLocaleString()}</span>
        </div>
      ) : <span className="text-muted">—</span>,
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
                router.push(`/crm/leads/${row.id}`);
              }}
            >
              <Eye className="icon-sm" aria-hidden="true" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem
              className="dropdown-item"
              onClick={(e) => {
                e.stopPropagation();
                handleEditLead(row);
              }}
            >
              <Edit className="icon-sm" aria-hidden="true" />
              Edit Lead
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="dropdown-item"
              onClick={(e) => {
                e.stopPropagation();
                openConversionDialog(row);
              }}
            >
              <ArrowRight className="icon-sm" aria-hidden="true" />
              Convert to Client
            </DropdownMenuItem>
            <DropdownMenuItem
              className="dropdown-item-danger"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteLead(row.id);
              }}
            >
              <Trash className="icon-sm" aria-hidden="true" />
              Delete Lead
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
      label: 'Search leads',
      type: 'search',
      placeholder: 'Search by name, email, or company...',
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'all', label: 'All Statuses' },
        ...LEAD_STATUSES.map(s => ({ value: s.value, label: s.label })),
      ],
    },
    {
      key: 'prospect_status',
      label: 'Prospect',
      type: 'select',
      options: [
        { value: 'all', label: 'All Prospects' },
        ...PROSPECT_STATUSES.map(s => ({ value: s.value, label: s.label })),
      ],
    },
    {
      key: 'source',
      label: 'Source',
      type: 'select',
      options: [
        { value: 'all', label: 'All Sources' },
        { value: 'manual', label: 'Manual' },
        { value: 'website', label: 'Website' },
        { value: 'referral', label: 'Referral' },
        { value: 'social', label: 'Social Media' },
        { value: 'ads', label: 'Advertising' },
      ],
    },
  ];

  return (
    <div className="page-container">
      {/* Page Header */}
      <PageHeader
        title="Sales Pipeline"
        subtitle="Track and manage your leads"
        actions={[
          {
            label: 'New Lead',
            icon: Plus,
            onClick: () => setIsCreateDialogOpen(true),
          },
        ]}
      />

      {/* Create Lead Dialog */}
      <FormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        title="Create New Lead"
        description="Add a new lead to your sales pipeline."
        fields={createFormFields}
        onSubmit={async (data) => {
          await createLeadMutation.mutateAsync({
            name: data.name as string,
            company: data.company as string,
            email: data.email as string,
            phone: data.phone as string || undefined,
            status: 'new',
            source: 'manual',
            value: data.value ? parseFloat(data.value as string) : undefined,
            prospect_status: data.prospect_status as ProspectStatus || undefined,
            notes: data.notes as string || undefined,
            tags: [],
          });
        }}
        submitLabel="Create Lead"
        isLoading={createLeadMutation.isPending}
      />

      {/* Edit Lead Dialog */}
      <FormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        title="Edit Lead"
        description="Update lead information and details."
        fields={editFormFields}
        onSubmit={async (data) => {
          await updateLeadMutation.mutateAsync({
            id: editLeadId,
            data: {
              name: data.name as string,
              email: data.email as string || undefined,
              phone: data.phone as string || undefined,
              company: data.company as string || undefined,
              status: data.status as string || undefined,
              prospect_status: data.prospect_status === "" ? undefined : data.prospect_status as string || undefined,
              lead_value: data.lead_value ? parseFloat(data.lead_value as string) : undefined,
              notes: data.notes as string || undefined,
            },
          });
        }}
        submitLabel="Update Lead"
        isLoading={updateLeadMutation.isPending}
      />

      {/* Convert to Client Dialog */}
      <FormDialog
        open={isConvertDialogOpen}
        onOpenChange={setIsConvertDialogOpen}
        title="Convert Lead to Client"
        description={`Convert "${selectedLeadForConversion?.name}" from ${selectedLeadForConversion?.company} to a client.`}
        fields={conversionFormFields}
        onSubmit={async (data) => {
          await convertToClientMutation.mutateAsync({
            leadId: selectedLeadForConversion.id,
            clientData: {
              name: data.name as string,
              email: data.email as string || undefined,
              phone: data.phone as string || undefined,
              company: data.company as string || undefined,
              type: 'client',
              notes: data.notes as string || undefined,
            },
          });
        }}
        submitLabel="Convert to Client"
        isLoading={convertToClientMutation.isPending}
      />

      {/* Pipeline Stats */}
      {pipelineStats && <StatsGrid stats={stats} columns={4} />}

      {/* Leads DataTable */}
      {isLoading ? (
        <LoadingState message="Loading leads..." size="lg" />
      ) : !leadsData?.items || leadsData.items.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No leads found"
          description="Get started by creating your first lead."
          action={{
            label: 'Add Lead',
            onClick: () => setIsCreateDialogOpen(true),
            icon: Plus,
          }}
        />
      ) : (
        <DataTable
          data={leadsData.items}
          columns={columns}
          filters={filters}
          onRowClick={(row) => router.push(`/crm/leads/${row.id}`)}
          pagination={{ pageSize: 20, showSizeSelector: true }}
          emptyState={{
            icon: Target,
            title: 'No leads match your filters',
            description: 'Try adjusting your search or filter criteria',
          }}
        />
      )}
    </div>
  );
}
