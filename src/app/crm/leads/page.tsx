"use client";

import { useState } from "react";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  Filter,
  Plus,
  MoreVertical,
  Calendar,
  ChevronDown,
  ChevronUp,
  Building,
  Mail,
  Phone,
  User,
  Tag,
  Edit,
  Trash,
  CheckSquare,
  Square,
  DollarSign,
  TrendingUp,
  Users,
  Target,
  Briefcase,
  ArrowRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
type ProspectStatus = 'cold' | 'warm' | 'hot';

const LEAD_STATUSES: { value: LeadStatus; label: string; color: string }[] = [
  { value: 'new', label: 'New', color: 'bg-blue-500' },
  { value: 'contacted', label: 'Contacted', color: 'bg-yellow-500' },
  { value: 'qualified', label: 'Qualified', color: 'bg-purple-500' },
  { value: 'proposal', label: 'Proposal', color: 'bg-orange-500' },
  { value: 'negotiation', label: 'Negotiation', color: 'bg-pink-500' },
  { value: 'won', label: 'Won', color: 'bg-green-500' },
  { value: 'lost', label: 'Lost', color: 'bg-red-500' },
];

const PROSPECT_STATUSES: { value: ProspectStatus; label: string; color: string }[] = [
  { value: 'cold', label: 'Cold', color: 'bg-blue-500' },
  { value: 'warm', label: 'Warm', color: 'bg-yellow-500' },
  { value: 'hot', label: 'Hot', color: 'bg-red-500' },
];

