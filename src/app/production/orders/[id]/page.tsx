"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { toast } from "sonner";
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
import { DollarSign, Package, Truck, AlertCircle, CheckCircle, ArrowLeft, Settings, Trash2, Ship, Clock, PackageCheck, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useProductionOrdersRealtime, useShipmentsRealtime } from "@/hooks/useRealtimeSubscription";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProductionOrderDetailPage({ params }: PageProps) {
  const { id } = use(params);
 const router = useRouter();
 const { user, loading: authLoading } = useAuth();

 // Auth is handled by middleware - no client-side redirect needed
 const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
 const [statusDialogOpen, setStatusDialogOpen] = useState(false);
 const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
 const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
 const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
 const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>("");
 const [selectedStatus, setSelectedStatus] = useState<string>("");
 const [selectedQuote, setSelectedQuote] = useState<any>(null);
 const [quotes, setQuotes] = useState<any[]>([]);
 const [paymentForm, setPaymentForm] = useState({
 amount: 0,
 payment_method: "credit_card" as "credit_card" | "wire_transfer" | "check" | "ach",
 transaction_id: "",
 notes: "",
 });
 const [shippingForm, setShippingForm] = useState({
 origin: {
 name: "Limn Systems Factory",
 address_line1: "",
 city: "",
 state: "",
 postal_code: "",
 country: "US",
 },
 destination: {
 name: "",
 address_line1: "",
 city: "",
 state: "",
 postal_code: "",
 country: "US",
 },
 packages: [{
 length: 0,
 width: 0,
 height: 0,
 weight: 0,
 quantity: 1,
 }],
 special_instructions: "",
 });

 const { data: order, error: orderError } = api.productionOrders.getById.useQuery(
 {
 id: id as string,
 },
 { enabled: true } // Middleware ensures auth
 );

 // Get tRPC utils for cache invalidation
 const utils = api.useUtils();

 const recordPayment = api.productionInvoices.recordPayment.useMutation({
 onSuccess: (data) => {
 toast.success(data.message || "Payment recorded successfully!");
 // Invalidate queries for instant updates
 utils.productionOrders.getById.invalidate();
 utils.productionOrders.getAll.invalidate();
 setPaymentDialogOpen(false);
 setPaymentForm({ amount: 0, payment_method: "credit_card", transaction_id: "", notes: "" });
 },
 onError: (error) => {
 toast.error(error.message || "Failed to record payment");
 },
 });

 const updateStatus = api.productionOrders.updateStatus.useMutation({
 onSuccess: (data) => {
 toast.success(data.message || "Status updated successfully!");
 // Invalidate queries for instant updates
 utils.productionOrders.getById.invalidate();
 utils.productionOrders.getAll.invalidate();
 setStatusDialogOpen(false);
 },
 onError: (error) => {
 toast.error(error.message || "Failed to update status");
 },
 });

 const deleteOrder = api.productionOrders.delete.useMutation({
 onSuccess: () => {
 toast.success("Production order deleted successfully!");
 router.push("/production/orders");
 },
 onError: (error) => {
 toast.error(error.message || "Failed to delete production order");
 },
 });

 const getQuotes = api.shipping.getQuotes.useMutation({
 onSuccess: (data) => {
 toast.success(`Received ${data.quotes.length} shipping quotes!`);
 setQuotes(data.quotes);
 setQuoteDialogOpen(false);
 },
 onError: (error) => {
 toast.error(error.message || "Failed to get shipping quotes");
 },
 });

 const createShipment = api.shipping.createShipment.useMutation({
 onSuccess: (data) => {
 toast.success(`Shipment created! Tracking: ${data.shipment.tracking_number}`);
 // Invalidate queries for instant updates
 utils.productionOrders.getById.invalidate();
 utils.shipping.getShipmentsByOrder.invalidate();
 setBookingDialogOpen(false);
 setQuotes([]);
 setSelectedQuote(null);
 },
 onError: (error) => {
 toast.error(error.message || "Failed to create shipment");
 },
 });

 const { data: shipments, error: shipmentsError } = api.shipping.getShipmentsByOrder.useQuery({
 production_order_id: id as string,
 });

 // Subscribe to realtime updates for this specific production order
 useProductionOrdersRealtime({
 orderId: id as string,
 queryKey: ['productionOrders', 'getById', { id }],
 enabled: true, // Middleware ensures auth
 });

 // Subscribe to realtime updates for shipments
 useShipmentsRealtime({
 orderId: id as string,
 queryKey: ['shipping', 'getShipmentsByOrder', { production_order_id: id }],
 enabled: !authLoading && !!user,
 });

 // Packing jobs query
 const { data: packingJobsData, error: packingJobsError } = api.packing.getAllJobs.useQuery({
 orderId: order?.order_id,
 limit: 50,
 offset: 0,
 }, { enabled: !!order?.order_id });

 const packingJobs = packingJobsData?.jobs || [];

 // Auto-generate packing jobs mutation
 const autoGeneratePackingJobs = api.packing.autoGenerateFromOrder.useMutation({
 onSuccess: (data) => {
 toast.success(data.message || "Packing jobs generated successfully!");
 // Invalidate queries for instant updates
 utils.packing.getAllJobs.invalidate();
 },
 onError: (error) => {
 toast.error(error.message || "Failed to generate packing jobs");
 },
 });

 const openPaymentDialog = (id: string, amountDue: number) => {
 setSelectedInvoiceId(id);
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

 const handleRequestQuotes = () => {
 getQuotes.mutate({
 production_order_id: id as string,
 origin: shippingForm.origin,
 destination: shippingForm.destination,
 packages: shippingForm.packages,
 });
 };

 const handleBookShipment = () => {
 if (!selectedQuote) {
 toast.error("Please select a shipping quote");
 return;
 }

 createShipment.mutate({
 production_order_id: id as string,
 origin: shippingForm.origin,
 destination: shippingForm.destination,
 packages: shippingForm.packages,
 carrier: selectedQuote.carrier,
 service_level: selectedQuote.service_level,
 special_instructions: shippingForm.special_instructions,
 });
 };

 // Show loading state while checking authentication
 if (authLoading) {
 return (
 <div className="container mx-auto py-6">
 <div className="flex items-center justify-center h-64">
 <div className="text-center">
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border mx-auto mb-4"></div>
 <p className="text-muted-foreground">Loading...</p>
 </div>
 </div>
 </div>
 );
 }

 // Don't render if not authenticated (will redirect)
 if (!user) {
 return null;
 }

 // Handle query error
 if (orderError || shipmentsError || packingJobsError) {
 const error = orderError || shipmentsError || packingJobsError;
 return (
 <div className="container mx-auto py-6">
 <Link href="/production/orders">
 <Button variant="ghost" className="mb-4">
 <ArrowLeft className="h-4 w-4 mr-2" />
 Back to Production Orders
 </Button>
 </Link>
 <div className="flex flex-col items-center justify-center min-h-[400px]">
 <AlertCircle className="w-16 h-16 text-destructive mb-4" aria-hidden="true" />
 <h2 className="text-2xl font-bold mb-2">Failed to load production order</h2>
 <p className="text-muted-foreground mb-4">{error?.message || "An unexpected error occurred. Please try again."}</p>
 <Button onClick={() => {
 utils.productionOrders.getById.invalidate();
 utils.shipping.getShipmentsByOrder.invalidate();
 utils.packing.getAllJobs.invalidate();
 }}>
 <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
 Try Again
 </Button>
 </div>
 </div>
 );
 }

 // Show loading state while fetching order
 if (!order) {
 return (
 <div className="container mx-auto py-6">
 <div className="text-center py-12">
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border mx-auto mb-4"></div>
 <p className="text-muted-foreground">Loading order...</p>
 </div>
 </div>
 );
 }

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
 <div className="flex items-center gap-2">
 <Button
 variant="outline"
 size="sm"
 onClick={() => {
 setSelectedStatus(order.status);
 setStatusDialogOpen(true);
 }}
 >
 <Settings className="h-4 w-4 mr-2" />
 Update Status
 </Button>
 <Button
 variant="outline"
 size="sm"
 onClick={() => setDeleteDialogOpen(true)}
 className="text-destructive hover:text-destructive hover:bg-destructive-muted"
 >
 <Trash2 className="h-4 w-4 mr-2" />
 Delete
 </Button>
 <Badge variant="outline" className={
 order.status === "awaiting_deposit" ? "bg-warning-muted text-warning border-warning" :
 order.status === "in_progress" ? "bg-info-muted text-info border-info" :
 order.status === "completed" ? "bg-primary-muted text-primary border-primary" :
 order.status === "awaiting_final_payment" ? "bg-warning-muted text-warning border-warning" :
 order.status === "final_paid" ? "bg-success-muted text-success border-success" : ""
 }>
 {order.status.replace(/_/g, " ").toUpperCase()}
 </Badge>
 </div>
 </div>
 </div>

 {/* Payment Status Alerts */}
 {!order.deposit_paid && depositInvoice && (
 <Alert className="mb-6 border-warning bg-warning-muted">
 <AlertCircle className="h-4 w-4 text-warning" />
 <AlertDescription className="text-warning">
 <strong>Production Blocked:</strong> Awaiting 50% deposit payment of ${Number(depositInvoice.amount_due).toFixed(2)}
 </AlertDescription>
 </Alert>
 )}

 {order.deposit_paid && !order.final_payment_paid && order.status === "awaiting_final_payment" && finalInvoice && (
 <Alert className="mb-6 border-warning bg-warning-muted">
 <AlertCircle className="h-4 w-4 text-warning" />
 <AlertDescription className="text-warning">
 <strong>Shipping Blocked:</strong> Awaiting final payment of ${Number(finalInvoice.amount_due).toFixed(2)}
 </AlertDescription>
 </Alert>
 )}

 {order.final_payment_paid && (
 <Alert className="mb-6 border-success bg-success-muted">
 <CheckCircle className="h-4 w-4 text-success" />
 <AlertDescription className="text-success">
 <strong>Fully Paid:</strong> Order is ready for shipment
 </AlertDescription>
 </Alert>
 )}

 <Tabs defaultValue="overview" className="space-y-4">
 <TabsList>
 <TabsTrigger value="overview">Overview</TabsTrigger>
 <TabsTrigger value="invoices">Invoices & Payments</TabsTrigger>
 <TabsTrigger value="items">Ordered Items ({order.ordered_items_production?.length ?? 0})</TabsTrigger>
 <TabsTrigger value="packing">Packing</TabsTrigger>
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
 depositInvoice.status === "paid" ? "bg-success-muted" : "bg-warning-muted text-warning border-warning"
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
 <p className="text-lg font-bold text-destructive">${Number(depositInvoice.amount_due).toFixed(2)}</p>
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
 finalInvoice.status === "paid" ? "bg-success-muted" : "bg-warning-muted text-warning border-warning"
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
 <p className="text-lg font-bold text-destructive">${Number(finalInvoice.amount_due).toFixed(2)}</p>
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
 item.qc_status === "pass" ? "bg-success-muted" : ""
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

 {/* Packing Tab */}
 <TabsContent value="packing" className="space-y-4">
 <Card>
 <CardHeader>
 <div className="flex items-center justify-between">
 <CardTitle>Packing Jobs</CardTitle>
 <Button
 onClick={() => autoGeneratePackingJobs.mutate({ productionOrderId: order.id })}
 disabled={autoGeneratePackingJobs.isPending || packingJobs.length > 0}
 >
 <PackageCheck className="w-4 h-4 mr-2" aria-hidden="true" />
 {packingJobs.length > 0 ? "Packing Jobs Generated" : "Auto-Generate Packing Jobs"}
 </Button>
 </div>
 </CardHeader>
 <CardContent>
 {packingJobs.length === 0 ? (
 <div className="text-center py-8 text-muted-foreground">
 <PackageCheck className="w-12 h-12 mx-auto mb-2 opacity-50" aria-hidden="true" />
 <p className="text-sm mb-4">No packing jobs generated yet</p>
 <p className="text-xs">Click &quot;Auto-Generate Packing Jobs&quot; to create packing jobs from production order items</p>
 </div>
 ) : (
 <div className="space-y-4">
 <Alert>
 <AlertCircle className="h-4 w-4" aria-hidden="true" />
 <AlertDescription>
 {packingJobs.length} packing {packingJobs.length === 1 ? "job" : "jobs"} generated from this production order
 </AlertDescription>
 </Alert>
 <Table>
 <TableHeader>
 <TableRow>
 <TableHead>Item Description</TableHead>
 <TableHead>Quantity</TableHead>
 <TableHead>Status</TableHead>
 <TableHead>Boxes</TableHead>
 <TableHead>Weight</TableHead>
 <TableHead>Actions</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {packingJobs.map((job: any) => (
 <TableRow key={job.id}>
 <TableCell>{job.order_items?.description || "—"}</TableCell>
 <TableCell>
 {job.packed_quantity} / {job.quantity}
 </TableCell>
 <TableCell>
 <Badge variant="outline" className={
 job.packing_status === "shipped" ? "bg-primary-muted text-primary border-primary" :
 job.packing_status === "packed" ? "bg-success-muted text-success border-success" :
 job.packing_status === "in_progress" ? "bg-info-muted text-info border-info" :
 "badge-neutral"
 }>
 {job.packing_status.replace(/_/g, " ").toUpperCase()}
 </Badge>
 </TableCell>
 <TableCell>{job.box_count || 0}</TableCell>
 <TableCell>
 {job.total_weight ? `${Number(job.total_weight).toFixed(2)} lbs` : "—"}
 </TableCell>
 <TableCell>
 <Link href={`/packing/${job.id}`}>
 <Button variant="outline" size="sm">View</Button>
 </Link>
 </TableCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 </div>
 )}
 </CardContent>
 </Card>
 </TabsContent>

 {/* Shipments Tab */}
 <TabsContent value="shipments" className="space-y-4">
 {/* Shipping Quotes Comparison */}
 {quotes.length > 0 && (
 <Card>
 <CardHeader>
 <CardTitle>Shipping Quotes Comparison</CardTitle>
 </CardHeader>
 <CardContent>
 <Table>
 <TableHeader>
 <TableRow>
 <TableHead>Select</TableHead>
 <TableHead>Carrier</TableHead>
 <TableHead>Service Level</TableHead>
 <TableHead>Est. Delivery</TableHead>
 <TableHead>Cost</TableHead>
 <TableHead>Action</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {quotes.map((quote, idx) => (
 <TableRow
 key={idx}
 className={selectedQuote === quote ? "bg-info-muted" : ""}
 >
 <TableCell>
 <input
 type="radio"
 name="quote"
 checked={selectedQuote === quote}
 onChange={() => setSelectedQuote(quote)}
 className="h-4 w-4"
 />
 </TableCell>
 <TableCell className="font-medium">{quote.carrier}</TableCell>
 <TableCell>{quote.service_name}</TableCell>
 <TableCell>
 <div className="flex items-center gap-1">
 <Clock className="h-3 w-3 text-muted-foreground" />
 {quote.estimated_days} days
 </div>
 </TableCell>
 <TableCell className="font-mono">${quote.total_charge.toFixed(2)}</TableCell>
 <TableCell>
 {selectedQuote === quote && (
 <Badge variant="outline" className="bg-info-muted text-info border-info">
 Selected
 </Badge>
 )}
 </TableCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 <div className="flex gap-2 mt-4">
 <Button onClick={() => setBookingDialogOpen(true)} disabled={!selectedQuote}>
 <Ship className="h-4 w-4 mr-2" />
 Book Selected Carrier
 </Button>
 <Button variant="outline" onClick={() => setQuotes([])}>
 Clear Quotes
 </Button>
 </div>
 </CardContent>
 </Card>
 )}

 {/* Existing Shipments */}
 <Card>
 <CardHeader>
 <div className="flex items-center justify-between">
 <CardTitle>Shipments</CardTitle>
 {order.final_payment_paid && (
 <Button onClick={() => setQuoteDialogOpen(true)} size="sm">
 <Ship className="h-4 w-4 mr-2" />
 Request Shipping Quotes
 </Button>
 )}
 </div>
 </CardHeader>
 <CardContent>
 {!order.final_payment_paid ? (
 <Alert>
 <AlertCircle className="h-4 w-4" />
 <AlertDescription>
 Shipment creation is blocked until final payment is received
 </AlertDescription>
 </Alert>
 ) : !shipments || shipments.length === 0 ? (
 <div className="text-center py-6">
 <p className="text-muted-foreground mb-4">No shipments created yet</p>
 <p className="text-sm text-muted-foreground">Request quotes to compare carriers and create a shipment</p>
 </div>
 ) : (
 <Table>
 <TableHeader>
 <TableRow>
 <TableHead>Shipment #</TableHead>
 <TableHead>Tracking #</TableHead>
 <TableHead>Carrier</TableHead>
 <TableHead>Service Level</TableHead>
 <TableHead>Status</TableHead>
 <TableHead>Cost</TableHead>
 <TableHead>Est. Delivery</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {shipments.map((shipment: any) => (
 <TableRow key={shipment.id}>
 <TableCell className="font-medium">{shipment.shipment_number || "—"}</TableCell>
 <TableCell className="font-mono">{shipment.tracking_number || "—"}</TableCell>
 <TableCell>{shipment.carrier || "—"}</TableCell>
 <TableCell>{shipment.service_level || "—"}</TableCell>
 <TableCell>
 <Badge variant="outline" className={
 shipment.status === "delivered" ? "bg-success-muted text-success border-success" :
 shipment.status === "in_transit" ? "bg-info-muted text-info border-info" :
 "badge-neutral"
 }>
 {shipment.status}
 </Badge>
 </TableCell>
 <TableCell>${Number(shipment.shipping_cost || 0).toFixed(2)}</TableCell>
 <TableCell>
 {shipment.estimated_delivery
 ? new Date(shipment.estimated_delivery).toLocaleDateString()
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

 {/* Status Update Dialog */}
 <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
 <DialogContent>
 <DialogHeader>
 <DialogTitle>Update Production Order Status</DialogTitle>
 </DialogHeader>
 <div className="space-y-4">
 <div>
 <Label htmlFor="status">New Status</Label>
 <Select
 value={selectedStatus}
 onValueChange={setSelectedStatus}
 >
 <SelectTrigger>
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="awaiting_deposit">Awaiting Deposit</SelectItem>
 <SelectItem value="in_progress">In Progress</SelectItem>
 <SelectItem value="completed">Completed</SelectItem>
 <SelectItem value="awaiting_final_payment">Awaiting Final Payment</SelectItem>
 <SelectItem value="final_paid">Final Paid (Ready to Ship)</SelectItem>
 <SelectItem value="shipped">Shipped</SelectItem>
 <SelectItem value="delivered">Delivered</SelectItem>
 </SelectContent>
 </Select>
 <p className="text-sm text-muted-foreground mt-2">
 Note: Changing status to &ldquo;completed&rdquo; will auto-generate the final invoice
 </p>
 </div>

 <div className="flex gap-2">
 <Button
 onClick={() => {
 updateStatus.mutate({
 id: id as string,
 status: selectedStatus,
 });
 }}
 disabled={updateStatus.isPending}
 >
 {updateStatus.isPending ? "Updating..." : "Update Status"}
 </Button>
 <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
 Cancel
 </Button>
 </div>
 </div>
 </DialogContent>
 </Dialog>

 {/* Delete Confirmation Dialog */}
 <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
 <DialogContent>
 <DialogHeader>
 <DialogTitle>Delete Production Order</DialogTitle>
 </DialogHeader>
 <div className="space-y-4">
 <Alert variant="destructive">
 <AlertCircle className="h-4 w-4" />
 <AlertDescription>
 <strong>Warning:</strong> This action cannot be undone. The production order will be permanently deleted.
 </AlertDescription>
 </Alert>

 {order && (Number(order.production_invoices?.find((inv: any) => inv.amount_paid > 0)?.amount_paid) > 0) && (
 <Alert variant="destructive">
 <AlertCircle className="h-4 w-4" />
 <AlertDescription>
 <strong>Cannot Delete:</strong> This production order has received payments and cannot be deleted. Please cancel it instead.
 </AlertDescription>
 </Alert>
 )}

 <p className="text-sm text-muted-foreground">
 Are you sure you want to delete production order <strong>{order?.order_number}</strong>?
 </p>

 <div className="flex gap-2">
 <Button
 variant="destructive"
 onClick={() => {
 deleteOrder.mutate({ id: id as string });
 }}
 disabled={deleteOrder.isPending || (Number(order?.production_invoices?.find((inv: any) => inv.amount_paid > 0)?.amount_paid) > 0)}
 >
 {deleteOrder.isPending ? "Deleting..." : "Delete Production Order"}
 </Button>
 <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
 Cancel
 </Button>
 </div>
 </div>
 </DialogContent>
 </Dialog>

 {/* Quote Request Dialog */}
 <Dialog open={quoteDialogOpen} onOpenChange={setQuoteDialogOpen}>
 <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
 <DialogHeader>
 <DialogTitle>Request Shipping Quotes</DialogTitle>
 </DialogHeader>
 <div className="space-y-4">
 {/* Origin Address */}
 <div>
 <h3 className="font-semibold mb-2">Origin Address (Factory)</h3>
 <div className="grid grid-cols-2 gap-3">
 <div>
 <Label>Name</Label>
 <Input
 value={shippingForm.origin.name}
 onChange={(e) => setShippingForm({
 ...shippingForm,
 origin: { ...shippingForm.origin, name: e.target.value }
 })}
 />
 </div>
 <div>
 <Label>Address Line 1</Label>
 <Input
 value={shippingForm.origin.address_line1}
 onChange={(e) => setShippingForm({
 ...shippingForm,
 origin: { ...shippingForm.origin, address_line1: e.target.value }
 })}
 />
 </div>
 <div>
 <Label>City</Label>
 <Input
 value={shippingForm.origin.city}
 onChange={(e) => setShippingForm({
 ...shippingForm,
 origin: { ...shippingForm.origin, city: e.target.value }
 })}
 />
 </div>
 <div>
 <Label>State</Label>
 <Input
 value={shippingForm.origin.state}
 onChange={(e) => setShippingForm({
 ...shippingForm,
 origin: { ...shippingForm.origin, state: e.target.value }
 })}
 />
 </div>
 <div>
 <Label>Postal Code</Label>
 <Input
 value={shippingForm.origin.postal_code}
 onChange={(e) => setShippingForm({
 ...shippingForm,
 origin: { ...shippingForm.origin, postal_code: e.target.value }
 })}
 />
 </div>
 </div>
 </div>

 {/* Destination Address */}
 <div>
 <h3 className="font-semibold mb-2">Destination Address (Customer)</h3>
 <div className="grid grid-cols-2 gap-3">
 <div>
 <Label>Name</Label>
 <Input
 value={shippingForm.destination.name}
 onChange={(e) => setShippingForm({
 ...shippingForm,
 destination: { ...shippingForm.destination, name: e.target.value }
 })}
 />
 </div>
 <div>
 <Label>Address Line 1</Label>
 <Input
 value={shippingForm.destination.address_line1}
 onChange={(e) => setShippingForm({
 ...shippingForm,
 destination: { ...shippingForm.destination, address_line1: e.target.value }
 })}
 />
 </div>
 <div>
 <Label>City</Label>
 <Input
 value={shippingForm.destination.city}
 onChange={(e) => setShippingForm({
 ...shippingForm,
 destination: { ...shippingForm.destination, city: e.target.value }
 })}
 />
 </div>
 <div>
 <Label>State</Label>
 <Input
 value={shippingForm.destination.state}
 onChange={(e) => setShippingForm({
 ...shippingForm,
 destination: { ...shippingForm.destination, state: e.target.value }
 })}
 />
 </div>
 <div>
 <Label>Postal Code</Label>
 <Input
 value={shippingForm.destination.postal_code}
 onChange={(e) => setShippingForm({
 ...shippingForm,
 destination: { ...shippingForm.destination, postal_code: e.target.value }
 })}
 />
 </div>
 </div>
 </div>

 {/* Package Dimensions */}
 <div>
 <h3 className="font-semibold mb-2">Package Dimensions</h3>
 <div className="grid grid-cols-4 gap-3">
 <div>
 <Label>Length (in)</Label>
 <Input
 type="number"
 value={shippingForm.packages[0].length}
 onChange={(e) => setShippingForm({
 ...shippingForm,
 packages: [{ ...shippingForm.packages[0], length: Number(e.target.value) }]
 })}
 />
 </div>
 <div>
 <Label>Width (in)</Label>
 <Input
 type="number"
 value={shippingForm.packages[0].width}
 onChange={(e) => setShippingForm({
 ...shippingForm,
 packages: [{ ...shippingForm.packages[0], width: Number(e.target.value) }]
 })}
 />
 </div>
 <div>
 <Label>Height (in)</Label>
 <Input
 type="number"
 value={shippingForm.packages[0].height}
 onChange={(e) => setShippingForm({
 ...shippingForm,
 packages: [{ ...shippingForm.packages[0], height: Number(e.target.value) }]
 })}
 />
 </div>
 <div>
 <Label>Weight (lbs)</Label>
 <Input
 type="number"
 value={shippingForm.packages[0].weight}
 onChange={(e) => setShippingForm({
 ...shippingForm,
 packages: [{ ...shippingForm.packages[0], weight: Number(e.target.value) }]
 })}
 />
 </div>
 </div>
 </div>

 <div className="flex gap-2">
 <Button onClick={handleRequestQuotes} disabled={getQuotes.isPending}>
 {getQuotes.isPending ? "Requesting Quotes..." : "Request Quotes"}
 </Button>
 <Button variant="outline" onClick={() => setQuoteDialogOpen(false)}>
 Cancel
 </Button>
 </div>
 </div>
 </DialogContent>
 </Dialog>

 {/* Shipment Booking Confirmation Dialog */}
 <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
 <DialogContent>
 <DialogHeader>
 <DialogTitle>Confirm Shipment Booking</DialogTitle>
 </DialogHeader>
 <div className="space-y-4">
 {selectedQuote && (
 <>
 <div className="space-y-2">
 <div className="flex justify-between">
 <span className="text-sm font-medium">Carrier:</span>
 <span className="text-sm">{selectedQuote.carrier}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-sm font-medium">Service Level:</span>
 <span className="text-sm">{selectedQuote.service_name}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-sm font-medium">Estimated Delivery:</span>
 <span className="text-sm">{selectedQuote.estimated_days} days</span>
 </div>
 <div className="flex justify-between">
 <span className="text-sm font-medium">Shipping Cost:</span>
 <span className="text-sm font-mono">${selectedQuote.total_charge.toFixed(2)}</span>
 </div>
 </div>

 <div>
 <Label>Special Instructions (Optional)</Label>
 <Textarea
 value={shippingForm.special_instructions}
 onChange={(e) => setShippingForm({
 ...shippingForm,
 special_instructions: e.target.value
 })}
 placeholder="Add any special shipping instructions..."
 rows={3}
 />
 </div>

 <Alert>
 <AlertCircle className="h-4 w-4" />
 <AlertDescription>
 Booking this shipment will create a tracking number and generate a shipping label.
 </AlertDescription>
 </Alert>

 <div className="flex gap-2">
 <Button onClick={handleBookShipment} disabled={createShipment.isPending}>
 {createShipment.isPending ? "Booking..." : "Confirm Booking"}
 </Button>
 <Button variant="outline" onClick={() => setBookingDialogOpen(false)}>
 Cancel
 </Button>
 </div>
 </>
 )}
 </div>
 </DialogContent>
 </Dialog>
 </div>
 );
}
