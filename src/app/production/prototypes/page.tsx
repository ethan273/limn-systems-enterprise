"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Search,
  Plus,
  Package,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Filter,
  Loader2,
  Lightbulb
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// Status badge configuration
const statusConfig: Record<string, {
  label: string;
  className: string;
}> = {
  concept: {
    label: "Concept",
    className: "bg-purple-100 text-purple-800 border-purple-300"
  },
  design_review: {
    label: "Design Review",
    className: "bg-yellow-100 text-yellow-800 border-yellow-300"
  },
  design_approved: {
    label: "Design Approved",
    className: "bg-blue-100 text-blue-800 border-blue-300"
  },
  production_pending: {
    label: "Production Pending",
    className: "bg-orange-100 text-orange-800 border-orange-300"
  },
  in_production: {
    label: "In Production",
    className: "bg-blue-100 text-blue-800 border-blue-300"
  },
  assembly_complete: {
    label: "Assembly Complete",
    className: "bg-indigo-100 text-indigo-800 border-indigo-300"
  },
  quality_review: {
    label: "Quality Review",
    className: "bg-yellow-100 text-yellow-800 border-yellow-300"
  },
  client_review: {
    label: "Client Review",
    className: "bg-yellow-100 text-yellow-800 border-yellow-300"
  },
  approved: {
    label: "Approved",
    className: "bg-green-100 text-green-800 border-green-300"
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-100 text-red-800 border-red-300"
  },
  ready_for_catalog: {
    label: "Ready for Catalog",
    className: "bg-emerald-100 text-emerald-800 border-emerald-300"
  },
  archived: {
    label: "Archived",
    className: "bg-gray-100 text-gray-800 border-gray-300"
  }
};

// Priority badge configuration
const priorityConfig: Record<string, {
  label: string;
  className: string;
}> = {
  low: {
    label: "Low",
    className: "bg-green-100 text-green-800 border-green-300"
  },
  medium: {
    label: "Medium",
    className: "bg-yellow-100 text-yellow-800 border-yellow-300"
  },
  high: {
    label: "High",
    className: "bg-red-100 text-red-800 border-red-300"
  }
};

