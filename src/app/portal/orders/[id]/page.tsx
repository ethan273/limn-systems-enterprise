"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
  Clock,
  Truck,
  CheckCircle2,
  DollarSign,
  ArrowLeft,
  AlertCircle,
  FileText,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// Dynamic route configuration
export const dynamic = 'force-dynamic';

const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  awaiting_deposit: {
    label: "Awaiting Deposit",
    className: "bg-yellow-100 text-yellow-800 border-yellow-300",
    icon: <Clock className="w-4 h-4" aria-hidden="true" />,
  },
  deposit_paid: {
    label: "Deposit Paid",
    className: "bg-blue-100 text-blue-800 border-blue-300",
    icon: <DollarSign className="w-4 h-4" aria-hidden="true" />,
  },
  in_progress: {
    label: "In Production",
    className: "bg-blue-100 text-blue-800 border-blue-300",
    icon: <Package className="w-4 h-4" aria-hidden="true" />,
  },
  completed: {
    label: "Completed",
    className: "bg-green-100 text-green-800 border-green-300",
    icon: <CheckCircle2 className="w-4 h-4" aria-hidden="true" />,
  },
  awaiting_final_payment: {
    label: "Awaiting Final Payment",
    className: "bg-yellow-100 text-yellow-800 border-yellow-300",
    icon: <Clock className="w-4 h-4" aria-hidden="true" />,
  },
  final_paid: {
    label: "Final Payment Received",
    className: "bg-green-100 text-green-800 border-green-300",
    icon: <DollarSign className="w-4 h-4" aria-hidden="true" />,
  },
  shipped: {
    label: "Shipped",
    className: "bg-purple-100 text-purple-800 border-purple-300",
    icon: <Truck className="w-4 h-4" aria-hidden="true" />,
  },
  delivered: {
    label: "Delivered",
    className: "bg-green-100 text-green-800 border-green-300",
    icon: <CheckCircle2 className="w-4 h-4" aria-hidden="true" />,
  },
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch order details
  const { data: order, isLoading } = api.portal.getOrderById.useQuery(
    { orderId },
    { enabled: !!orderId }
  );

  // Fetch shipments
  const { data: shipments } = api.portal.getOrderShipments.useQuery(
    { orderId },
    { enabled: !!orderId }
  );

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>Order not found or you do not have permission to view it</AlertDescription>
        </Alert>
      </div>
    );
  }

  const config = statusConfig[order.status] || statusConfig.awaiting_deposit;
  const depositInvoice = order.production_invoices?.find((inv) => inv.invoice_type === 'deposit');
  const finalInvoice = order.production_invoices?.find((inv) => inv.invoice_type === 'final');

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/portal/orders")}>
            <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
            Back to Orders
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Order {order.order_number}</h1>
            <p className="text-muted-foreground">{order.item_name}</p>
          </div>
        </div>
        <Badge variant="outline" className={cn(config.className, "text-base px-3 py-1")}>
          {config.icon}
          <span className="ml-2">{config.label}</span>
        </Badge>
      </div>

      {/* Payment Alerts */}
      {order.status === "awaiting_deposit" && (
        <Alert>
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>
            <strong>Payment Required:</strong> A 50% deposit payment is required before production can begin.
            Please contact your account manager for payment instructions.
          </AlertDescription>
        </Alert>
      )}

      {order.status === "awaiting_final_payment" && (
        <Alert>
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>
            <strong>Final Payment Required:</strong> Your order is ready to ship. The remaining 50% balance
            payment is required before shipment. Please contact your account manager for payment instructions.
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Order Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${Number(order.total_cost).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {order.quantity} items @ ${Number(order.unit_price).toLocaleString()} each
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deposit Status</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <Badge
              variant="outline"
              className={cn(
                "text-sm",
                order.deposit_paid
                  ? "bg-green-100 text-green-800 border-green-300"
                  : "bg-yellow-100 text-yellow-800 border-yellow-300"
              )}
            >
              {order.deposit_paid ? "Paid" : "Pending"}
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">
              ${Number(Number(order.total_cost) * 0.5).toLocaleString()} (50%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Final Payment</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <Badge
              variant="outline"
              className={cn(
                "text-sm",
                order.final_payment_paid
                  ? "bg-green-100 text-green-800 border-green-300"
                  : "bg-yellow-100 text-yellow-800 border-yellow-300"
              )}
            >
              {order.final_payment_paid ? "Paid" : "Pending"}
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">
              ${Number(Number(order.total_cost) * 0.5).toLocaleString()} (50%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Est. Ship Date</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {order.estimated_ship_date
                ? format(new Date(order.estimated_ship_date), "MMM d, yyyy")
                : "TBD"}
            </div>
            {order.actual_ship_date && (
              <p className="text-xs text-muted-foreground mt-1">
                Shipped: {format(new Date(order.actual_ship_date), "MMM d, yyyy")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="invoices">Invoices & Payments</TabsTrigger>
          <TabsTrigger value="shipments">Shipments</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Order Number</label>
                  <p className="text-base font-mono">{order.order_number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Project</label>
                  <p className="text-base">{order.projects?.name || "—"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Item Name</label>
                  <p className="text-base">{order.item_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Product Type</label>
                  <p className="text-base capitalize">{order.product_type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Quantity</label>
                  <p className="text-base">{order.quantity} units</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Unit Price</label>
                  <p className="text-base">${Number(order.unit_price).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Total Cost</label>
                  <p className="text-base font-semibold">${Number(order.total_cost).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Order Date</label>
                  <p className="text-base">{format(new Date(order.order_date), "MMM d, yyyy")}</p>
                </div>
              </div>

              {order.item_description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="text-base mt-1">{order.item_description}</p>
                </div>
              )}

              {order.factory_notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Production Notes</label>
                  <Alert className="mt-2">
                    <FileText className="h-4 w-4" aria-hidden="true" />
                    <AlertDescription>{order.factory_notes}</AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices & Payments Tab */}
        <TabsContent value="invoices" className="space-y-4">
          {/* Deposit Invoice */}
          {depositInvoice && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Deposit Invoice (50%)</CardTitle>
                  <Badge
                    variant="outline"
                    className={cn(
                      depositInvoice.status === "paid"
                        ? "bg-green-100 text-green-800 border-green-300"
                        : "bg-yellow-100 text-yellow-800 border-yellow-300"
                    )}
                  >
                    {depositInvoice.status === "paid" ? "Paid" : "Pending"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Invoice Number</label>
                    <p className="text-base font-mono">{depositInvoice.invoice_number}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Total</label>
                    <p className="text-base font-semibold">${Number(depositInvoice.total).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Amount Paid</label>
                    <p className="text-base">${Number(depositInvoice.amount_paid).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Amount Due</label>
                    <p className="text-base font-semibold text-red-600">
                      ${Number(depositInvoice.amount_due).toLocaleString()}
                    </p>
                  </div>
                </div>

                {depositInvoice.production_payments && depositInvoice.production_payments.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Payment History</h4>
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
                            <TableCell>
                              {format(new Date(payment.payment_date), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell>${Number(payment.amount).toLocaleString()}</TableCell>
                            <TableCell className="capitalize">{payment.payment_method}</TableCell>
                            <TableCell className="font-mono text-sm">
                              {payment.transaction_id || "—"}
                            </TableCell>
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
                  <Badge
                    variant="outline"
                    className={cn(
                      finalInvoice.status === "paid"
                        ? "bg-green-100 text-green-800 border-green-300"
                        : "bg-yellow-100 text-yellow-800 border-yellow-300"
                    )}
                  >
                    {finalInvoice.status === "paid" ? "Paid" : "Pending"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Invoice Number</label>
                    <p className="text-base font-mono">{finalInvoice.invoice_number}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Total</label>
                    <p className="text-base font-semibold">${Number(finalInvoice.total).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Amount Paid</label>
                    <p className="text-base">${Number(finalInvoice.amount_paid).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Amount Due</label>
                    <p className="text-base font-semibold text-red-600">
                      ${Number(finalInvoice.amount_due).toLocaleString()}
                    </p>
                  </div>
                </div>

                {finalInvoice.production_payments && finalInvoice.production_payments.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Payment History</h4>
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
                            <TableCell>
                              {format(new Date(payment.payment_date), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell>${Number(payment.amount).toLocaleString()}</TableCell>
                            <TableCell className="capitalize">{payment.payment_method}</TableCell>
                            <TableCell className="font-mono text-sm">
                              {payment.transaction_id || "—"}
                            </TableCell>
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
              <CardContent className="p-12">
                <div className="text-center text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" aria-hidden="true" />
                  <p>No invoices generated yet</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Shipments Tab */}
        <TabsContent value="shipments" className="space-y-4">
          {shipments && shipments.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Shipments</CardTitle>
              </CardHeader>
              <CardContent>
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
                          <Badge variant="outline" className="capitalize">
                            {shipment.status || "pending"}
                          </Badge>
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
              <CardContent className="p-12">
                <div className="text-center text-muted-foreground">
                  <Truck className="w-12 h-12 mx-auto mb-2 opacity-50" aria-hidden="true" />
                  <p>No shipments yet</p>
                  {!order.final_payment_paid && (
                    <p className="text-sm mt-2">Final payment required before shipping</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
