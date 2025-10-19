"use client";

import React, { use, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EntityDetailHeader } from "@/components/common/EntityDetailHeader";
import { InfoCard } from "@/components/common/InfoCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingState } from "@/components/common/LoadingState";
import { PageHeader } from "@/components/common/PageHeader";
import {
  Package,
  ArrowLeft,
  AlertCircle,
  FileText,
  CreditCard,
  Truck,
  DollarSign,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";

// Dynamic route configuration
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function OrderDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  // Fetch order details
  const { data: order, isLoading, error } = api.portal.getOrderById.useQuery(
    { orderId: id },
    { enabled: !!id }
  );

  // Fetch shipments
  const { data: shipments, error: shipmentsError } = api.portal.getOrderShipments.useQuery(
    { orderId: id },
    { enabled: !!id }
  );

  // Handle order query error
  if (error) {
    return (
      <div className="page-container">
        <PageHeader
          title="Order Details"
          subtitle="View order information"
        />
        <EmptyState
          icon={AlertTriangle}
          title="Failed to load order details"
          description={error.message || "An unexpected error occurred. Please try again."}
          action={{
            label: 'Try Again',
            onClick: () => utils.portal.getOrderById.invalidate(),
            icon: RefreshCw,
          }}
        />
      </div>
    );
  }

  // Handle shipments query error
  if (shipmentsError) {
    return (
      <div className="page-container">
        <PageHeader
          title="Order Details"
          subtitle="View order information"
        />
        <EmptyState
          icon={AlertTriangle}
          title="Failed to load shipment data"
          description={shipmentsError.message || "An unexpected error occurred. Please try again."}
          action={{
            label: 'Try Again',
            onClick: () => utils.portal.getOrderShipments.invalidate(),
            icon: RefreshCw,
          }}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="page-container">
        <LoadingState message="Loading order details..." size="md" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="page-container">
        <EmptyState
          icon={AlertCircle}
          title="Order Not Found"
          description="Order not found or you do not have permission to view it"
          action={{
            label: 'Back to Orders',
            onClick: () => router.push("/portal/orders"),
            icon: ArrowLeft,
          }}
        />
      </div>
    );
  }

  const depositInvoice = order.production_invoices?.find((inv) => inv.invoice_type === 'deposit');
  const finalInvoice = order.production_invoices?.find((inv) => inv.invoice_type === 'final');

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <Button
          onClick={() => router.push("/portal/orders")}
          variant="ghost"
          className="btn-secondary"
        >
          <ArrowLeft className="icon-sm" aria-hidden="true" />
          Back
        </Button>
      </div>

      {/* Entity Header */}
      <EntityDetailHeader
        icon={Package}
        title={`Order ${order.order_number}`}
        subtitle={order.item_name}
        metadata={[
          { icon: Package, value: `${order.quantity} items`, label: 'Quantity' },
          { icon: DollarSign, value: `$${Number(order.total_cost).toLocaleString()}`, label: 'Total' },
          { icon: Package, value: order.projects?.name || '—', label: 'Project' },
        ]}
        status={order.status}
      />

      {/* Payment Alerts */}
      {order.status === "awaiting_deposit" && (
        <Alert>
          <AlertCircle className="icon-sm" aria-hidden="true" />
          <AlertDescription>
            <strong>Payment Required:</strong> A 50% deposit payment is required before production can begin.
            Please contact your account manager for payment instructions.
          </AlertDescription>
        </Alert>
      )}

      {order.status === "awaiting_final_payment" && (
        <Alert>
          <AlertCircle className="icon-sm" aria-hidden="true" />
          <AlertDescription>
            <strong>Final Payment Required:</strong> Your order is ready to ship. The remaining 50% balance
            payment is required before shipment. Please contact your account manager for payment instructions.
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Order Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">${Number(order.total_cost).toLocaleString()}</div>
            <p className="stat-label">
              {order.quantity} items @ ${Number(order.unit_price).toLocaleString()} each
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Deposit Status</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusBadge status={order.deposit_paid ? "completed" : "pending"} />
            <p className="stat-label mt-2">
              ${Number(Number(order.total_cost) * 0.5).toLocaleString()} (50%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Final Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusBadge status={order.final_payment_paid ? "completed" : "pending"} />
            <p className="stat-label mt-2">
              ${Number(Number(order.total_cost) * 0.5).toLocaleString()} (50%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Est. Ship Date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">
              {order.estimated_ship_date
                ? format(new Date(order.estimated_ship_date), "MMM d, yyyy")
                : "TBD"}
            </div>
            {order.actual_ship_date && (
              <p className="stat-label mt-1">
                Shipped: {format(new Date(order.actual_ship_date), "MMM d, yyyy")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="tabs-list">
          <TabsTrigger value="overview" className="tabs-trigger">
            <FileText className="icon-sm" aria-hidden="true" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="invoices" className="tabs-trigger">
            <CreditCard className="icon-sm" aria-hidden="true" />
            Invoices & Payments
          </TabsTrigger>
          <TabsTrigger value="shipments" className="tabs-trigger">
            <Truck className="icon-sm" aria-hidden="true" />
            Shipments
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <InfoCard
            title="Order Details"
            items={[
              { label: 'Order Number', value: <span className="font-mono">{order.order_number}</span> },
              { label: 'Project', value: order.projects?.name || '—' },
              { label: 'Item Name', value: order.item_name },
              { label: 'Product Type', value: <span className="capitalize">{order.product_type}</span> },
              { label: 'Quantity', value: `${order.quantity} units` },
              { label: 'Unit Price', value: `$${Number(order.unit_price).toLocaleString()}` },
              { label: 'Total Cost', value: `$${Number(order.total_cost).toLocaleString()}` },
              { label: 'Order Date', value: format(new Date(order.order_date), "MMM d, yyyy") },
              { label: 'Description', value: order.item_description || '—' },
            ]}
          />

          {order.factory_notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="icon-sm" aria-hidden="true" />
                  Production Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="card-content-compact">
                <p className="text-sm whitespace-pre-wrap">{order.factory_notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Invoices & Payments Tab */}
        <TabsContent value="invoices">
          {/* Deposit Invoice */}
          {depositInvoice && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Deposit Invoice (50%)</CardTitle>
                  <StatusBadge status={depositInvoice.status === "paid" ? "completed" : "pending"} />
                </div>
              </CardHeader>
              <CardContent className="card-content-compact">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="detail-label">Invoice Number</label>
                    <p className="detail-value font-mono">{depositInvoice.invoice_number}</p>
                  </div>
                  <div>
                    <label className="detail-label">Total</label>
                    <p className="detail-value">${Number(depositInvoice.total).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="detail-label">Amount Paid</label>
                    <p className="detail-value">${Number(depositInvoice.amount_paid).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="detail-label">Amount Due</label>
                    <p className="detail-value stat-warning">${Number(depositInvoice.amount_due).toLocaleString()}</p>
                  </div>
                </div>

                {depositInvoice.production_payments && depositInvoice.production_payments.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Payment History</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Transaction ID</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {depositInvoice.production_payments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell>{format(new Date(payment.payment_date), "MMM d, yyyy")}</TableCell>
                            <TableCell>${Number(payment.amount).toLocaleString()}</TableCell>
                            <TableCell className="capitalize">{payment.payment_method}</TableCell>
                            <TableCell className="font-mono text-sm">{payment.transaction_id || "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Final Invoice */}
          {finalInvoice && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Final Invoice (50%)</CardTitle>
                  <StatusBadge status={finalInvoice.status === "paid" ? "completed" : "pending"} />
                </div>
              </CardHeader>
              <CardContent className="card-content-compact">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="detail-label">Invoice Number</label>
                    <p className="detail-value font-mono">{finalInvoice.invoice_number}</p>
                  </div>
                  <div>
                    <label className="detail-label">Total</label>
                    <p className="detail-value">${Number(finalInvoice.total).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="detail-label">Amount Paid</label>
                    <p className="detail-value">${Number(finalInvoice.amount_paid).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="detail-label">Amount Due</label>
                    <p className="detail-value stat-warning">${Number(finalInvoice.amount_due).toLocaleString()}</p>
                  </div>
                </div>

                {finalInvoice.production_payments && finalInvoice.production_payments.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Payment History</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Transaction ID</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {finalInvoice.production_payments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell>{format(new Date(payment.payment_date), "MMM d, yyyy")}</TableCell>
                            <TableCell>${Number(payment.amount).toLocaleString()}</TableCell>
                            <TableCell className="capitalize">{payment.payment_method}</TableCell>
                            <TableCell className="font-mono text-sm">{payment.transaction_id || "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {!depositInvoice && !finalInvoice && (
            <Card>
              <CardContent className="card-content-compact">
                <EmptyState
                  icon={FileText}
                  title="No invoices generated yet"
                  description="Invoices will appear here once they are created"
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Shipments Tab */}
        <TabsContent value="shipments">
          {shipments && shipments.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Shipments</CardTitle>
              </CardHeader>
              <CardContent className="card-content-compact">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Shipment Number</TableHead>
                      <TableHead>Carrier</TableHead>
                      <TableHead>Tracking Number</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Shipped Date</TableHead>
                      <TableHead>Est. Delivery</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shipments.map((shipment) => (
                      <TableRow key={shipment.id}>
                        <TableCell className="font-mono">{shipment.shipment_number || "—"}</TableCell>
                        <TableCell>{shipment.carrier || "—"}</TableCell>
                        <TableCell className="font-mono">{shipment.tracking_number || "—"}</TableCell>
                        <TableCell>
                          <StatusBadge status={shipment.status || "pending"} />
                        </TableCell>
                        <TableCell>
                          {shipment.shipped_date
                            ? format(new Date(shipment.shipped_date), "MMM d, yyyy")
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {shipment.estimated_delivery
                            ? format(new Date(shipment.estimated_delivery), "MMM d, yyyy")
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {shipment.tracking_number && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/portal/shipping?tracking=${shipment.tracking_number}`)}
                            >
                              Track
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="card-content-compact">
                <EmptyState
                  icon={Truck}
                  title="No shipments yet"
                  description={!order.final_payment_paid ? "Final payment required before shipping" : "No shipments created yet"}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