export default function LeadsPage() {
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
  const [expandedLeads, setExpandedLeads] = useState<Set<string>>(new Set());
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [showBulkOps, setShowBulkOps] = useState(false);

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

  const updateProspectStatusMutation = api.crm.leads.updateProspectStatus.useMutation({
    onSuccess: () => {
      toast.success("Prospect status updated successfully");
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to update prospect status: " + error.message);
    },
  });

  const handleLeadUpdate = () => {
    refetch();
  };

  const toggleLeadExpanded = (leadId: string) => {
    const newExpanded = new Set(expandedLeads);
    if (newExpanded.has(leadId)) {
      newExpanded.delete(leadId);
    } else {
      newExpanded.add(leadId);
    }
    setExpandedLeads(newExpanded);
  };

  const handleLeadSelection = (leadId: string, selected: boolean) => {
    setSelectedLeads(prev => {
      if (selected) {
        const newSelection = [...prev, leadId];
        setShowBulkOps(newSelection.length > 0);
        return newSelection;
      } else {
        const newSelection = prev.filter(id => id !== leadId);
        setShowBulkOps(newSelection.length > 0);
        return newSelection;
      }
    });
  };

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

  const handleSendEmail = (lead: any) => {
    if (lead.email) {
      window.open(`mailto:${lead.email}`, '_blank');
    } else {
      toast.error("No email address available for this lead");
    }
  };

  const handleMarkAsProspect = (lead: any) => {
    if (lead.prospect_status) {
      toast.error("This lead is already marked as a prospect");
      return;
    }

    // Default to 'warm' prospect status when marking as prospect
    updateProspectStatusMutation.mutate({
      id: lead.id,
      prospect_status: 'warm',
    });

    toast.success("Lead marked as prospect (warm)");
  };

  const handleStatusUpdate = (leadId: string, newStatus: LeadStatus) => {
    updateLeadMutation.mutate({
      id: leadId,
      data: { status: newStatus },
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

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = LEAD_STATUSES.find(s => s.value === status);
    if (!statusConfig) return null;

    return (
      <Badge variant="outline" className={`text-white border-0 ${statusConfig.color}`}>
        {statusConfig.label}
      </Badge>
    );
  };

  const getProspectBadge = (status: string | null) => {
    if (!status) return null;
    const statusConfig = PROSPECT_STATUSES.find(s => s.value === status);
    if (!statusConfig) return null;

    return (
      <Badge variant="outline" className={`text-white border-0 ${statusConfig.color}`}>
        {statusConfig.label}
      </Badge>
    );
  };

  // Filter leads based on search and filters
  const filteredLeads = leadsData?.items?.filter(lead => {
    const matchesSearch = !search ||
      lead.name.toLowerCase().includes(search.toLowerCase()) ||
      lead.email.toLowerCase().includes(search.toLowerCase()) ||
      lead.company.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesProspect = prospectFilter === 'all' || lead.prospect_status === prospectFilter;
    const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter;

    return matchesSearch && matchesStatus && matchesProspect && matchesSource;
  }) || [];

  return (
    <div className="p-6 space-y-6">
      {/* Header with Pipeline Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Sales Pipeline</h1>
          <p className="text-muted-foreground">Track and manage your leads</p>
        </div>
        <div className="flex items-center gap-3">
          {showBulkOps && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
              <span className="text-sm text-blue-300">{selectedLeads.length} selected</span>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                onClick={() => {
                  if (confirm(`Delete ${selectedLeads.length} selected leads?`)) {
                    selectedLeads.forEach(id => deleteLeadMutation.mutate({ id }));
                    setSelectedLeads([]);
                    setShowBulkOps(false);
                  }
                }}
              >
                <Trash className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          )}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                New Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Lead</DialogTitle>
                <DialogDescription className="text-gray-400">
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
                    className="col-span-3 bg-gray-700 border-gray-600"
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
                    className="col-span-3 bg-gray-700 border-gray-600"
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
                    className="col-span-3 bg-gray-700 border-gray-600"
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
                    className="col-span-3 bg-gray-700 border-gray-600"
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
                    className="col-span-3 bg-gray-700 border-gray-600"
                    placeholder="10000"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="lead-prospect" className="text-right">
                    Prospect
                  </Label>
                  <Select value={newLead.prospect_status} onValueChange={(value) => setNewLead(prev => ({ ...prev, prospect_status: value as ProspectStatus }))}>
                    <SelectTrigger className="col-span-3 bg-gray-700 border-gray-600">
                      <SelectValue placeholder="Select prospect status" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
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
                    className="col-span-3 bg-gray-700 border-gray-600"
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
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {createLeadMutation.isPending ? "Creating..." : "Create Lead"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Pipeline Stats */}
      {pipelineStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Users className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Leads</p>
                  <p className="text-xl font-bold text-primary">{pipelineStats.totalLeads}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Pipeline Value</p>
                  <p className="text-xl font-bold text-primary">
                    ${(pipelineStats.totalValue || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Target className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Hot Prospects</p>
                  <p className="text-xl font-bold text-primary">
                    {pipelineStats.prospectStats.find(s => s.prospect_status === 'hot')?._count || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Won This Month</p>
                  <p className="text-xl font-bold text-primary">
                    {pipelineStats.statusStats.find(s => s.status === 'won')?._count || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-primary">Filters</CardTitle>
        </CardHeader>
        <CardContent className="filters-section">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search leads..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-gray-700 border-gray-600"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as LeadStatus | 'all')}>
              <SelectTrigger className="bg-gray-700 border-gray-600">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all">All Statuses</SelectItem>
                {LEAD_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Prospect Filter */}
            <Select value={prospectFilter} onValueChange={(value) => setProspectFilter(value as ProspectStatus | 'all')}>
              <SelectTrigger className="bg-gray-700 border-gray-600">
                <SelectValue placeholder="Prospect" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all">All Prospects</SelectItem>
                {PROSPECT_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Source Filter */}
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="bg-gray-700 border-gray-600">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="website">Website</SelectItem>
                <SelectItem value="referral">Referral</SelectItem>
                <SelectItem value="social">Social Media</SelectItem>
                <SelectItem value="ads">Advertising</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            <Button
              variant="outline"
              onClick={clearFilters}
              className="border-gray-600 hover:bg-gray-700"
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Leads List */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-primary">
            Leads ({filteredLeads.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {isLoading ? (
              <div className="text-center py-12 text-gray-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p>Loading leads...</p>
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <div className="mb-4">
                  <Briefcase className="h-12 w-12 mx-auto text-gray-600" />
                </div>
                <h3 className="text-lg font-medium mb-2">No leads found</h3>
                <p className="text-sm">Try adjusting your filters or create a new lead to get started.</p>
              </div>
            ) : (
              filteredLeads.map((lead) => {
                const isExpanded = expandedLeads.has(lead.id);
                const isSelected = selectedLeads.includes(lead.id);

                return (
                  <Collapsible key={lead.id} open={isExpanded}>
                    <div className={`rounded-lg border transition-colors ${
                      isExpanded
                        ? 'border-blue-500/50 bg-blue-500/5'
                        : 'border-gray-700 hover:border-gray-600 bg-gray-800/30'
                    }`}>
                      <CollapsibleTrigger
                        className="w-full p-4 text-left"
                        onClick={() => toggleLeadExpanded(lead.id)}
                      >
                        <div className="flex items-center gap-4">
                          {/* Selection Checkbox */}
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLeadSelection(lead.id, !isSelected);
                            }}
                            className="p-1 h-auto hover:bg-gray-600 rounded cursor-pointer flex items-center justify-center"
                          >
                            {isSelected ? (
                              <CheckSquare className="h-4 w-4 text-blue-400" />
                            ) : (
                              <Square className="h-4 w-4 text-gray-400" />
                            )}
                          </div>

                          {/* Lead Avatar */}
                          <Avatar className="h-10 w-10 border border-gray-600">
                            <AvatarFallback className="bg-gray-600 text-white">
                              {getInitials(lead.name)}
                            </AvatarFallback>
                          </Avatar>

                          {/* Expand Icon */}
                          <div className="flex-shrink-0">
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-gray-400" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            )}
                          </div>

                          {/* Lead Info */}
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-start gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1">
                                  <h3 className="font-medium text-primary truncate">{lead.name}</h3>
                                  <Badge variant="outline" className="text-xs text-blue-300 border-blue-500/30">
                                    <Building className="h-3 w-3 mr-1" />
                                    {lead.company}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-400">
                                  <div className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    <span className="truncate">{lead.email}</span>
                                  </div>
                                  {lead.phone && (
                                    <div className="flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      <span>{lead.phone}</span>
                                    </div>
                                  )}
                                  {lead.value && (
                                    <div className="flex items-center gap-1">
                                      <DollarSign className="h-3 w-3" />
                                      <span>${lead.value.toLocaleString()}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Status Badges */}
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {getStatusBadge(lead.status)}
                                {getProspectBadge(lead.prospect_status)}
                              </div>
                            </div>

                            {/* Tags */}
                            {lead.tags && lead.tags.length > 0 && (
                              <div className="flex gap-1 flex-wrap">
                                {lead.tags.slice(0, 3).map((tag: string, index: number) => (
                                  <Badge key={index} variant="outline" className="text-xs text-tertiary border-gray-600">
                                    <Tag className="h-3 w-3 mr-1" />
                                    {tag}
                                  </Badge>
                                ))}
                                {lead.tags.length > 3 && (
                                  <Badge variant="outline" className="text-xs text-tertiary border-gray-600">
                                    +{lead.tags.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            {lead.created_at && (
                              <div className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                              </div>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <div
                                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-gray-600 h-9 px-3 cursor-pointer"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="h-4 w-4 text-gray-400" />
                                </div>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                                <DropdownMenuItem
                                  className="text-sm hover:bg-gray-700"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditLead(lead);
                                  }}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Lead
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {!lead.prospect_status ? (
                                  <DropdownMenuItem
                                    className="text-sm hover:bg-gray-700"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMarkAsProspect(lead);
                                    }}
                                  >
                                    <Target className="h-4 w-4 mr-2" />
                                    Mark as Prospect
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    className="text-sm hover:bg-gray-700 text-gray-400"
                                    disabled
                                  >
                                    <Target className="h-4 w-4 mr-2" />
                                    Already a Prospect
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  className="text-sm hover:bg-gray-700"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openConversionDialog(lead);
                                  }}
                                >
                                  <ArrowRight className="h-4 w-4 mr-2" />
                                  Convert to Client
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-sm hover:bg-gray-700"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSendEmail(lead);
                                  }}
                                >
                                  <Mail className="h-4 w-4 mr-2" />
                                  Send Email
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-sm text-red-400 hover:bg-red-900/20"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteLead(lead.id);
                                  }}
                                >
                                  <Trash className="h-4 w-4 mr-2" />
                                  Delete Lead
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CollapsibleTrigger>

                      {/* Expandable Content */}
                      <CollapsibleContent>
                        <Separator className="bg-gray-700" />
                        <div className="p-4 pt-6 bg-gray-800/80">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Lead Details */}
                            <div className="space-y-4">
                              <h4 className="font-medium text-primary">Lead Information</h4>
                              <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                  <Building className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm">{lead.company}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <Mail className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm">{lead.email}</span>
                                </div>
                                {lead.phone && (
                                  <div className="flex items-center gap-3">
                                    <Phone className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm">{lead.phone}</span>
                                  </div>
                                )}
                                {lead.source && (
                                  <div className="flex items-center gap-3">
                                    <Tag className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm capitalize">{lead.source}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Pipeline Management */}
                            <div className="space-y-4">
                              <h4 className="font-medium text-primary">Pipeline Management</h4>
                              <div className="space-y-3">
                                <div>
                                  <Label className="text-sm text-gray-400">Status</Label>
                                  <Select value={lead.status} onValueChange={(value) => handleStatusUpdate(lead.id, value as LeadStatus)}>
                                    <SelectTrigger className="mt-1 bg-gray-700 border-gray-600">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-800 border-gray-700">
                                      {LEAD_STATUSES.map((status) => (
                                        <SelectItem key={status.value} value={status.value}>
                                          {status.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                {lead.value && (
                                  <div className="flex items-center gap-3">
                                    <DollarSign className="h-4 w-4 text-green-400" />
                                    <span className="text-sm">${lead.value.toLocaleString()} potential value</span>
                                  </div>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openConversionDialog(lead)}
                                  className="w-full border-green-600 text-green-400 hover:bg-green-500/20"
                                >
                                  <ArrowRight className="h-4 w-4 mr-2" />
                                  Convert to Client
                                </Button>
                              </div>
                            </div>

                            {/* Notes & Activity */}
                            <div className="space-y-4">
                              <h4 className="font-medium text-primary">Notes & Activity</h4>
                              {lead.notes ? (
                                <div className="p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                                  <p className="text-sm text-gray-300">{lead.notes}</p>
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500">No notes available</p>
                              )}

                              {/* Placeholder for future activity feed */}
                              <div className="text-xs text-gray-500">
                                Activity tracking coming soon...
                              </div>
                            </div>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {leadsData && leadsData.total > limit && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-700">
              <div className="text-sm text-gray-400">
                Showing {page * limit + 1} to {Math.min((page + 1) * limit, leadsData.total)} of {leadsData.total} leads
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="border-gray-600 hover:bg-gray-700"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={!leadsData.hasMore}
                  className="border-gray-600 hover:bg-gray-700"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Lead Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
            <DialogDescription className="text-gray-400">
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
                className="col-span-3 bg-gray-700 border-gray-600"
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
                className="col-span-3 bg-gray-700 border-gray-600"
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
                className="col-span-3 bg-gray-700 border-gray-600"
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
                className="col-span-3 bg-gray-700 border-gray-600"
                placeholder="Company name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-lead-status" className="text-right">
                Status
              </Label>
              <Select value={editLead.status} onValueChange={(value) => setEditLead(prev => ({ ...prev, status: value }))}>
                <SelectTrigger className="col-span-3 bg-gray-700 border-gray-600">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
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
                <SelectTrigger className="col-span-3 bg-gray-700 border-gray-600">
                  <SelectValue placeholder="Select prospect status" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
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
                className="col-span-3 bg-gray-700 border-gray-600"
                placeholder="10000"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-lead-website" className="text-right">
                Website
              </Label>
              <Input
                id="edit-lead-website"
                value={editLead.website}
                onChange={(e) => setEditLead(prev => ({ ...prev, website: e.target.value }))}
                className="col-span-3 bg-gray-700 border-gray-600"
                placeholder="https://example.com"
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
                className="col-span-3 bg-gray-700 border-gray-600"
                placeholder="Lead notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="border-gray-600 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleUpdateLead}
              disabled={updateLeadMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {updateLeadMutation.isPending ? "Updating..." : "Update Lead"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Convert to Client Dialog */}
      <Dialog open={isConvertDialogOpen} onOpenChange={setIsConvertDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Convert Lead to Client</DialogTitle>
            <DialogDescription className="text-gray-400">
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
                className="col-span-3 bg-gray-700 border-gray-600"
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
                className="col-span-3 bg-gray-700 border-gray-600"
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
                className="col-span-3 bg-gray-700 border-gray-600"
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
                className="col-span-3 bg-gray-700 border-gray-600"
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
                className="col-span-3 bg-gray-700 border-gray-600"
                placeholder="Conversion notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConvertDialogOpen(false)}
              className="border-gray-600 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleConvertToClient}
              disabled={convertToClientMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {convertToClientMutation.isPending ? "Converting..." : "Convert to Client"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}