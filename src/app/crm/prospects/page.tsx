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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  Filter,
  MoreVertical,
  Calendar,
  ChevronDown,
  ChevronUp,
  Building,
  Mail,
  Phone,
  Tag,
  Edit,
  Trash,
  CheckSquare,
  Square,
  DollarSign,
  Users,
  Target,
  ArrowRight,
  Thermometer,
  Clock,
  Star,
  Activity,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

type ProspectStatus = 'cold' | 'warm' | 'hot';
type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';

const PROSPECT_STATUSES: {
  value: ProspectStatus;
  label: string;
  color: string;
  bgColor: string;
  description: string;
}[] = [
  {
    value: 'hot',
    label: 'Hot',
    color: 'text-red-400',
    bgColor: 'bg-red-500',
    description: 'Ready to buy, high interest'
  },
  {
    value: 'warm',
    label: 'Warm',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500',
    description: 'Engaged, needs nurturing'
  },
  {
    value: 'cold',
    label: 'Cold',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500',
    description: 'Early stage, requires attention'
  },
];

export default function ProspectsPage() {
  const [search, setSearch] = useState("");
  const [prospectFilter, setProspectFilter] = useState<ProspectStatus | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [page, setPage] = useState(0);
  const [limit] = useState(20);
  const [expandedProspects, setExpandedProspects] = useState<Set<string>>(new Set());
  const [selectedProspects, setSelectedProspects] = useState<string[]>([]);
  const [showBulkOps, setShowBulkOps] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Form state for editing prospect
  const [editProspect, setEditProspect] = useState({
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

  const { data: prospectsData, isLoading, refetch } = api.crm.leads.getProspects.useQuery({
    limit,
    offset: page * limit,
    prospect_status: prospectFilter === 'all' ? undefined : prospectFilter,
    status: statusFilter === 'all' ? undefined : statusFilter,
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

  const updateLeadMutation = api.crm.leads.update.useMutation({
    onSuccess: () => {
      toast.success("Prospect updated successfully");
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to update prospect: " + error.message);
    },
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

  const toggleProspectExpanded = (prospectId: string) => {
    const newExpanded = new Set(expandedProspects);
    if (newExpanded.has(prospectId)) {
      newExpanded.delete(prospectId);
    } else {
      newExpanded.add(prospectId);
    }
    setExpandedProspects(newExpanded);
  };

  const handleProspectSelection = (prospectId: string, selected: boolean) => {
    setSelectedProspects(prev => {
      if (selected) {
        const newSelection = [...prev, prospectId];
        setShowBulkOps(newSelection.length > 0);
        return newSelection;
      } else {
        const newSelection = prev.filter(id => id !== prospectId);
        setShowBulkOps(newSelection.length > 0);
        return newSelection;
      }
    });
  };

  const handleProspectStatusUpdate = (prospectId: string, newStatus: ProspectStatus | null) => {
    updateProspectStatusMutation.mutate({
      id: prospectId,
      prospect_status: newStatus,
    });
  };

  const handleDeleteProspect = (prospectId: string) => {
    if (confirm("Are you sure you want to delete this prospect?")) {
      deleteLeadMutation.mutate({ id: prospectId });
    }
  };

  const handleBulkStatusUpdate = (status: ProspectStatus) => {
    selectedProspects.forEach(id => {
      updateProspectStatusMutation.mutate({
        id,
        prospect_status: status,
      });
    });
    setSelectedProspects([]);
    setShowBulkOps(false);
  };

  const handleEditProspect = (prospect: any) => {
    setEditProspect({
      id: prospect.id,
      name: prospect.name || "",
      email: prospect.email || "",
      phone: prospect.phone || "",
      company: prospect.company || "",
      status: prospect.status || "",
      lead_source: prospect.lead_source || "",
      interest_level: prospect.interest_level || "",
      lead_value: prospect.lead_value?.toString() || "",
      assigned_to: prospect.assigned_to || "",
      follow_up_date: prospect.follow_up_date || "",
      notes: prospect.notes || "",
      prospect_status: prospect.prospect_status || "",
      contact_method: prospect.contact_method || "",
      website: prospect.website || "",
      pipeline_stage: prospect.pipeline_stage || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateProspect = () => {
    if (!editProspect.name.trim()) {
      toast.error("Prospect name is required");
      return;
    }

    updateLeadMutation.mutate({
      id: editProspect.id,
      data: {
        name: editProspect.name,
        email: editProspect.email || undefined,
        phone: editProspect.phone || undefined,
        company: editProspect.company || undefined,
        status: editProspect.status || undefined,
        lead_source: editProspect.lead_source || undefined,
        interest_level: editProspect.interest_level || undefined,
        lead_value: editProspect.lead_value ? parseFloat(editProspect.lead_value) : undefined,
        notes: editProspect.notes || undefined,
        prospect_status: editProspect.prospect_status === "none" ? undefined : editProspect.prospect_status || undefined,
        contact_method: editProspect.contact_method || undefined,
        website: editProspect.website || undefined,
        pipeline_stage: editProspect.pipeline_stage || undefined,
      },
    });

    setIsEditDialogOpen(false);
    setEditProspect({
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

  const handleSendEmail = (prospect: any) => {
    if (prospect.email) {
      window.open(`mailto:${prospect.email}`, '_blank');
    } else {
      toast.error("No email address available for this prospect");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setProspectFilter('all');
    setStatusFilter('all');
    setPage(0);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getProspectConfig = (status: string | null) => {
    return PROSPECT_STATUSES.find(s => s.value === status);
  };

  const getProspectPriority = (prospect: any): number => {
    const statusPriority = { 'hot': 3, 'warm': 2, 'cold': 1 };
    const statusScore = statusPriority[prospect.prospect_status as ProspectStatus] || 0;
    const valueScore = prospect.value ? Math.min(prospect.value / 10000, 3) : 0;
    const timeScore = prospect.created_at ?
      Math.max(0, 3 - Math.floor((Date.now() - new Date(prospect.created_at).getTime()) / (1000 * 60 * 60 * 24 * 7))) : 0;

    return Math.round(statusScore + valueScore + timeScore);
  };

  // Filter prospects based on search and filters
  const filteredProspects = (prospectsData?.items as any[] || []).filter((prospect: any) => {
    const matchesSearch = !search ||
      prospect.name.toLowerCase().includes(search.toLowerCase()) ||
      prospect.email.toLowerCase().includes(search.toLowerCase()) ||
      prospect.company.toLowerCase().includes(search.toLowerCase());

    return matchesSearch;
  }) || [];

  // Sort prospects by priority and status
  const sortedProspects = [...filteredProspects].sort((a: any, b: any) => {
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
    count: filteredProspects.filter((p: any) => p.prospect_status === status.value).length,
    totalValue: filteredProspects
      .filter((p: any) => p.prospect_status === status.value)
      .reduce((sum: number, p: any) => sum + (p.value || 0), 0),
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Prospects</h1>
          <p className="text-muted-foreground">Manage qualified prospects in your sales pipeline</p>
        </div>
        <div className="flex items-center gap-3">
          {showBulkOps && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
              <span className="text-sm text-blue-300">{selectedProspects.length} selected</span>
              <div className="flex gap-1">
                {PROSPECT_STATUSES.map(status => (
                  <Button
                    key={status.value}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleBulkStatusUpdate(status.value)}
                    className={`${status.color} hover: text-xs`}
                  >
                    {status.label}
                  </Button>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                onClick={() => {
                  if (confirm(`Delete ${selectedProspects.length} selected prospects?`)) {
                    selectedProspects.forEach(id => deleteLeadMutation.mutate({ id }));
                    setSelectedProspects([]);
                    setShowBulkOps(false);
                  }
                }}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Prospect Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {prospectsByStatus.map((status) => (
          <Card key={status.value} className="card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 ${status.bgColor}/20 rounded-lg`}>
                  <Thermometer className={`h-6 w-6 ${status.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-semibold ${status.color}`}>{status.label} Prospects</h3>
                    <Badge variant="secondary" className="text-xs">
                      {status.count}
                    </Badge>
                  </div>
                  <p className="text-xs text-secondary mb-2">{status.description}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-secondary" />
                      <span className="text-secondary">{status.count} prospects</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-secondary" />
                      <span className="text-secondary">${status.totalValue.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-primary">Filters</CardTitle>
        </CardHeader>
        <CardContent className="filters-section">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary" />
              <Input
                placeholder="Search prospects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 list-item "
              />
            </div>

            {/* Prospect Status Filter */}
            <Select value={prospectFilter} onValueChange={(value) => setProspectFilter(value as ProspectStatus | 'all')}>
              <SelectTrigger className="list-item ">
                <SelectValue placeholder="Prospect Status" />
              </SelectTrigger>
              <SelectContent className="card">
                <SelectItem value="all">All Prospects</SelectItem>
                {PROSPECT_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label} Prospects
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Lead Status Filter */}
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as LeadStatus | 'all')}>
              <SelectTrigger className="list-item ">
                <SelectValue placeholder="Lead Status" />
              </SelectTrigger>
              <SelectContent className="card">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="proposal">Proposal</SelectItem>
                <SelectItem value="negotiation">Negotiation</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            <Button
              variant="outline"
              onClick={clearFilters}
              className=" hover:list-item"
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Prospects List */}
      <Card className="card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-primary">
            Prospects ({sortedProspects.length}) - Sorted by Priority
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {isLoading ? (
              <div className="text-center py-12 page-subtitle">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p>Loading prospects...</p>
              </div>
            ) : sortedProspects.length === 0 ? (
              <div className="text-center py-12 page-subtitle">
                <div className="mb-4">
                  <Target className="h-12 w-12 mx-auto " />
                </div>
                <h3 className="text-lg font-medium mb-2">No prospects found</h3>
                <p className="text-sm">Try adjusting your filters or convert some leads to prospects.</p>
              </div>
            ) : (
              sortedProspects.map((prospect) => {
                const isExpanded = expandedProspects.has(prospect.id);
                const isSelected = selectedProspects.includes(prospect.id);
                const prospectConfig = getProspectConfig(prospect.prospect_status);
                const priority = getProspectPriority(prospect);

                return (
                  <Collapsible key={prospect.id} open={isExpanded}>
                    <div className={`rounded-lg border transition-colors ${
                      isExpanded
                        ? 'border-blue-500/50 bg-blue-500/5'
                        : 'hover: card/30'
                    }`}>
                      <CollapsibleTrigger
                        className="w-full p-4 text-left"
                        onClick={() => toggleProspectExpanded(prospect.id)}
                      >
                        <div className="flex items-center gap-4">
                          {/* Selection Checkbox */}
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              handleProspectSelection(prospect.id, !isSelected);
                            }}
                            className="p-1 h-auto hover: rounded cursor-pointer flex items-center justify-center"
                          >
                            {isSelected ? (
                              <CheckSquare className="h-4 w-4 text-blue-400" />
                            ) : (
                              <Square className="h-4 w-4 text-secondary" />
                            )}
                          </div>

                          {/* Priority Score */}
                          <div className="flex items-center gap-1">
                            <Star className={`h-4 w-4 ${priority >= 5 ? 'text-yellow-400' : 'text-tertiary'}`} />
                            <span className="text-xs text-secondary font-mono">{priority}</span>
                          </div>

                          {/* Prospect Avatar */}
                          <Avatar className="h-10 w-10 border ">
                            <AvatarFallback className=" text-white">
                              {getInitials(prospect.name)}
                            </AvatarFallback>
                          </Avatar>

                          {/* Expand Icon */}
                          <div className="flex-shrink-0">
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-secondary" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-secondary" />
                            )}
                          </div>

                          {/* Prospect Info */}
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-start gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1">
                                  <h3 className="font-medium text-primary truncate">{prospect.name}</h3>
                                  <Badge variant="outline" className="text-xs text-blue-300 border-blue-500/30">
                                    <Building className="h-3 w-3 mr-1" />
                                    {prospect.company}
                                  </Badge>
                                  {prospectConfig && (
                                    <Badge variant="outline" className={`text-white border-0 ${prospectConfig.bgColor}`}>
                                      <Thermometer className="h-3 w-3 mr-1" />
                                      {prospectConfig.label}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 text-sm page-subtitle">
                                  <div className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    <span className="truncate">{prospect.email}</span>
                                  </div>
                                  {prospect.phone && (
                                    <div className="flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      <span>{prospect.phone}</span>
                                    </div>
                                  )}
                                  {prospect.value && (
                                    <div className="flex items-center gap-1">
                                      <DollarSign className="h-3 w-3" />
                                      <span>${prospect.value.toLocaleString()}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Status and Lead Stage */}
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <Badge variant="outline" className="text-xs text-secondary ">
                                  {prospect.status?.charAt(0).toUpperCase() + prospect.status?.slice(1)}
                                </Badge>
                              </div>
                            </div>

                            {/* Tags */}
                            {prospect.tags && prospect.tags.length > 0 && (
                              <div className="flex gap-1 flex-wrap">
                                {prospect.tags.slice(0, 3).map((tag: string, index: number) => (
                                  <Badge key={index} variant="outline" className="text-xs text-tertiary ">
                                    <Tag className="h-3 w-3 mr-1" />
                                    {tag}
                                  </Badge>
                                ))}
                                {prospect.tags.length > 3 && (
                                  <Badge variant="outline" className="text-xs text-tertiary ">
                                    +{prospect.tags.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            {prospect.created_at && (
                              <div className="text-xs text-tertiary">
                                {formatDistanceToNow(new Date(prospect.created_at), { addSuffix: true })}
                              </div>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <div
                                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover: h-9 px-3 cursor-pointer"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="h-4 w-4 text-secondary" />
                                </div>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="card">
                                <DropdownMenuItem
                                  className="text-sm hover:list-item"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditProspect(prospect);
                                  }}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Prospect
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-sm hover:list-item"
                                  onClick={(e) => {
                                    e.stopPropagation();
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
                                  }}
                                >
                                  <ArrowRight className="h-4 w-4 mr-2" />
                                  Convert to Client
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-sm hover:list-item"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSendEmail(prospect);
                                  }}
                                >
                                  <Mail className="h-4 w-4 mr-2" />
                                  Send Email
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-sm hover:list-item">
                                  <Calendar className="h-4 w-4 mr-2" />
                                  Schedule Follow-up
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-sm text-red-400 hover:bg-red-900/20"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteProspect(prospect.id);
                                  }}
                                >
                                  <Trash className="h-4 w-4 mr-2" />
                                  Delete Prospect
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CollapsibleTrigger>

                      {/* Expandable Content */}
                      <CollapsibleContent>
                        <Separator />
                        <div className="p-4 pt-6 card-content">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Prospect Details */}
                            <div className="space-y-4">
                              <h4 className="font-medium text-primary">Prospect Information</h4>
                              <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                  <Building className="h-4 w-4 text-secondary" />
                                  <span className="text-sm">{prospect.company}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <Mail className="h-4 w-4 text-secondary" />
                                  <span className="text-sm">{prospect.email}</span>
                                </div>
                                {prospect.phone && (
                                  <div className="flex items-center gap-3">
                                    <Phone className="h-4 w-4 text-secondary" />
                                    <span className="text-sm">{prospect.phone}</span>
                                  </div>
                                )}
                                {prospect.source && (
                                  <div className="flex items-center gap-3">
                                    <Tag className="h-4 w-4 text-secondary" />
                                    <span className="text-sm capitalize">{prospect.source}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-3">
                                  <Star className="h-4 w-4 text-yellow-400" />
                                  <span className="text-sm">Priority Score: {priority}/10</span>
                                </div>
                              </div>
                            </div>

                            {/* Prospect Management */}
                            <div className="space-y-4">
                              <h4 className="font-medium text-primary">Prospect Management</h4>
                              <div className="space-y-3">
                                <div>
                                  <Label className="text-sm page-subtitle">Prospect Status</Label>
                                  <Select
                                    value={prospect.prospect_status || 'none'}
                                    onValueChange={(value) => handleProspectStatusUpdate(
                                      prospect.id,
                                      value === 'none' ? null : value as ProspectStatus
                                    )}
                                  >
                                    <SelectTrigger className="mt-1 list-item ">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="card">
                                      <SelectItem value="none">No Prospect Status</SelectItem>
                                      {PROSPECT_STATUSES.map((status) => (
                                        <SelectItem key={status.value} value={status.value}>
                                          <div className="flex items-center gap-2">
                                            <Thermometer className={`h-3 w-3 ${status.color}`} />
                                            {status.label}
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                {prospect.value && (
                                  <div className="flex items-center gap-3">
                                    <DollarSign className="h-4 w-4 text-green-400" />
                                    <span className="text-sm">${prospect.value.toLocaleString()} potential value</span>
                                  </div>
                                )}
                                <div className="space-y-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full border-blue-600 text-blue-400 hover:bg-blue-500/20"
                                  >
                                    <Calendar className="h-4 w-4 mr-2" />
                                    Schedule Follow-up
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => convertToClientMutation.mutate({
                                      leadId: prospect.id,
                                      clientData: {
                                        name: prospect.name,
                                        email: prospect.email,
                                        phone: prospect.phone,
                                        company: prospect.company,
                                        type: 'client',
                                      },
                                    })}
                                    className="w-full border-green-600 text-green-400 hover:bg-green-500/20"
                                  >
                                    <ArrowRight className="h-4 w-4 mr-2" />
                                    Convert to Client
                                  </Button>
                                </div>
                              </div>
                            </div>

                            {/* Notes & Activity */}
                            <div className="space-y-4">
                              <h4 className="font-medium text-primary">Notes & Activity</h4>
                              {prospect.notes ? (
                                <div className="p-3 list-item/50 rounded-lg border ">
                                  <p className="text-sm text-secondary">{prospect.notes}</p>
                                </div>
                              ) : (
                                <p className="text-sm text-tertiary">No notes available</p>
                              )}

                              {/* Placeholder for future activity tracking */}
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs text-tertiary">
                                  <Activity className="h-3 w-3" />
                                  <span>Activity tracking coming soon...</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-tertiary">
                                  <Clock className="h-3 w-3" />
                                  <span>Follow-up reminders coming soon...</span>
                                </div>
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
          {prospectsData && prospectsData.total > limit && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <div className="text-sm page-subtitle">
                Showing {page * limit + 1} to {Math.min((page + 1) * limit, prospectsData.total)} of {prospectsData.total} prospects
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className=" hover:list-item"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={!prospectsData.hasMore}
                  className=" hover:list-item"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Prospect Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="card text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Prospect</DialogTitle>
            <DialogDescription className="page-subtitle">
              Update prospect information and details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-prospect-name" className="text-right">
                Name *
              </Label>
              <Input
                id="edit-prospect-name"
                value={editProspect.name}
                onChange={(e) => setEditProspect(prev => ({ ...prev, name: e.target.value }))}
                className="col-span-3 list-item "
                placeholder="Prospect name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-prospect-email" className="text-right">
                Email
              </Label>
              <Input
                id="edit-prospect-email"
                type="email"
                value={editProspect.email}
                onChange={(e) => setEditProspect(prev => ({ ...prev, email: e.target.value }))}
                className="col-span-3 list-item "
                placeholder="email@example.com"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-prospect-phone" className="text-right">
                Phone
              </Label>
              <Input
                id="edit-prospect-phone"
                value={editProspect.phone}
                onChange={(e) => setEditProspect(prev => ({ ...prev, phone: e.target.value }))}
                className="col-span-3 list-item "
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-prospect-company" className="text-right">
                Company
              </Label>
              <Input
                id="edit-prospect-company"
                value={editProspect.company}
                onChange={(e) => setEditProspect(prev => ({ ...prev, company: e.target.value }))}
                className="col-span-3 list-item "
                placeholder="Company name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-prospect-status" className="text-right">
                Status
              </Label>
              <Select value={editProspect.status} onValueChange={(value) => setEditProspect(prev => ({ ...prev, status: value }))}>
                <SelectTrigger className="col-span-3 list-item ">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="card">
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="proposal">Proposal</SelectItem>
                  <SelectItem value="negotiation">Negotiation</SelectItem>
                  <SelectItem value="won">Won</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-prospect-prospect-status" className="text-right">
                Prospect Status
              </Label>
              <Select value={editProspect.prospect_status} onValueChange={(value) => setEditProspect(prev => ({ ...prev, prospect_status: value }))}>
                <SelectTrigger className="col-span-3 list-item ">
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
              <Label htmlFor="edit-prospect-value" className="text-right">
                Lead Value
              </Label>
              <Input
                id="edit-prospect-value"
                type="number"
                value={editProspect.lead_value}
                onChange={(e) => setEditProspect(prev => ({ ...prev, lead_value: e.target.value }))}
                className="col-span-3 list-item "
                placeholder="10000"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-prospect-website" className="text-right">
                Website
              </Label>
              <Input
                id="edit-prospect-website"
                value={editProspect.website}
                onChange={(e) => setEditProspect(prev => ({ ...prev, website: e.target.value }))}
                className="col-span-3 list-item "
                placeholder="https://example.com"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-prospect-notes" className="text-right">
                Notes
              </Label>
              <Textarea
                id="edit-prospect-notes"
                value={editProspect.notes}
                onChange={(e) => setEditProspect(prev => ({ ...prev, notes: e.target.value }))}
                className="col-span-3 list-item "
                placeholder="Prospect notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className=" hover:list-item"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleUpdateProspect}
              disabled={updateLeadMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {updateLeadMutation.isPending ? "Updating..." : "Update Prospect"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}