export default function PrototypesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [designProjectFilter, setDesignProjectFilter] = useState<string>("all");
  const [crmProjectFilter, setCrmProjectFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const limit = 20;

  // Fetch prototypes with filters
  const { data, isLoading, error } = api.prototypes.getAll.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter,
    priority: priorityFilter === "all" ? undefined : priorityFilter,
    prototypeType: typeFilter === "all" ? undefined : typeFilter,
    designProjectId: designProjectFilter === "all" ? undefined : designProjectFilter,
    crmProjectId: crmProjectFilter === "all" ? undefined : crmProjectFilter,
    search: searchQuery || undefined,
    limit,
    offset: page * limit,
  });

  // Fetch design projects for filter
  const { data: designProjectsData } = api.designProjects.getAll.useQuery({
    limit: 100,
  });

  // Fetch CRM projects for filter
  const { data: crmProjectsData } = api.projects.getAll.useQuery({
    limit: 100,
  });

  const prototypes = data?.prototypes ?? [];
  const total = data?.total ?? 0;
  const hasMore = data?.hasMore ?? false;

  // Calculate statistics
  const stats = React.useMemo(() => {
    if (!data?.prototypes) return {
      total: 0,
      inProgress: 0,
      completed: 0,
      rejected: 0
    };

    const allPrototypes = data.prototypes;
    return {
      total: allPrototypes.length,
      inProgress: allPrototypes.filter(p =>
        p.status === 'in_production' ||
        p.status === 'design_review' ||
        p.status === 'quality_review' ||
        p.status === 'client_review'
      ).length,
      completed: allPrototypes.filter(p =>
        p.status === 'approved' ||
        p.status === 'ready_for_catalog'
      ).length,
      rejected: allPrototypes.filter(p =>
        p.status === 'rejected'
      ).length
    };
  }, [data]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(0);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setPage(0);
  };

  const handlePriorityFilterChange = (value: string) => {
    setPriorityFilter(value);
    setPage(0);
  };

  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value);
    setPage(0);
  };

  const handleDesignProjectFilterChange = (value: string) => {
    setDesignProjectFilter(value);
    setPage(0);
  };

  const handleCrmProjectFilterChange = (value: string) => {
    setCrmProjectFilter(value);
    setPage(0);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    setPriorityFilter("");
    setTypeFilter("");
    setDesignProjectFilter("");
    setCrmProjectFilter("");
    setPage(0);
  };

  const handleRowClick = (prototypeId: string) => {
    router.push(`/prototypes/${prototypeId}`);
  };

  const handleCreateClick = () => {
    router.push("/prototypes/new");
  };

  const handlePreviousPage = () => {
    if (page > 0) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (hasMore) {
      setPage(page + 1);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Prototypes</h1>
          <p className="text-muted-foreground">
            Manage prototype development from concept to catalog
          </p>
        </div>
        <Button onClick={handleCreateClick}>
          <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
          Create Prototype
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Package className="w-4 h-4" aria-hidden="true" />
              Total Prototypes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" aria-hidden="true" />
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" aria-hidden="true" />
              Rejected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" aria-hidden="true" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="filters-section">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <Input
                placeholder="Search by number or name..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-10"
                aria-label="Search prototypes"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger aria-label="Filter by status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="concept">Concept</SelectItem>
                <SelectItem value="design_review">Design Review</SelectItem>
                <SelectItem value="design_approved">Design Approved</SelectItem>
                <SelectItem value="production_pending">Production Pending</SelectItem>
                <SelectItem value="in_production">In Production</SelectItem>
                <SelectItem value="assembly_complete">Assembly Complete</SelectItem>
                <SelectItem value="quality_review">Quality Review</SelectItem>
                <SelectItem value="client_review">Client Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="ready_for_catalog">Ready for Catalog</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>

            {/* Priority Filter */}
            <Select value={priorityFilter} onValueChange={handlePriorityFilterChange}>
              <SelectTrigger aria-label="Filter by priority">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={handleTypeFilterChange}>
              <SelectTrigger aria-label="Filter by type">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="furniture">Furniture</SelectItem>
                <SelectItem value="accessory">Accessory</SelectItem>
                <SelectItem value="lighting">Lighting</SelectItem>
                <SelectItem value="textile">Textile</SelectItem>
                <SelectItem value="hardware">Hardware</SelectItem>
              </SelectContent>
            </Select>

            {/* Design Project Filter */}
            <Select value={designProjectFilter} onValueChange={handleDesignProjectFilterChange}>
              <SelectTrigger aria-label="Filter by design project">
                <SelectValue placeholder="Design Project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Design Projects</SelectItem>
                {designProjectsData?.projects?.map((project: { id: string; project_name: string }) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.project_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* CRM Project Filter */}
            <Select value={crmProjectFilter} onValueChange={handleCrmProjectFilterChange}>
              <SelectTrigger aria-label="Filter by CRM project">
                <SelectValue placeholder="CRM Project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All CRM Projects</SelectItem>
                {crmProjectsData?.items?.map((project: { id: string; name: string }) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(searchQuery || statusFilter || priorityFilter || typeFilter || designProjectFilter || crmProjectFilter) && (
            <div className="mt-4 flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                Clear Filters
              </Button>
              <span className="text-sm text-muted-foreground">
                Showing {prototypes.length} of {total} prototypes
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Prototypes Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" aria-hidden="true" />
              <span className="ml-3 text-muted-foreground">Loading prototypes...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center p-12">
              <XCircle className="w-8 h-8 text-destructive" aria-hidden="true" />
              <span className="ml-3 text-destructive">Error loading prototypes</span>
            </div>
          ) : prototypes.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 space-y-4">
              <Lightbulb className="w-16 h-16 text-muted-foreground opacity-50" aria-hidden="true" />
              <div className="text-center">
                <h3 className="font-semibold text-lg mb-2">No Prototypes Found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchQuery || statusFilter || priorityFilter || typeFilter || designProjectFilter || crmProjectFilter
                    ? "Try adjusting your filters to see more results."
                    : "Get started by creating your first prototype."}
                </p>
                {!searchQuery && !statusFilter && !priorityFilter && !typeFilter && !designProjectFilter && !crmProjectFilter && (
                  <Button onClick={handleCreateClick}>
                    <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                    Create First Prototype
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Prototype Number</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Production Progress</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prototypes.map((prototype) => {
                    const statusConf = statusConfig[prototype.status] || statusConfig.concept;
                    const priorityConf = priorityConfig[prototype.priority] || priorityConfig.medium;

                    return (
                      <TableRow
                        key={prototype.id}
                        onClick={() => handleRowClick(prototype.id)}
                        className="cursor-pointer hover:bg-muted/50"
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Lightbulb className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                            {prototype.prototype_number}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{prototype.name}</div>
                            {prototype.description && (
                              <div className="text-xs text-muted-foreground line-clamp-1">
                                {prototype.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="capitalize">
                            {prototype.prototype_type.replace('_', ' ')}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("text-xs", statusConf.className)}>
                            {statusConf.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("text-xs", priorityConf.className)}>
                            {priorityConf.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {prototype.prototype_production && Array.isArray(prototype.prototype_production) && prototype.prototype_production.length > 0 && (prototype.prototype_production[0] as any) ? (
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-600 transition-all"
                                  style={{ width: `${(prototype.prototype_production[0] as any)?.overall_progress || 0}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {(prototype.prototype_production[0] as any)?.overall_progress || 0}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {prototype.created_at ? (
                            <time dateTime={new Date(prototype.created_at).toISOString()}>
                              {format(new Date(prototype.created_at), "MMM d, yyyy")}
                            </time>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              {total > limit && (
                <div className="flex items-center justify-between border-t border-border p-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {page * limit + 1} to {Math.min((page + 1) * limit, total)} of {total} prototypes
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousPage}
                      disabled={page === 0}
                      aria-label="Previous page"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={!hasMore}
                      aria-label="Next page"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
