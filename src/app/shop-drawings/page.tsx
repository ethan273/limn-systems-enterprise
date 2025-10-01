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
  FileText,
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Package,
  Filter,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// Status badge configuration
const statusConfig: Record<string, {
  label: string;
  className: string;
}> = {
  in_review: {
    label: "In Review",
    className: "bg-yellow-100 text-yellow-800 border-yellow-300"
  },
  designer_approved: {
    label: "Designer Approved",
    className: "bg-blue-100 text-blue-800 border-blue-300"
  },
  approved: {
    label: "Approved",
    className: "bg-green-100 text-green-800 border-green-300"
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-100 text-red-800 border-red-300"
  },
  revision_requested: {
    label: "Revision Requested",
    className: "bg-orange-100 text-orange-800 border-orange-300"
  }
};

export default function ShopDrawingsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [orderFilter, setOrderFilter] = useState<string>("");
  const [factoryFilter, setFactoryFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(0);
  const limit = 20;

  // Fetch shop drawings with filters
  const { data, isLoading, error } = api.shopDrawings.getAll.useQuery({
    productionOrderId: orderFilter || undefined,
    factoryId: factoryFilter || undefined,
    status: statusFilter || undefined,
    search: searchQuery || undefined,
    limit,
    offset: page * limit,
  });

  // Fetch production orders for filter
  const { data: ordersData } = api.productionOrders.getAll.useQuery({
    limit: 100,
  });

  // Fetch factories for filter
  const { data: factoriesData } = api.partners.getAll.useQuery({
    type: "factory",
    limit: 100,
  });

  const drawings = data?.drawings ?? [];
  const total = data?.total ?? 0;
  const hasMore = data?.hasMore ?? false;

  // Calculate statistics
  const stats = React.useMemo(() => {
    if (!data?.drawings) return {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0
    };

    const allDrawings = data.drawings;
    return {
      total: allDrawings.length,
      pending: allDrawings.filter(d => d.status === 'in_review' || d.status === 'designer_approved').length,
      approved: allDrawings.filter(d => d.status === 'approved').length,
      rejected: allDrawings.filter(d => d.status === 'rejected' || d.status === 'revision_requested').length
    };
  }, [data]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(0);
  };

  const handleOrderFilterChange = (value: string) => {
    setOrderFilter(value);
    setPage(0);
  };

  const handleFactoryFilterChange = (value: string) => {
    setFactoryFilter(value);
    setPage(0);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setPage(0);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setOrderFilter("");
    setFactoryFilter("");
    setStatusFilter("");
    setPage(0);
  };

  const handleRowClick = (drawingId: string) => {
    router.push(`/shop-drawings/${drawingId}`);
  };

  const handleUploadClick = () => {
    router.push("/shop-drawings/new");
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
          <h1 className="text-3xl font-bold">Shop Drawings</h1>
          <p className="text-muted-foreground">
            Manage production drawings with version control and approvals
          </p>
        </div>
        <Button onClick={handleUploadClick}>
          <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
          Upload Drawing
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="w-4 h-4" aria-hidden="true" />
              Total Drawings
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
              Pending Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <Input
                placeholder="Search by number or name..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-10"
                aria-label="Search shop drawings"
              />
            </div>

            {/* Production Order Filter */}
            <Select value={orderFilter} onValueChange={handleOrderFilterChange}>
              <SelectTrigger aria-label="Filter by production order">
                <SelectValue placeholder="Production Order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Orders</SelectItem>
                {ordersData?.items?.map((order: { id: string; order_number: string; item_name: string }) => (
                  <SelectItem key={order.id} value={order.id}>
                    {order.order_number} - {order.item_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Factory Filter */}
            <Select value={factoryFilter} onValueChange={handleFactoryFilterChange}>
              <SelectTrigger aria-label="Filter by factory">
                <SelectValue placeholder="Factory" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Factories</SelectItem>
                {factoriesData?.partners?.map((factory) => (
                  <SelectItem key={factory.id} value={factory.id}>
                    {factory.company_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger aria-label="Filter by status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="designer_approved">Designer Approved</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="revision_requested">Revision Requested</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(searchQuery || orderFilter || factoryFilter || statusFilter) && (
            <div className="mt-4 flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                Clear Filters
              </Button>
              <span className="text-sm text-muted-foreground">
                Showing {drawings.length} of {total} drawings
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Drawings Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" aria-hidden="true" />
              <span className="ml-3 text-muted-foreground">Loading shop drawings...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center p-12">
              <XCircle className="w-8 h-8 text-destructive" aria-hidden="true" />
              <span className="ml-3 text-destructive">Error loading shop drawings</span>
            </div>
          ) : drawings.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 space-y-4">
              <FileText className="w-16 h-16 text-muted-foreground opacity-50" aria-hidden="true" />
              <div className="text-center">
                <h3 className="font-semibold text-lg mb-2">No Shop Drawings Found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchQuery || orderFilter || factoryFilter || statusFilter
                    ? "Try adjusting your filters to see more results."
                    : "Get started by uploading your first shop drawing."}
                </p>
                {!searchQuery && !orderFilter && !factoryFilter && !statusFilter && (
                  <Button onClick={handleUploadClick}>
                    <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                    Upload First Drawing
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Drawing Number</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Production Order</TableHead>
                    <TableHead>Factory</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drawings.map((drawing) => {
                    const config = statusConfig[drawing.status] || statusConfig.in_review;

                    return (
                      <TableRow
                        key={drawing.id}
                        onClick={() => handleRowClick(drawing.id)}
                        className="cursor-pointer hover:bg-muted/50"
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                            {drawing.drawing_number}
                          </div>
                        </TableCell>
                        <TableCell>{drawing.drawing_name}</TableCell>
                        <TableCell>
                          {drawing.production_orders ? (
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                              <div>
                                <div className="font-medium">{drawing.production_orders.order_number}</div>
                                <div className="text-xs text-muted-foreground">
                                  {drawing.production_orders.item_name}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {drawing.partners ? (
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                              {drawing.partners.company_name}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">
                            v{drawing.current_version}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("text-xs", config.className)}>
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {drawing.created_at ? (
                            <time dateTime={new Date(drawing.created_at).toISOString()}>
                              {format(new Date(drawing.created_at), "MMM d, yyyy")}
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
                    Showing {page * limit + 1} to {Math.min((page + 1) * limit, total)} of {total} drawings
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
