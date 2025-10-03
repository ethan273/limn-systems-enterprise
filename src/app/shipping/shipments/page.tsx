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
  TruckIcon,
  Package,
  Search,
} from "lucide-react";
import { format } from "date-fns";

// Dynamic route configuration
export const dynamic = 'force-dynamic';

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "badge-neutral" },
  preparing: { label: "Preparing", className: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  ready: { label: "Ready", className: "bg-blue-100 text-blue-800 border-blue-300" },
  shipped: { label: "Shipped", className: "bg-green-100 text-green-800 border-green-300" },
  in_transit: { label: "In Transit", className: "bg-blue-100 text-blue-800 border-blue-300" },
  delivered: { label: "Delivered", className: "status-completed" },
  delayed: { label: "Delayed", className: "status-cancelled" },
  cancelled: { label: "Cancelled", className: "status-cancelled" },
};

export default function ShipmentsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading } = api.shipping.getAllShipments.useQuery(
    {
      status: statusFilter === "all" ? undefined : statusFilter,
      limit: 100,
      offset: 0,
    },
    {
      enabled: !!user,
    }
  );

  const shipments = data?.items || [];

  const stats = {
    total: shipments.length,
    pending: shipments.filter((s) => s.status === "pending").length,
    inTransit: shipments.filter((s) => s.status === "shipped" || s.status === "in_transit").length,
    delivered: shipments.filter((s) => s.status === "delivered").length,
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">All Shipments</h1>
          <p className="page-description">
            Comprehensive shipment management with SEKO integration
          </p>
        </div>
      </div>

      <div className="stats-grid">
        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Total Shipments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">In Transit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value text-blue-600">{stats.inTransit}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Delivered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value text-green-600">{stats.delivered}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="card-content-compact">
          <div className="filters-section">
            <div className="search-input-wrapper">
              <Search className="search-icon" aria-hidden="true" />
              <Input
                placeholder="Search by shipment #, tracking #, order #..."
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
                <SelectItem value="preparing">Preparing</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="delayed">Delayed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Shipments ({shipments.length})</CardTitle>
        </CardHeader>
        <CardContent className="card-content-compact">
          {isLoading ? (
            <div className="loading-state">Loading shipments...</div>
          ) : shipments.length === 0 ? (
            <div className="empty-state">
              <TruckIcon className="empty-state-icon" aria-hidden="true" />
              <h3 className="empty-state-title">No Shipments Found</h3>
              <p className="empty-state-description">
                No shipments match your current filters.
              </p>
            </div>
          ) : (
            <div className="table-container">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Shipment #</TableHead>
                    <TableHead>Tracking #</TableHead>
                    <TableHead>Carrier</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Packages</TableHead>
                    <TableHead>Shipped</TableHead>
                    <TableHead>Est. Delivery</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shipments.map((shipment) => {
                    const statusInfo = statusConfig[shipment.status || "pending"];
                    const packagesArray = Array.isArray(shipment.packages) ? shipment.packages : [];

                    return (
                      <TableRow
                        key={shipment.id}
                        className="table-row-clickable"
                        onClick={() => router.push(`/shipping/shipments/${shipment.id}`)}
                      >
                        <TableCell className="font-medium">
                          {shipment.shipment_number || "—"}
                        </TableCell>
                        <TableCell>
                          {shipment.tracking_number ? (
                            <div className="font-mono text-xs">
                              {shipment.tracking_number}
                            </div>
                          ) : (
                            <span className="text-muted">Not assigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {shipment.carrier ? (
                            <Badge variant="outline" className="badge-neutral">
                              {shipment.carrier}
                            </Badge>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {shipment.orders ? (
                            <div className="text-sm">
                              <div className="font-medium">{shipment.orders.order_number}</div>
                              {shipment.orders.projects && (
                                <div className="text-muted">{shipment.orders.projects.project_name}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {shipment.orders?.customers ? (
                            <div className="text-sm">
                              {shipment.orders.customers.company_name || shipment.orders.customers.name}
                            </div>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusInfo?.className}>
                            {statusInfo?.label || shipment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="badge-neutral">
                            <Package className="icon-sm" aria-hidden="true" />
                            <span>{packagesArray.length}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {shipment.shipped_date ? (
                            format(new Date(shipment.shipped_date), "MMM d, yyyy")
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {shipment.estimated_delivery ? (
                            format(new Date(shipment.estimated_delivery), "MMM d, yyyy")
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
        </CardContent>
      </Card>
    </div>
  );
}
