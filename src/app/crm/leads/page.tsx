"use client";
import { getFullName, createFullName } from "@/lib/utils/name-utils";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import {
  Plus,
  Building,
  Mail,
  Phone,
  DollarSign,
  Eye,
  Users,
  TrendingUp,
  Target,
  ArrowRight,
  Pencil,
  Trash2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<any>(null);

  const { data: leadsData, isLoading, error } = api.crm.leads.getLeadsOnly.useQuery({
    limit: 100,
    offset: 0,
    orderBy: { created_at: 'desc' },
  });

  const { data: pipelineStats, error: statsError } = api.crm.leads.getPipelineStats.useQuery();

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  const createLeadMutation = api.crm.leads.create.useMutation({
    onSuccess: () => {
      toast.success("Lead created successfully");
      setIsCreateDialogOpen(false);
      // Invalidate queries for instant updates
      utils.crm.leads.getAll.invalidate();
      utils.crm.leads.getPipelineStats.invalidate();
    },
    onError: (error) => {
      toast.error("Failed to create lead: " + error.message);
    },
  });

  const updateLeadMutation = api.crm.leads.update.useMutation({
    onSuccess: () => {
      toast.success("Lead updated successfully");
      setIsEditDialogOpen(false);
      // Invalidate queries for instant updates
      utils.crm.leads.getAll.invalidate();
      utils.crm.leads.getById.invalidate();
      utils.crm.leads.getPipelineStats.invalidate();
    },
    onError: (error) => {
      toast.error("Failed to update lead: " + error.message);
    },
  });

  const deleteLeadMutation = api.crm.leads.delete.useMutation({
    onSuccess: () => {
      toast.success("Lead deleted successfully");
      setDeleteDialogOpen(false);
      setLeadToDelete(null);
      // Invalidate queries for instant updates
      utils.crm.leads.getAll.invalidate();
      utils.crm.leads.getPipelineStats.invalidate();
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
      // Invalidate queries for instant updates
      utils.crm.leads.getAll.invalidate();
      utils.crm.leads.getPipelineStats.invalidate();
      utils.crm.customers.list.invalidate();
    },
    onError: (error) => {
      toast.error("Failed to convert lead: " + error.message);
    },
  });

  const handleConfirmDelete = () => {
    if (leadToDelete) {
      deleteLeadMutation.mutate({ id: leadToDelete.id });
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

  // Prospect status update mutation
  const updateProspectStatusMutation = api.crm.leads.updateProspectStatus.useMutation({
    onSuccess: () => {
      toast.success("Prospect status updated");
      utils.crm.leads.getLeadsOnly.invalidate();
      utils.crm.leads.getProspects.invalidate();
      utils.crm.leads.getPipelineStats.invalidate();
    },
    onError: (error) => {
      toast.error("Failed to update prospect status: " + error.message);
    },
  });

  // Form fields for create dialog (no prospect_status - defaults to "Not yet")
  const createFormFields: FormField[] = [
    { name: 'first_name', label: 'First Name', type: 'text', required: true, placeholder: 'John' },
    { name: 'last_name', label: 'Last Name', type: 'text', placeholder: 'Doe' },
    { name: 'company', label: 'Company', type: 'text', required: true, placeholder: 'Company name' },
    { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'email@example.com' },
    { name: 'phone', label: 'Phone', type: 'text', placeholder: '+1 (555) 123-4567' },
    { name: 'value', label: 'Lead Value', type: 'number', placeholder: '10000' },
    { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Additional notes...' },
  ];

  // Form fields for edit dialog
  const selectedLead = leadsData?.items?.find(l => l.id === editLeadId);
  const editFormFields: FormField[] = [
    { name: 'first_name', label: 'First Name', type: 'text', required: true, defaultValue: selectedLead?.first_name },
    { name: 'last_name', label: 'Last Name', type: 'text', defaultValue: selectedLead?.last_name },
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
        { value: 'none', label: 'No prospect status' },
        ...PROSPECT_STATUSES.map(s => ({ value: s.value, label: s.label })),
      ],
      defaultValue: selectedLead?.prospect_status || 'none',
    },
    { name: 'lead_value', label: 'Lead Value', type: 'number', defaultValue: selectedLead?.lead_value?.toString() },
    { name: 'notes', label: 'Notes', type: 'textarea', defaultValue: selectedLead?.notes },
  ];

  // Form fields for conversion dialog
  const conversionFormFields: FormField[] = [
    { name: 'first_name', label: 'First Name', type: 'text', required: true, defaultValue: selectedLeadForConversion?.first_name, placeholder: 'John' },
    { name: 'last_name', label: 'Last Name', type: 'text', defaultValue: selectedLeadForConversion?.last_name, placeholder: 'Doe' },
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
      key: 'first_name',
      label: 'Name',
      sortable: true,
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="data-table-avatar">
            <Users className="icon-sm" aria-hidden="true" />
          </div>
          <span className="font-medium">{getFullName(row)}</span>
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
      label: 'Prospect Status',
      render: (value, row) => (
        <Select
          value={value as string || 'not_yet'}
          onValueChange={(newValue) => {
            const newStatus = newValue === 'not_yet' ? null : (newValue as 'cold' | 'warm' | 'hot');
            updateProspectStatusMutation.mutate({
              id: row.id,
              prospect_status: newStatus,
            });
          }}
        >
          <SelectTrigger className="w-[120px]" onClick={(e) => e.stopPropagation()}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="not_yet">Not yet</SelectItem>
            <SelectItem value="cold">Cold</SelectItem>
            <SelectItem value="warm">Warm</SelectItem>
            <SelectItem value="hot">Hot</SelectItem>
          </SelectContent>
        </Select>
      ),
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

  // Row actions configuration
  const rowActions: DataTableRowAction<any>[] = [
    {
      label: 'View Details',
      icon: Eye,
      onClick: (row) => router.push(`/crm/leads/${row.id}`),
    },
    {
      label: 'Edit',
      icon: Pencil,
      onClick: (row) => handleEditLead(row),
    },
    {
      label: 'Convert to Client',
      icon: ArrowRight,
      separator: true,
      onClick: (row) => openConversionDialog(row),
    },
    {
      label: 'Delete',
      icon: Trash2,
      variant: 'destructive',
      separator: true,
      onClick: (row) => {
        setLeadToDelete(row);
        setDeleteDialogOpen(true);
      },
    },
  ];

  if (error || statsError) {
    return (
      <div className="page-container">
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">Failed to load leads</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              {error?.message || statsError?.message || 'An error occurred while loading the leads.'}
            </p>
          </div>
          <Button
            onClick={() => {
              utils.crm.leads.getLeadsOnly.invalidate();
              utils.crm.leads.getPipelineStats.invalidate();
            }}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

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
          const fullName = createFullName(data.first_name as string, data.last_name as string);
          await createLeadMutation.mutateAsync({
            first_name: data.first_name as string,
            last_name: data.last_name as string || undefined,
            name: fullName,
            company: data.company as string,
            email: data.email as string,
            phone: data.phone as string || undefined,
            status: 'new',
            lead_source: 'manual',
            lead_value: data.value ? parseFloat(data.value as string) : undefined,
            // prospect_status defaults to null ("Not yet") - not set on creation
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
          const fullName = createFullName(data.first_name as string, data.last_name as string);
          await updateLeadMutation.mutateAsync({
            id: editLeadId,
            data: {
              first_name: data.first_name as string,
              last_name: data.last_name as string || undefined,
              name: fullName,
              email: data.email as string || undefined,
              phone: data.phone as string || undefined,
              company: data.company as string || undefined,
              status: data.status as string || undefined,
              prospect_status: (data.prospect_status === "" || data.prospect_status === "none") ? undefined : data.prospect_status as string || undefined,
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
        description={`Convert "${getFullName(selectedLeadForConversion || {})}" from ${selectedLeadForConversion?.company} to a client.`}
        fields={conversionFormFields}
        onSubmit={async (data) => {
          const fullName = createFullName(data.first_name as string, data.last_name as string);
          await convertToClientMutation.mutateAsync({
            leadId: selectedLeadForConversion.id,
            clientData: {
              first_name: data.first_name as string,
              last_name: data.last_name as string || undefined,
              name: fullName,
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
          rowActions={rowActions}
          onRowClick={(row) => router.push(`/crm/leads/${row.id}`)}
          pagination={{ pageSize: 20, showSizeSelector: true }}
          emptyState={{
            icon: Target,
            title: 'No leads match your filters',
            description: 'Try adjusting your search or filter criteria',
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lead</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {getFullName(leadToDelete || {})} from {leadToDelete?.company}? This action cannot be undone.
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
    </div>
  );
}
