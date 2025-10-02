"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Filter,
  MoreVertical,
  Building,
  Mail,
  DollarSign,
  Users,
  Thermometer,
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
  className: string;
  description: string;
}[] = [
  {
    value: 'hot',
    label: 'Hot',
    className: 'priority-high',
    description: 'Ready to buy, high interest'
  },
  {
    value: 'warm',
    label: 'Warm',
    className: 'priority-medium',
    description: 'Engaged, needs nurturing'
  },
  {
    value: 'cold',
    label: 'Cold',
    className: 'priority-low',
    description: 'Early stage, requires attention'
  },
];

export default function ProspectsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [prospectFilter, setProspectFilter] = useState<ProspectStatus | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [page, setPage] = useState(0);
  const [limit] = useState(20);

  const { data: prospectsData, isLoading, refetch } = api.crm.leads.getProspects.useQuery({
    limit,
    offset: page * limit,
    prospect_status: prospectFilter === 'all' ? undefined : prospectFilter,
    status: statusFilter === 'all' ? undefined : statusFilter,
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

  const handleDeleteProspect = (prospectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this prospect?")) {
      deleteLeadMutation.mutate({ id: prospectId });
    }
  };

  const handleConvertToClient = (prospect: any, e: React.MouseEvent) => {
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
  };

  const clearFilters = () => {
    setSearch("");
    setProspectFilter('all');
    setStatusFilter('all');
    setPage(0);
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

  // Filter prospects based on search
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
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Prospects</h1>
          <p className="page-subtitle">Manage qualified prospects in your sales pipeline</p>
        </div>
      </div>

      {/* Prospect Status Overview */}
      <div className="stats-grid-3">
        {prospectsByStatus.map((status) => (
          <Card key={status.value}>
            <CardContent className="stat-card-content">
              <div className="stat-card-header">
                <Thermometer className={`stat-card-icon ${status.className}`} aria-hidden="true" />
                <div>
                  <h3 className="stat-card-title">{status.label} Prospects</h3>
                  <p className="stat-card-description">{status.description}</p>
                </div>
              </div>
              <div className="stat-card-stats">
                <div className="stat-card-stat">
                  <Users className="icon-xs" aria-hidden="true" />
                  <span>{status.count} prospects</span>
                </div>
                <div className="stat-card-stat">
                  <DollarSign className="icon-xs" aria-hidden="true" />
                  <span>${status.totalValue.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="filters-section">
        <CardHeader className="card-header-sm">
          <CardTitle className="card-title-sm">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="filters-grid">
            {/* Search */}
            <div className="filter-search">
              <Search className="filter-search-icon" aria-hidden="true" />
              <Input
                placeholder="Search prospects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="filter-search-input"
              />
            </div>

            {/* Prospect Status Filter */}
            <Select value={prospectFilter} onValueChange={(value) => setProspectFilter(value as ProspectStatus | 'all')}>
              <SelectTrigger>
                <SelectValue placeholder="Prospect Status" />
              </SelectTrigger>
              <SelectContent>
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
              <SelectTrigger>
                <SelectValue placeholder="Lead Status" />
              </SelectTrigger>
              <SelectContent>
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
              className="btn-secondary"
            >
              <Filter className="icon-sm" aria-hidden="true" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Prospects Table */}
      <Card>
        <CardHeader>
          <CardTitle>Prospects ({sortedProspects.length}) - Sorted by Priority</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="loading-state">Loading prospects...</div>
          ) : sortedProspects.length === 0 ? (
            <div className="empty-state">
              <Thermometer className="empty-state-icon" aria-hidden="true" />
              <h3 className="empty-state-title">No prospects found</h3>
              <p className="empty-state-description">
                Try adjusting your filters or convert some leads to prospects.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="data-table-header-row">
                  <TableHead className="data-table-header">Priority</TableHead>
                  <TableHead className="data-table-header">Name</TableHead>
                  <TableHead className="data-table-header">Company</TableHead>
                  <TableHead className="data-table-header">Email</TableHead>
                  <TableHead className="data-table-header">Status</TableHead>
                  <TableHead className="data-table-header">Prospect</TableHead>
                  <TableHead className="data-table-header">Value</TableHead>
                  <TableHead className="data-table-header-actions">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedProspects.map((prospect: any) => {
                  const prospectConfig = getProspectConfig(prospect.prospect_status);
                  const priority = getProspectPriority(prospect);

                  return (
                    <TableRow
                      key={prospect.id}
                      className="data-table-row"
                      onClick={() => router.push(`/crm/prospects/${prospect.id}`)}
                    >
                      <TableCell className="data-table-cell">
                        <div className="flex items-center gap-1">
                          <Star className={`icon-sm ${priority >= 5 ? 'text-yellow-400' : 'text-muted-foreground'}`} aria-hidden="true" />
                          <span className="font-mono text-sm">{priority}</span>
                        </div>
                      </TableCell>
                      <TableCell className="data-table-cell-primary">
                        <span className="font-medium">{prospect.name}</span>
                      </TableCell>
                      <TableCell className="data-table-cell">
                        <div className="flex items-center gap-2">
                          <Building className="icon-xs" aria-hidden="true" />
                          {prospect.company || "—"}
                        </div>
                      </TableCell>
                      <TableCell className="data-table-cell">
                        <div className="flex items-center gap-2">
                          <Mail className="icon-xs" aria-hidden="true" />
                          {prospect.email || "—"}
                        </div>
                      </TableCell>
                      <TableCell className="data-table-cell">
                        <Badge variant="outline" className="badge-neutral">
                          {prospect.status ? prospect.status.charAt(0).toUpperCase() + prospect.status.slice(1) : "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell className="data-table-cell">
                        {prospectConfig && (
                          <Badge variant="outline" className={prospectConfig.className}>
                            <Thermometer className="icon-xs" aria-hidden="true" />
                            {prospectConfig.label}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="data-table-cell">
                        {prospect.value ? `$${prospect.value.toLocaleString()}` : "—"}
                      </TableCell>
                      <TableCell className="data-table-cell-actions">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" className="btn-icon">
                              <MoreVertical className="icon-sm" aria-hidden="true" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/crm/prospects/${prospect.id}`);
                              }}
                              className="dropdown-item"
                            >
                              <Eye className="icon-sm" aria-hidden="true" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="dropdown-item">
                              <Edit className="icon-sm" aria-hidden="true" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => handleConvertToClient(prospect, e)}
                              className="dropdown-item"
                            >
                              <ArrowRight className="icon-sm" aria-hidden="true" />
                              Convert to Client
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => handleDeleteProspect(prospect.id, e)}
                              className="dropdown-item-danger"
                            >
                              <Trash className="icon-sm" aria-hidden="true" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {prospectsData && prospectsData.total > limit && (
            <div className="pagination">
              <div className="pagination-info">
                Showing {page * limit + 1} to {Math.min((page + 1) * limit, prospectsData.total)} of {prospectsData.total} prospects
              </div>
              <div className="pagination-buttons">
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
                  disabled={!prospectsData.hasMore}
                  className="btn-secondary"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
