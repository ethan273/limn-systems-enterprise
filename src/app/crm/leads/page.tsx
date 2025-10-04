"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  Filter,
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

type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
type ProspectStatus = 'cold' | 'warm' | 'hot';

const LEAD_STATUSES: { value: LeadStatus; label: string; className: string }[] = [
  { value: 'new', label: 'New', className: 'status-new' },
  { value: 'contacted', label: 'Contacted', className: 'status-contacted' },
  { value: 'qualified', label: 'Qualified', className: 'status-qualified' },
  { value: 'proposal', label: 'Proposal', className: 'status-proposal' },
  { value: 'negotiation', label: 'Negotiation', className: 'status-negotiation' },
  { value: 'won', label: 'Won', className: 'status-completed' },
  { value: 'lost', label: 'Lost', className: 'status-cancelled' },
];

const PROSPECT_STATUSES: { value: ProspectStatus; label: string; className: string }[] = [
  { value: 'cold', label: 'Cold', className: 'priority-low' },
  { value: 'warm', label: 'Warm', className: 'priority-medium' },
  { value: 'hot', label: 'Hot', className: 'priority-high' },
];

export default function LeadsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [prospectFilter, setProspectFilter] = useState<ProspectStatus | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [limit] = useState(20);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false);
  const [selectedLeadForConversion, setSelectedLeadForConversion] = useState<any>(null);

  // Form state for new lead
  const [newLead, setNewLead] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    status: "new" as LeadStatus,
    source: "manual",
    value: "",
    prospect_status: "" as ProspectStatus | "",
    notes: "",
    tags: [] as string[],
  });

  // Form state for conversion
  const [conversionData, setConversionData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    address: "",
    type: "client",
    notes: "",
  });

  // Form state for editing lead
  const [editLead, setEditLead] = useState({
    id: "",
    name: "",
    email: "",
    phone: "",
    company: "",
    status: "",
    lead_source: "",
    interest_level: "",
    lead_value: "",
    assigned_to: "",
    follow_up_date: "",
    notes: "",
    prospect_status: "",
    contact_method: "",
    website: "",
    pipeline_stage: "",
  });

  const { data: leadsData, isLoading, refetch } = api.crm.leads.getAll.useQuery({
    limit,
    offset: page * limit,
    orderBy: { created_at: 'desc' },
  });

  const { data: pipelineStats } = api.crm.leads.getPipelineStats.useQuery();

  const createLeadMutation = api.crm.leads.create.useMutation({
    onSuccess: () => {
      toast.success("Lead created successfully");
      setIsCreateDialogOpen(false);
      setNewLead({
        name: "",
        company: "",
        email: "",
        phone: "",
        status: "new",
        source: "manual",
        value: "",
        prospect_status: "",
        notes: "",
        tags: [],
      });
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to create lead: " + error.message);
    },
  });

  const updateLeadMutation = api.crm.leads.update.useMutation({
    onSuccess: () => {
      toast.success("Lead updated successfully");
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
      setConversionData({
        name: "",
        email: "",
        phone: "",
        company: "",
        address: "",
        type: "client",
        notes: "",
      });
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to convert lead: " + error.message);
    },
  });

  const handleCreateLead = () => {
    if (!newLead.name.trim() || !newLead.company.trim() || !newLead.email.trim()) {
      toast.error("Name, company, and email are required");
      return;
    }

    createLeadMutation.mutate({
      name: newLead.name,
      company: newLead.company,
      email: newLead.email,
      phone: newLead.phone || undefined,
      status: newLead.status,
      source: newLead.source,
      value: newLead.value ? parseFloat(newLead.value) : undefined,
      prospect_status: newLead.prospect_status || undefined,
      notes: newLead.notes || undefined,
      tags: newLead.tags,
    });
  };

  const handleDeleteLead = (leadId: string) => {
    if (confirm("Are you sure you want to delete this lead?")) {
      deleteLeadMutation.mutate({ id: leadId });
    }
  };

  const handleEditLead = (lead: any) => {
    setEditLead({
      id: lead.id,
      name: lead.name || "",
      email: lead.email || "",
      phone: lead.phone || "",
      company: lead.company || "",
      status: lead.status || "",
      lead_source: lead.lead_source || "",
      interest_level: lead.interest_level || "",
      lead_value: lead.lead_value?.toString() || "",
      assigned_to: lead.assigned_to || "",
      follow_up_date: lead.follow_up_date || "",
      notes: lead.notes || "",
      prospect_status: lead.prospect_status || "",
      contact_method: lead.contact_method || "",
      website: lead.website || "",
      pipeline_stage: lead.pipeline_stage || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateLead = () => {
    if (!editLead.name.trim()) {
      toast.error("Lead name is required");
      return;
    }

    updateLeadMutation.mutate({
      id: editLead.id,
      data: {
        name: editLead.name,
        email: editLead.email || undefined,
        phone: editLead.phone || undefined,
        company: editLead.company || undefined,
        status: editLead.status || undefined,
        lead_source: editLead.lead_source || undefined,
        interest_level: editLead.interest_level || undefined,
        lead_value: editLead.lead_value ? parseFloat(editLead.lead_value) : undefined,
        notes: editLead.notes || undefined,
        prospect_status: editLead.prospect_status === "none" ? undefined : editLead.prospect_status || undefined,
        contact_method: editLead.contact_method || undefined,
        website: editLead.website || undefined,
        pipeline_stage: editLead.pipeline_stage || undefined,
      },
    });

    setIsEditDialogOpen(false);
    setEditLead({
      id: "",
      name: "",
      email: "",
      phone: "",
      company: "",
      status: "",
      lead_source: "",
      interest_level: "",
      lead_value: "",
      assigned_to: "",
      follow_up_date: "",
      notes: "",
      prospect_status: "",
      contact_method: "",
      website: "",
      pipeline_stage: "",
    });
  };

  const handleConvertToClient = () => {
    if (!selectedLeadForConversion || !conversionData.name.trim()) {
      toast.error("Lead and client name are required");
      return;
    }

    convertToClientMutation.mutate({
      leadId: selectedLeadForConversion.id,
      clientData: {
        name: conversionData.name,
        email: conversionData.email || undefined,
        phone: conversionData.phone || undefined,
        company: conversionData.company || undefined,
        type: conversionData.type,
        notes: conversionData.notes || undefined,
      },
    });
  };

  const openConversionDialog = (lead: any) => {
    setSelectedLeadForConversion(lead);
    setConversionData({
      name: lead.name,
      email: lead.email,
      phone: lead.phone || "",
      company: lead.company,
      address: "",
      type: "client",
      notes: "",
    });
    setIsConvertDialogOpen(true);
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter('all');
    setProspectFilter('all');
    setSourceFilter('all');
    setPage(0);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = LEAD_STATUSES.find(s => s.value === status);
    if (!statusConfig) return null;

    return (
      <Badge variant="outline" className={statusConfig.className}>
        {statusConfig.label}
      </Badge>
    );
  };

  const getProspectBadge = (status: string | null) => {
    if (!status) return null;
    const statusConfig = PROSPECT_STATUSES.find(s => s.value === status);
    if (!statusConfig) return null;

    return (
      <Badge variant="outline" className={statusConfig.className}>
        {statusConfig.label}
      </Badge>
    );
  };

  // Filter leads based on search and filters
  const filteredLeads = leadsData?.items?.filter(lead => {
    const searchLower = search.toLowerCase();
    const matchesSearch = !search ||
      (lead.name && lead.name.toLowerCase().includes(searchLower)) ||
      (lead.email && lead.email.toLowerCase().includes(searchLower)) ||
      (lead.company && lead.company.toLowerCase().includes(searchLower));

    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesProspect = prospectFilter === 'all' || lead.prospect_status === prospectFilter;
    const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter;

    return matchesSearch && matchesStatus && matchesProspect && matchesSource;
  }) || [];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Sales Pipeline</h1>
          <p className="page-subtitle">Track and manage your leads</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-primary">
              <Plus className="icon-sm" aria-hidden="true" />
              New Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="card">
            <DialogHeader>
              <DialogTitle>Create New Lead</DialogTitle>
              <DialogDescription className="page-subtitle">
                Add a new lead to your sales pipeline.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="lead-name" className="text-right">
                  Name *
                </Label>
                <Input
                  id="lead-name"
                  value={newLead.name}
                  onChange={(e) => setNewLead(prev => ({ ...prev, name: e.target.value }))}
                  className="col-span-3 card"
                  placeholder="Contact name"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="lead-company" className="text-right">
                  Company *
                </Label>
                <Input
                  id="lead-company"
                  value={newLead.company}
                  onChange={(e) => setNewLead(prev => ({ ...prev, company: e.target.value }))}
                  className="col-span-3 card"
                  placeholder="Company name"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="lead-email" className="text-right">
                  Email *
                </Label>
                <Input
                  id="lead-email"
                  type="email"
                  value={newLead.email}
                  onChange={(e) => setNewLead(prev => ({ ...prev, email: e.target.value }))}
                  className="col-span-3 card"
                  placeholder="email@example.com"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="lead-phone" className="text-right">
                  Phone
                </Label>
                <Input
                  id="lead-phone"
                  value={newLead.phone}
                  onChange={(e) => setNewLead(prev => ({ ...prev, phone: e.target.value }))}
                  className="col-span-3 card"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="lead-value" className="text-right">
                  Value
                </Label>
                <Input
                  id="lead-value"
                  type="number"
                  value={newLead.value}
                  onChange={(e) => setNewLead(prev => ({ ...prev, value: e.target.value }))}
                  className="col-span-3 card"
                  placeholder="10000"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="lead-prospect" className="text-right">
                  Prospect
                </Label>
                <Select value={newLead.prospect_status} onValueChange={(value) => setNewLead(prev => ({ ...prev, prospect_status: value as ProspectStatus }))}>
                  <SelectTrigger className="col-span-3 card">
                    <SelectValue placeholder="Select prospect status" />
                  </SelectTrigger>
                  <SelectContent className="card">
                    <SelectItem value="none">No prospect status</SelectItem>
                    {PROSPECT_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="lead-notes" className="text-right">
                  Notes
                </Label>
                <Textarea
                  id="lead-notes"
                  value={newLead.notes}
                  onChange={(e) => setNewLead(prev => ({ ...prev, notes: e.target.value }))}
                  className="col-span-3 card"
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                onClick={handleCreateLead}
                disabled={createLeadMutation.isPending}
                className="btn-primary"
              >
                {createLeadMutation.isPending ? "Creating..." : "Create Lead"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Lead Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="card">
            <DialogHeader>
              <DialogTitle>Edit Lead</DialogTitle>
              <DialogDescription className="page-subtitle">
                Update lead information and details.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-lead-name" className="text-right">
                  Name *
                </Label>
                <Input
                  id="edit-lead-name"
                  value={editLead.name}
                  onChange={(e) => setEditLead(prev => ({ ...prev, name: e.target.value }))}
                  className="col-span-3 card"
                  placeholder="Lead name"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-lead-email" className="text-right">
                  Email
                </Label>
                <Input
                  id="edit-lead-email"
                  type="email"
                  value={editLead.email}
                  onChange={(e) => setEditLead(prev => ({ ...prev, email: e.target.value }))}
                  className="col-span-3 card"
                  placeholder="email@example.com"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-lead-phone" className="text-right">
                  Phone
                </Label>
                <Input
                  id="edit-lead-phone"
                  value={editLead.phone}
                  onChange={(e) => setEditLead(prev => ({ ...prev, phone: e.target.value }))}
                  className="col-span-3 card"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-lead-company" className="text-right">
                  Company
                </Label>
                <Input
                  id="edit-lead-company"
                  value={editLead.company}
                  onChange={(e) => setEditLead(prev => ({ ...prev, company: e.target.value }))}
                  className="col-span-3 card"
                  placeholder="Company name"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-lead-status" className="text-right">
                  Status
                </Label>
                <Select value={editLead.status} onValueChange={(value) => setEditLead(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="col-span-3 card">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="card">
                    {LEAD_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-lead-prospect" className="text-right">
                  Prospect Status
                </Label>
                <Select value={editLead.prospect_status} onValueChange={(value) => setEditLead(prev => ({ ...prev, prospect_status: value }))}>
                  <SelectTrigger className="col-span-3 card">
                    <SelectValue placeholder="Select prospect status" />
                  </SelectTrigger>
                  <SelectContent className="card">
                    <SelectItem value="none">No prospect status</SelectItem>
                    {PROSPECT_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-lead-value" className="text-right">
                  Lead Value
                </Label>
                <Input
                  id="edit-lead-value"
                  type="number"
                  value={editLead.lead_value}
                  onChange={(e) => setEditLead(prev => ({ ...prev, lead_value: e.target.value }))}
                  className="col-span-3 card"
                  placeholder="10000"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-lead-notes" className="text-right">
                  Notes
                </Label>
                <Textarea
                  id="edit-lead-notes"
                  value={editLead.notes}
                  onChange={(e) => setEditLead(prev => ({ ...prev, notes: e.target.value }))}
                  className="col-span-3 card"
                  placeholder="Lead notes..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="btn-secondary"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                onClick={handleUpdateLead}
                disabled={updateLeadMutation.isPending}
                className="btn-primary"
              >
                {updateLeadMutation.isPending ? "Updating..." : "Update Lead"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Convert to Client Dialog */}
        <Dialog open={isConvertDialogOpen} onOpenChange={setIsConvertDialogOpen}>
          <DialogContent className="card">
            <DialogHeader>
              <DialogTitle>Convert Lead to Client</DialogTitle>
              <DialogDescription className="page-subtitle">
                Convert &quot;{selectedLeadForConversion?.name}&quot; from {selectedLeadForConversion?.company} to a client.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="client-name" className="text-right">
                  Name *
                </Label>
                <Input
                  id="client-name"
                  value={conversionData.name}
                  onChange={(e) => setConversionData(prev => ({ ...prev, name: e.target.value }))}
                  className="col-span-3 card"
                  placeholder="Client name"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="client-email" className="text-right">
                  Email
                </Label>
                <Input
                  id="client-email"
                  type="email"
                  value={conversionData.email}
                  onChange={(e) => setConversionData(prev => ({ ...prev, email: e.target.value }))}
                  className="col-span-3 card"
                  placeholder="email@example.com"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="client-phone" className="text-right">
                  Phone
                </Label>
                <Input
                  id="client-phone"
                  value={conversionData.phone}
                  onChange={(e) => setConversionData(prev => ({ ...prev, phone: e.target.value }))}
                  className="col-span-3 card"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="client-company" className="text-right">
                  Company
                </Label>
                <Input
                  id="client-company"
                  value={conversionData.company}
                  onChange={(e) => setConversionData(prev => ({ ...prev, company: e.target.value }))}
                  className="col-span-3 card"
                  placeholder="Company name"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="client-notes" className="text-right">
                  Notes
                </Label>
                <Textarea
                  id="client-notes"
                  value={conversionData.notes}
                  onChange={(e) => setConversionData(prev => ({ ...prev, notes: e.target.value }))}
                  className="col-span-3 card"
                  placeholder="Conversion notes..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsConvertDialogOpen(false)}
                className="btn-secondary"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                onClick={handleConvertToClient}
                disabled={convertToClientMutation.isPending}
                className="btn-primary"
              >
                {convertToClientMutation.isPending ? "Converting..." : "Convert to Client"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pipeline Stats */}
      {pipelineStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-info-muted/20 rounded-lg">
                  <Users className="h-5 w-5 text-info" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm page-subtitle">Total Leads</p>
                  <p className="text-xl font-bold text-primary">{pipelineStats.totalLeads}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-success-muted/20 rounded-lg">
                  <DollarSign className="h-5 w-5 text-success" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm page-subtitle">Pipeline Value</p>
                  <p className="text-xl font-bold text-primary">
                    ${(pipelineStats.totalValue || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-warning-muted/20 rounded-lg">
                  <Target className="h-5 w-5 text-warning" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm page-subtitle">Hot Prospects</p>
                  <p className="text-xl font-bold text-primary">
                    {(pipelineStats.prospectStats as any[]).find((s: any) => s.prospect_status === 'hot')?._count || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-muted/20 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-secondary" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm page-subtitle">Won This Month</p>
                  <p className="text-xl font-bold text-primary">
                    {(pipelineStats.statusStats as any[]).find((s: any) => s.status === 'won')?._count || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="card-content-compact">
          <div className="filters-section">
            <div className="search-input-wrapper">
              <Search className="search-icon" aria-hidden="true" />
              <Input
                placeholder="Search leads..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
            </div>

            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as LeadStatus | 'all')}>
              <SelectTrigger className="filter-select">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {LEAD_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={prospectFilter} onValueChange={(value) => setProspectFilter(value as ProspectStatus | 'all')}>
              <SelectTrigger className="filter-select">
                <SelectValue placeholder="Prospect" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prospects</SelectItem>
                {PROSPECT_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="filter-select">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="website">Website</SelectItem>
                <SelectItem value="referral">Referral</SelectItem>
                <SelectItem value="social">Social Media</SelectItem>
                <SelectItem value="ads">Advertising</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={clearFilters}
              className="filter-select"
            >
              <Filter className="icon-sm" aria-hidden="true" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <div className="data-table-container">
        {isLoading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading leads...</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="empty-state">
            <Target className="empty-state-icon" aria-hidden="true" />
            <h3 className="empty-state-title">No leads found</h3>
            <p className="empty-state-description">
              Try adjusting your filters or create a new lead to get started.
            </p>
          </div>
        ) : (
          <Table>
              <TableHeader>
                <TableRow className="data-table-header-row">
                  <TableHead className="data-table-header">Name</TableHead>
                  <TableHead className="data-table-header">Company</TableHead>
                  <TableHead className="data-table-header">Email</TableHead>
                  <TableHead className="data-table-header">Phone</TableHead>
                  <TableHead className="data-table-header">Status</TableHead>
                  <TableHead className="data-table-header">Prospect</TableHead>
                  <TableHead className="data-table-header">Value</TableHead>
                  <TableHead className="data-table-header">Created</TableHead>
                  <TableHead className="data-table-header-actions">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow
                    key={lead.id}
                    className="data-table-row"
                    onClick={() => router.push(`/crm/leads/${lead.id}`)}
                  >
                    <TableCell className="data-table-cell-primary">
                      <div className="flex items-center gap-3">
                        <div className="data-table-avatar">
                          <Users className="icon-sm" aria-hidden="true" />
                        </div>
                        <span className="font-medium">{lead.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="data-table-cell">
                      {lead.company ? (
                        <div className="flex items-center gap-2">
                          <Building className="icon-xs text-muted" aria-hidden="true" />
                          <span>{lead.company}</span>
                        </div>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </TableCell>
                    <TableCell className="data-table-cell">
                      {lead.email ? (
                        <div className="flex items-center gap-2">
                          <Mail className="icon-xs text-muted" aria-hidden="true" />
                          <span className="truncate max-w-[200px]">{lead.email}</span>
                        </div>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </TableCell>
                    <TableCell className="data-table-cell">
                      {lead.phone ? (
                        <div className="flex items-center gap-2">
                          <Phone className="icon-xs text-muted" aria-hidden="true" />
                          <span>{lead.phone}</span>
                        </div>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </TableCell>
                    <TableCell className="data-table-cell">
                      {getStatusBadge(lead.status)}
                    </TableCell>
                    <TableCell className="data-table-cell">
                      {getProspectBadge(lead.prospect_status)}
                    </TableCell>
                    <TableCell className="data-table-cell">
                      {lead.value ? (
                        <div className="flex items-center gap-1">
                          <DollarSign className="icon-xs text-muted" aria-hidden="true" />
                          <span>${lead.value.toLocaleString()}</span>
                        </div>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </TableCell>
                    <TableCell className="data-table-cell">
                      {lead.created_at && (
                        <span className="text-sm">
                          {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="data-table-cell-actions">
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
                              router.push(`/crm/leads/${lead.id}`);
                            }}
                          >
                            <Eye className="icon-sm" aria-hidden="true" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="dropdown-item"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditLead(lead);
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
                              openConversionDialog(lead);
                            }}
                          >
                            <ArrowRight className="icon-sm" aria-hidden="true" />
                            Convert to Client
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="dropdown-item-danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteLead(lead.id);
                            }}
                          >
                            <Trash className="icon-sm" aria-hidden="true" />
                            Delete Lead
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
        )}

        {/* Pagination */}
        {leadsData && leadsData.total > limit && (
          <div className="data-table-pagination">
            <div className="data-table-pagination-info">
              Showing {page * limit + 1} to {Math.min((page + 1) * limit, leadsData.total)} of {leadsData.total} leads
            </div>
            <div className="data-table-pagination-controls">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="btn-secondary"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={!leadsData.hasMore}
                className="btn-secondary"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
