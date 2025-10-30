"use client";

import React from "react";
import { useRouter } from "next/navigation";
// Auth is handled by middleware - no client-side checks needed
import { api } from "@/lib/api/client";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShippingStatusBadge } from "@/components/ui/status-badge";
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
  MapPin,
  Search,
  Ship,
  Plus,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";

// Dynamic route configuration
export const dynamic = 'force-dynamic';

export default function ShippingDashboardPage() {
  const router = useRouter();

  // Fetch all shipments
  const { data: shipmentsData, isLoading: shipmentsLoading, error: shipmentsError } = api.shipping.getAllShipments.useQuery(
    {
      limit: 10,
      offset: 0,
    },
    {
      enabled: true,
    }
  );

  const shipments = shipmentsData?.items || [];

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  // Calculate statistics
  const stats = {
    total: shipments.length,
    pending: shipments.filter((s) => s.status === "pending").length,
    inTransit: shipments.filter((s) => s.status === "shipped" || s.status === "in_transit").length,
    delivered: shipments.filter((s) => s.status === "delivered").length,
    delayed: shipments.filter((s) => s.status === "delayed").length,
  };

  // Get recent shipments (last 5)
  const recentShipments = shipments.slice(0, 5);

  // Handle query error
  if (shipmentsError) {
    return (
      <div className="page-container">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Shipping Dashboard</h1>
            <p className="page-description">
              Comprehensive shipping management with SEKO integration
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => router.push("/shipping/tracking")}
              variant="outline"
              className="btn-outline"
            >
              <Search className="icon-sm" aria-hidden="true" />
              Track Shipment
            </Button>
            <Button
              onClick={() => router.push("/shipping/shipments")}
              className="btn-primary"
            >
              <Plus className="icon-sm" aria-hidden="true" />
              All Shipments
            </Button>
          </div>
        </div>
        <Card>
          <CardContent className="card-content-compact">
            <div className="empty-state">
              <AlertTriangle className="empty-state-icon text-destructive" aria-hidden="true" />
              <h3 className="empty-state-title">Failed to load shipments</h3>
              <p className="empty-state-description">
                {shipmentsError.message || "An unexpected error occurred. Please try again."}
              </p>
              <Button
                onClick={() => utils.shipping.getAllShipments.invalidate()}
                className="btn-primary mt-4"
              >
                <RefreshCw className="icon-sm" aria-hidden="true" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Breadcrumb />
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Shipping Dashboard</h1>
          <p className="page-description">
            Comprehensive shipping management with SEKO integration
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => router.push("/shipping/tracking")}
            variant="outline"
            className="btn-outline"
          >
            <Search className="icon-sm" aria-hidden="true" />
            Track Shipment
          </Button>
          <Button
            onClick={() => router.push("/shipping/shipments")}
            className="btn-primary"
          >
            <Plus className="icon-sm" aria-hidden="true" />
            All Shipments
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Total Shipments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{stats.total}</div>
            <p className="stat-label">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value text-warning">{stats.pending}</div>
            <p className="stat-label">Awaiting shipment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">In Transit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value text-info">{stats.inTransit}</div>
            <p className="stat-label">Currently shipping</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Delivered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value text-success">{stats.delivered}</div>
            <p className="stat-label">Successfully delivered</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          className="cursor-pointer hover:card transition-all"
          onClick={() => router.push("/shipping/shipments")}
        >
          <CardContent className="card-content-compact">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Manage Shipments</h3>
                <p className="text-sm text-muted">View and create shipments</p>
              </div>
              <TruckIcon className="w-8 h-8 text-info" aria-hidden="true" />
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:card transition-all"
          onClick={() => router.push("/shipping/tracking")}
        >
          <CardContent className="card-content-compact">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Track Shipment</h3>
                <p className="text-sm text-muted">Real-time tracking lookup</p>
              </div>
              <MapPin className="w-8 h-8 text-success" aria-hidden="true" />
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:card transition-all"
          onClick={() => router.push("/production/shipments")}
        >
          <CardContent className="card-content-compact">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Production Shipments</h3>
                <p className="text-sm text-muted">From production orders</p>
              </div>
              <Package className="w-8 h-8 text-primary" aria-hidden="true" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Shipments */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Shipments</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/shipping/shipments")}
            >
              View All
              <ArrowRight className="icon-sm ml-1" aria-hidden="true" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="card-content-compact">
          {shipmentsLoading ? (
            <div className="loading-state">Loading shipments...</div>
          ) : recentShipments.length === 0 ? (
            <div className="empty-state">
              <Ship className="empty-state-icon" aria-hidden="true" />
              <h3 className="empty-state-title">No Shipments Yet</h3>
              <p className="empty-state-description">
                Create your first shipment to get started
              </p>
              <Button
                onClick={() => router.push("/shipping/shipments")}
                className="btn-primary mt-4"
              >
                <Plus className="icon-sm" aria-hidden="true" />
                Create Shipment
              </Button>
            </div>
          ) : (
            <div className="data-table-container">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Shipment #</TableHead>
                    <TableHead>Tracking #</TableHead>
                    <TableHead>Carrier</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Shipped</TableHead>
                    <TableHead>Est. Delivery</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentShipments.map((shipment) => {
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
                              <div className="font-medium">
                                {shipment.orders.order_number}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <ShippingStatusBadge status={shipment.status || "pending"} />
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

      {/* SEKO Integration Notice */}
      <Card className="bg-info/10 border-info/20 dark:bg-info/5 dark:border-info/30">
        <CardContent className="card-content-compact">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-info/20 dark:bg-info/10 rounded-lg">
              <Ship className="w-5 h-5 text-info" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-info dark:text-info">SEKO Integration Active</h3>
              <p className="text-sm text-info/90 dark:text-info/80 mt-1">
                This shipping module is integrated with SEKO for real-time rates, label generation, and tracking.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
