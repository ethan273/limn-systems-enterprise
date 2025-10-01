"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { DollarSign, Package, Truck, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ProductionOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>("");
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    payment_method: "credit_card" as "credit_card" | "wire_transfer" | "check" | "ach",
    transaction_id: "",
    notes: "",
  });

  const { data: order, refetch } = api.productionOrders.getById.useQuery({
    id: params.id as string,
  });

  const recordPayment = api.productionInvoices.recordPayment.useMutation({
    onSuccess: () => {
      void refetch();
      setPaymentDialogOpen(false);
      setPaymentForm({ amount: 0, payment_method: "credit_card", transaction_id: "", notes: "" });
    },
  });

  const openPaymentDialog = (invoiceId: string, amountDue: number) => {
    setSelectedInvoiceId(invoiceId);
    setPaymentForm({ ...paymentForm, amount: amountDue });
    setPaymentDialogOpen(true);
  };

  const handlePayment = () => {
    recordPayment.mutate({
      production_invoice_id: selectedInvoiceId,
      amount: paymentForm.amount,
      payment_method: paymentForm.payment_method,
      transaction_id: paymentForm.transaction_id || undefined,
      notes: paymentForm.notes || undefined,
    });
  };

  if (!order) return (
    <div className="container mx-auto py-6">
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );

  const depositInvoice = order.production_invoices?.find((inv: any) => inv.invoice_type === "deposit");
  const finalInvoice = order.production_invoices?.find((inv: any) => inv.invoice_type === "final");

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="mb-6">
        <Link href="/production/orders">
          <Button variant="ghost" className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Production Orders
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{order.order_number}</h1>
            <p className="text-muted-foreground">{order.item_name}</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className={
              order.status === "awaiting_deposit" ? "bg-yellow-100 text-yellow-800 border-yellow-300" :
              order.status === "in_progress" ? "bg-blue-100 text-blue-800 border-blue-300" :
              order.status === "completed" ? "bg-purple-100 text-purple-800 border-purple-300" :
              order.status === "awaiting_final_payment" ? "bg-orange-100 text-orange-800 border-orange-300" :
              order.status === "final_paid" ? "bg-green-100 text-green-800 border-green-300" : ""
            }>
              {order.status.replace(/_/g, " ").toUpperCase()}
            </Badge>
          </div>
        </div>
      </div>

      {/* Payment Status Alerts */}
      {!order.deposit_paid && depositInvoice && (
        <Alert className="mb-6 border-yellow-500 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Production Blocked:</strong> Awaiting 50% deposit payment of ${Number(depositInvoice.amount_due).toFixed(2)}
          </AlertDescription>
        </Alert>
      )}

      {order.deposit_paid && !order.final_payment_paid && order.status === "awaiting_final_payment" && finalInvoice && (
        <Alert className="mb-6 border-orange-500 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Shipping Blocked:</strong> Awaiting final payment of ${Number(finalInvoice.amount_due).toFixed(2)}
          </AlertDescription>
        </Alert>
      )}

      {order.final_payment_paid && (
        <Alert className="mb-6 border-green-500 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Fully Paid:</strong> Order is ready for shipment
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="invoices">Invoices & Payments</TabsTrigger>
          <TabsTrigger value="items">Ordered Items ({order.ordered_items_production?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="shipments">Shipments</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Order Summary Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Order Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${Number(order.total_cost).toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {order.quantity} units @ ${Number(order.unit_price).toFixed(2)} each
                </p>
              </CardContent>
            </Card>

            {/* Production Status Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Production Status</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">
                  {order.status.replace(/_/g, " ")}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {order.ordered_items_production?.length ?? 0} items tracked
                </p>
              </CardContent>
            </Card>

            {/* Shipping Status Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Shipping</CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {order.estimated_ship_date
                    ? new Date(order.estimated_ship_date).toLocaleDateString()
                    : "Not Set"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {order.shipments?.length > 0 ? `${order.shipments.length} shipments` : "No shipments yet"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Order Details */}
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Product Type</p>
                  <p className="capitalize">{order.product_type}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Project</p>
                  <p>{order.projects?.name ?? "No project"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Factory</p>
                  <p>{order.manufacturers?.name ?? "Not assigned"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Order Date</p>
                  <p>{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              {order.item_description && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p>{order.item_description}</p>
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
                  <Badge variant={depositInvoice.status === "paid" ? "default" : "outline"} className={
                    depositInvoice.status === "paid" ? "bg-green-500" : "bg-yellow-100 text-yellow-800 border-yellow-300"
                  }>
                    {depositInvoice.status.replace(/_/g, " ").toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Invoice Number</p>
                    <p className="font-mono">{depositInvoice.invoice_number}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Invoice Date</p>
                    <p>{new Date(depositInvoice.invoice_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total</p>
                    <p className="text-lg font-bold">${Number(depositInvoice.total).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Amount Due</p>
                    <p className="text-lg font-bold text-red-600">${Number(depositInvoice.amount_due).toFixed(2)}</p>
                  </div>
                </div>

                {depositInvoice.status !== "paid" && (
                  <Button onClick={() => openPaymentDialog(depositInvoice.id, Number(depositInvoice.amount_due))}>
                    Record Payment
                  </Button>
                )}

                {depositInvoice.production_payments && depositInvoice.production_payments.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Payment History</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Payment #</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {depositInvoice.production_payments.map((payment: any) => (
                          <TableRow key={payment.id}>
                            <TableCell className="font-mono">{payment.payment_number}</TableCell>
                            <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                            <TableCell>${Number(payment.amount).toFixed(2)}</TableCell>
                            <TableCell className="capitalize">{payment.payment_method.replace(/_/g, " ")}</TableCell>
                            <TableCell>
                              <Badge variant={payment.status === "completed" ? "default" : "outline"}>
                                {payment.status}
                              </Badge>
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
                  <CardTitle>Final Invoice (50% + Shipping)</CardTitle>
                  <Badge variant={finalInvoice.status === "paid" ? "default" : "outline"} className={
                    finalInvoice.status === "paid" ? "bg-green-500" : "bg-orange-100 text-orange-800 border-orange-300"
                  }>
                    {finalInvoice.status.replace(/_/g, " ").toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Invoice Number</p>
                    <p className="font-mono">{finalInvoice.invoice_number}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Invoice Date</p>
                    <p>{new Date(finalInvoice.invoice_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Subtotal</p>
                    <p>${Number(finalInvoice.subtotal).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Shipping</p>
                    <p>${Number(finalInvoice.shipping).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total</p>
                    <p className="text-lg font-bold">${Number(finalInvoice.total).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Amount Due</p>
                    <p className="text-lg font-bold text-red-600">${Number(finalInvoice.amount_due).toFixed(2)}</p>
                  </div>
                </div>

                {finalInvoice.status !== "paid" && (
                  <Button onClick={() => openPaymentDialog(finalInvoice.id, Number(finalInvoice.amount_due))}>
                    Record Payment
                  </Button>
                )}

                {finalInvoice.production_payments && finalInvoice.production_payments.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Payment History</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Payment #</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {finalInvoice.production_payments.map((payment: any) => (
                          <TableRow key={payment.id}>
                            <TableCell className="font-mono">{payment.payment_number}</TableCell>
                            <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                            <TableCell>${Number(payment.amount).toFixed(2)}</TableCell>
                            <TableCell className="capitalize">{payment.payment_method.replace(/_/g, " ")}</TableCell>
                            <TableCell>
                              <Badge variant={payment.status === "completed" ? "default" : "outline"}>
                                {payment.status}
                              </Badge>
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
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No invoices have been generated for this production order yet.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Ordered Items Tab */}
        <TabsContent value="items">
          <Card>
            <CardHeader>
              <CardTitle>Ordered Items ({order.ordered_items_production?.length ?? 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {!order.ordered_items_production || order.ordered_items_production.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Ordered items will be auto-created when deposit payment is received
                  </AlertDescription>
                </Alert>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Item #</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>QC Status</TableHead>
                      <TableHead>QC Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.ordered_items_production.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono">{item.sku}</TableCell>
                        <TableCell>#{item.item_number}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {item.status.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {item.qc_status ? (
                            <Badge variant={item.qc_status === "pass" ? "default" : "destructive"} className={
                              item.qc_status === "pass" ? "bg-green-500" : ""
                            }>
                              {item.qc_status.toUpperCase()}
                            </Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          {item.qc_date
                            ? new Date(item.qc_date).toLocaleDateString()
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shipments Tab */}
        <TabsContent value="shipments">
          <Card>
            <CardHeader>
              <CardTitle>Shipments</CardTitle>
            </CardHeader>
            <CardContent>
              {!order.final_payment_paid ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Shipment creation is blocked until final payment is received
                  </AlertDescription>
                </Alert>
              ) : !order.shipments || order.shipments.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-4">No shipments created yet</p>
                  <Button>Create Shipment</Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tracking #</TableHead>
                      <TableHead>Carrier</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ship Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.shipments.map((shipment: any) => (
                      <TableRow key={shipment.id}>
                        <TableCell className="font-mono">{shipment.tracking_number}</TableCell>
                        <TableCell>{shipment.carrier}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{shipment.status}</Badge>
                        </TableCell>
                        <TableCell>
                          {shipment.ship_date
                            ? new Date(shipment.ship_date).toLocaleDateString()
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Payment Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
              />
            </div>

            <div>
              <Label htmlFor="payment_method">Payment Method</Label>
              <Select
                value={paymentForm.payment_method}
                onValueChange={(value: "credit_card" | "wire_transfer" | "check" | "ach") => setPaymentForm({ ...paymentForm, payment_method: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="wire_transfer">Wire Transfer</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="ach">ACH</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="transaction_id">Transaction ID (Optional)</Label>
              <Input
                id="transaction_id"
                value={paymentForm.transaction_id}
                onChange={(e) => setPaymentForm({ ...paymentForm, transaction_id: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handlePayment} disabled={recordPayment.isPending}>
                {recordPayment.isPending ? "Recording..." : "Record Payment"}
              </Button>
              <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
                Cancel
              </Button>
            </div>

            {recordPayment.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{recordPayment.error.message}</AlertDescription>
              </Alert>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
