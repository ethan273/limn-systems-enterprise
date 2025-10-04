"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Package,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  TruckIcon,
  Factory,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// Dynamic route configuration
export const dynamic = 'force-dynamic';

const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  pending: {
    label: "Pending",
    className: "badge-neutral",
    icon: <Clock className="icon-sm" aria-hidden="true" />,
  },
  in_production: {
    label: "In Production",
    className: "status-in-progress",
    icon: <Factory className="icon-sm" aria-hidden="true" />,
  },
  quality_check: {
    label: "Quality Check",
    className: "bg-primary-muted text-primary border-primary",
    icon: <AlertCircle className="icon-sm" aria-hidden="true" />,
  },
  approved: {
    label: "Approved",
    className: "status-completed",
    icon: <CheckCircle2 className="icon-sm" aria-hidden="true" />,
  },
  packed: {
    label: "Packed",
    className: "bg-primary text-primary border-primary",
    icon: <Package className="icon-sm" aria-hidden="true" />,
  },
  shipped: {
    label: "Shipped",
    className: "bg-info-muted text-info border-info",
    icon: <TruckIcon className="icon-sm" aria-hidden="true" />,
  },
  delivered: {
    label: "Delivered",
    className: "bg-success-muted text-success border-success",
    icon: <CheckCircle2 className="icon-sm" aria-hidden="true" />,
  },
};

const qcStatusConfig: Record<string, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "badge-neutral",
  },
  pass: {
    label: "Pass",
    className: "status-completed",
  },
  fail: {
    label: "Fail",
    className: "status-cancelled",
  },
  repaired: {
    label: "Repaired",
    className: "bg-warning-muted text-warning border-warning",
  },
};

export default function OrderedItemsProductionPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [qcStatusFilter, setQcStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch ordered items production
  const { data, isLoading } = api.orderedItemsProduction.getAll.useQuery(
    {
      status: statusFilter === "all" ? undefined : statusFilter,
      qcStatus: qcStatusFilter === "all" ? undefined : qcStatusFilter,
      search: searchQuery || undefined,
      limit: 100,
      offset: 0,
    },
    {
      enabled: !!user,
    }
  );

  const items = data?.items || [];

  // Statistics
  const stats = {
    total: items.length,
    inProduction: items.filter((i) => i.status === "in_production").length,
    qualityCheck: items.filter((i) => i.status === "quality_check").length,
    approved: items.filter((i) => i.status === "approved").length,
    shipped: items.filter((i) => i.status === "shipped").length,
    qcPass: items.filter((i) => i.qc_status === "pass").length,
    qcFail: items.filter((i) => i.qc_status === "fail").length,
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Ordered Items - Individual Units</h1>
          <p className="page-description">
            Track individual units with QC status and production progress
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Total Units</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">In Production</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value text-info">{stats.inProduction}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Quality Check</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value text-primary">{stats.qualityCheck}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">QC Pass Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value text-success">
              {stats.total > 0
                ? `${Math.round((stats.qcPass / stats.total) * 100)}%`
                : "0%"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Ordered Items</CardTitle>
        </CardHeader>
        <CardContent className="card-content-compact">
          <div className="filters-section">
            <div className="search-input-wrapper">
              <Search className="search-icon" aria-hidden="true" />
              <Input
                placeholder="Search by SKU, serial number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="filter-select">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_production">In Production</SelectItem>
                <SelectItem value="quality_check">Quality Check</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="packed">Packed</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
              </SelectContent>
            </Select>

            <Select value={qcStatusFilter} onValueChange={setQcStatusFilter}>
              <SelectTrigger className="filter-select">
                <SelectValue placeholder="QC Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All QC Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="pass">Pass</SelectItem>
                <SelectItem value="fail">Fail</SelectItem>
                <SelectItem value="repaired">Repaired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Items Table */}
      {isLoading ? (
            <div className="loading-state">Loading ordered items...</div>
          ) : items.length === 0 ? (
            <div className="empty-state">
              <Package className="empty-state-icon" aria-hidden="true" />
              <h3 className="empty-state-title">No Units Found</h3>
              <p className="empty-state-description">
                No individual units match your current filters.
              </p>
            </div>
          ) : (
        <div className="data-table-container">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Item #</TableHead>
                    <TableHead>Production Order</TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>QC Status</TableHead>
                    <TableHead>Shipment</TableHead>
                    <TableHead>QC Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => {
                    const statusInfo = statusConfig[item.status || "pending"];
                    const qcInfo = qcStatusConfig[item.qc_status || "pending"];
                    const order = item.production_orders;
                    const project = order?.projects;
                    const customer = project?.customers;

                    return (
                      <TableRow
                        key={item.id}
                        className="table-row-clickable"
                        onClick={() => router.push(`/production/ordered-items/${item.id}`)}
                      >
                        <TableCell className="font-medium">
                          {item.sku}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="badge-neutral">
                            #{item.item_number}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{order?.order_number}</div>
                            {customer && (
                              <div className="text-muted">
                                {customer.company_name || customer.name}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {order?.item_name}
                        </TableCell>
                        <TableCell>
                          {project ? (
                            <div className="text-sm">{project.project_name}</div>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn("badge-with-icon", statusInfo?.className)}
                          >
                            {statusInfo?.icon}
                            <span>{statusInfo?.label || item.status}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {item.qc_status ? (
                            <Badge
                              variant="outline"
                              className={qcInfo?.className}
                            >
                              {qcInfo?.label}
                            </Badge>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.shipments ? (
                            <div className="text-sm">
                              <div className="font-medium">
                                {item.shipments.shipment_number}
                              </div>
                              {item.shipments.tracking_number && (
                                <div className="text-muted">
                                  {item.shipments.tracking_number}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted">Not assigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.qc_date ? (
                            <div className="text-sm">
                              {format(new Date(item.qc_date), "MMM d, yyyy")}
                              {item.users && (
                                <div className="text-muted">
                                  by {item.users.name}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

    </div>
  );
}
