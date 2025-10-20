"use client";

import { useState } from "react";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExpandableTableRowWithTrigger } from "@/components/ui/expandable-table-row";
import { Search, Package, DollarSign, FileText, AlertCircle, AlertTriangle, RefreshCw, Edit } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { ErrorState } from "@/components/common";

export default function CRMOrdersPage() {
 const [statusFilter, setStatusFilter] = useState<string>("all");
 const [searchQuery, setSearchQuery] = useState("");
 const { user, loading: authLoading } = useAuth();
 const _router = useRouter();
 const { toast } = useToast();

 // Auth is handled by middleware - no client-side redirect needed

 // Query CRM ORDERS with production details, invoices, and payments
 const { data, isLoading, error } = api.orders.getWithProductionDetails.useQuery(
 {},
 { enabled: true } // Middleware ensures auth
 );

 // Get tRPC utils for cache invalidation
 const utils = api.useUtils();

 // Mutation for creating invoice
 const createInvoiceMutation = api.productionInvoices.createForOrder.useMutation();

 // Filter by status and search query (client-side)
 const filteredOrders = (data?.items || []).filter((order: any) => {
 // Status filter
 if (statusFilter !== "all" && order.status !== statusFilter) {
 return false;
 }
 // Search filter
 if (!searchQuery) return true;
 const query = searchQuery.toLowerCase();
 return (
 (order.order_number || "").toLowerCase().includes(query) ||
 order.customers?.name?.toLowerCase().includes(query) ||
 order.projects?.name?.toLowerCase().includes(query)
 );
 });

 const handleGenerateInvoice = async (orderId: string, invoiceType: 'deposit' | 'final') => {
 try {
 const result = await createInvoiceMutation.mutateAsync({
 order_id: orderId,
 invoice_type: invoiceType,
 });

 toast({
 title: "Success",
 description: result.message,
 variant: "default",
 });

 // Invalidate queries for instant updates
 utils.orders.getWithProductionDetails.invalidate();
 utils.projects.getAll.invalidate();
 } catch (error: any) {
 toast({
 title: "Error",
 description: error.message || "Failed to generate invoice.",
 variant: "destructive",
 });
 }
 };

 const getStatusBadge = (status: string) => {
 let info: { label: string; variant: string; className: string };
 switch (status) {
 case 'draft':
 info = { label: "Draft", variant: "outline", className: "badge-neutral" };
 break;
 case 'pending':
 info = { label: "Pending", variant: "outline", className: "bg-warning-muted text-warning border-warning" };
 break;
 case 'confirmed':
 info = { label: "Confirmed", variant: "outline", className: "btn-primary text-info border-primary" };
 break;
 case 'in_production':
 info = { label: "In Production", variant: "outline", className: "btn-secondary text-secondary border-secondary" };
 break;
 case 'ready_to_ship':
 info = { label: "Ready to Ship", variant: "outline", className: "bg-success-muted text-success border-success" };
 break;
 case 'shipped':
 info = { label: "Shipped", variant: "outline", className: "bg-success text-success border-success" };
 break;
 case 'delivered':
 info = { label: "Delivered", variant: "outline", className: "bg-success text-success border-success" };
 break;
 case 'completed':
 info = { label: "Completed", variant: "outline", className: "bg-success-muted text-foreground border-success" };
 break;
 case 'cancelled':
 info = { label: "Cancelled", variant: "outline", className: "bg-destructive-muted text-destructive border-destructive" };
 break;
 default:
 info = { label: "Unknown", variant: "outline", className: "badge-neutral" };
 }
 return <Badge variant={info.variant as any} className={info.className}>{info.label}</Badge>;
 };

 const getPaymentStatusBadge = (invoices: any[]) => {
 if (!invoices || invoices.length === 0) {
 return <Badge variant="outline" className="badge-neutral">No Invoice</Badge>;
 }

 const depositInvoice = invoices.find((inv: any) => inv.invoice_type === 'deposit');
 const finalInvoice = invoices.find((inv: any) => inv.invoice_type === 'final');

 if (finalInvoice?.status === 'paid') {
 return <Badge variant="outline" className="bg-success-muted text-success border-success">Fully Paid</Badge>;
 }
 if (depositInvoice?.status === 'paid') {
 return <Badge variant="outline" className="bg-warning-muted text-warning border-warning">Deposit Paid</Badge>;
 }
 return <Badge variant="outline" className="bg-destructive-muted text-destructive border-destructive">Pending</Badge>;
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

 // Show error state if data fetch failed
 if (error) {
 return (
 <div className="container mx-auto py-6">
 <div className="flex flex-col items-center justify-center py-12 space-y-4">
 <div className="flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10">
 <AlertTriangle className="w-8 h-8 text-destructive" />
 </div>
 <div className="text-center space-y-2">
 <h3 className="text-lg font-semibold">Failed to load orders</h3>
 <p className="text-sm text-muted-foreground max-w-md">
 {error?.message || 'An error occurred while loading the orders.'}
 </p>
 </div>
 <Button
 onClick={() => utils.orders.getWithProductionDetails.invalidate()}
 variant="outline"
 className="gap-2"
 >
 <RefreshCw className="w-4 h-4" />
 Try Again
 </Button>
 </div>
 </div>
 );
 }

 return (
 <div className="container mx-auto py-6 space-y-6">
 {/* Header */}
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-3xl font-bold">Orders</h1>
 <p className="text-muted-foreground">
 Manage client orders with invoice generation and payment tracking. Create new orders from{" "}
 <Link href="/crm/projects" className="text-info hover:underline font-medium">
 Projects
 </Link>
 </p>
 </div>
 </div>

 {/* Filters */}
 <Card>
 <CardHeader>
 <CardTitle>Filter Customer Orders</CardTitle>
 </CardHeader>
 <CardContent className="card-content-compact">
 <div className="filters-section">
 <div className="search-input-wrapper">
 <Search className="search-icon" aria-hidden="true" />
 <Input
 placeholder="Search by order number, customer, or project..."
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
 <SelectItem value="draft">Draft</SelectItem>
 <SelectItem value="pending">Pending</SelectItem>
 <SelectItem value="confirmed">Confirmed</SelectItem>
 <SelectItem value="in_production">In Production</SelectItem>
 <SelectItem value="ready_to_ship">Ready to Ship</SelectItem>
 <SelectItem value="shipped">Shipped</SelectItem>
 <SelectItem value="delivered">Delivered</SelectItem>
 <SelectItem value="completed">Completed</SelectItem>
 <SelectItem value="cancelled">Cancelled</SelectItem>
 </SelectContent>
 </Select>
 </div>
 </CardContent>
 </Card>

 {/* Summary Stats */}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
 <div className="p-4 border rounded-lg bg-card">
 <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
 <Package className="h-4 w-4" />
 <span>Total Orders</span>
 </div>
 <div className="text-2xl font-bold">{filteredOrders?.length || 0}</div>
 </div>
 <div className="p-4 border rounded-lg bg-card">
 <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
 <DollarSign className="h-4 w-4" />
 <span>Total Value</span>
 </div>
 <div className="text-2xl font-bold">
 ${filteredOrders?.reduce((sum: number, order: any) => sum + Number(order.total_amount || 0), 0).toFixed(2)}
 </div>
 </div>
 <div className="p-4 border rounded-lg bg-card">
 <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
 <FileText className="h-4 w-4" />
 <span>With Invoices</span>
 </div>
 <div className="text-2xl font-bold">
 {filteredOrders?.filter((order: any) => order.production_invoices?.length > 0).length || 0}
 </div>
 </div>
 <div className="p-4 border rounded-lg bg-card">
 <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
 <AlertCircle className="h-4 w-4" />
 <span>Pending Payment</span>
 </div>
 <div className="text-2xl font-bold">
 {filteredOrders?.filter((order: any) => {
 const depositPaid = order.production_invoices?.find((inv: any) => inv.invoice_type === 'deposit')?.status === 'paid';
 const finalPaid = order.production_invoices?.find((inv: any) => inv.invoice_type === 'final')?.status === 'paid';
 return !depositPaid || !finalPaid;
 }).length || 0}
 </div>
 </div>
 </div>

 {/* Orders Table with Accordion */}
 <div className="rounded-md border">
 <Table>
 <TableHeader>
 <TableRow>
 <TableHead className="w-12"></TableHead>
 <TableHead>Order Number</TableHead>
 <TableHead>Customer</TableHead>
 <TableHead>Project</TableHead>
 <TableHead>Items</TableHead>
 <TableHead>Total Amount</TableHead>
 <TableHead>Payment Status</TableHead>
 <TableHead>Status</TableHead>
 <TableHead>Order Date</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {isLoading ? (
 <TableRow>
 <TableCell colSpan={9} className="text-center py-8">Loading orders...</TableCell>
 </TableRow>
 ) : filteredOrders?.length === 0 ? (
 <TableRow>
 <TableCell colSpan={9} className="text-center py-8">
 <div className="space-y-2">
 <p className="text-muted-foreground">No orders found</p>
 <p className="text-sm text-muted-foreground">
 Create orders from{" "}
 <Link href="/crm/projects" className="text-info hover:underline">
 Projects
 </Link>
 </p>
 </div>
 </TableCell>
 </TableRow>
 ) : (
 filteredOrders?.map((order: any) => {
 const itemCount = order.order_items?.length || 0;
 const productionOrderCount = order.production_orders?.length || 0;

 return (
 <ExpandableTableRowWithTrigger
 key={order.id}
 id={order.id}
 colSpan={9}
 expandedContent={
 <div className="space-y-6">

 {/* Order Items */}
 <div>
 <h4 className="font-medium text-sm mb-3">Order Items ({itemCount})</h4>
 {order.order_items?.length > 0 ? (
 <div className="rounded-md border">
 <Table>
 <TableHeader>
 <TableRow>
 <TableHead>Description</TableHead>
 <TableHead>SKU</TableHead>
 <TableHead>Quantity</TableHead>
 <TableHead>Unit Price</TableHead>
 <TableHead>Total</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {order.order_items.map((item: any) => (
 <TableRow key={item.id}>
 <TableCell>{item.description || "—"}</TableCell>
 <TableCell className="font-mono text-sm">{item.client_sku || "—"}</TableCell>
 <TableCell>{item.quantity}</TableCell>
 <TableCell>${Number(item.unit_price).toFixed(2)}</TableCell>
 <TableCell className="font-medium">
 ${(Number(item.quantity) * Number(item.unit_price)).toFixed(2)}
 </TableCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 </div>
 ) : (
 <p className="text-sm text-muted-foreground">No items in this order</p>
 )}
 </div>

 {/* Production Orders */}
 <div>
 <h4 className="font-medium text-sm mb-3">Production Orders ({productionOrderCount})</h4>
 {order.production_orders?.length > 0 ? (
 <div className="rounded-md border">
 <Table>
 <TableHeader>
 <TableRow>
 <TableHead>PO Number</TableHead>
 <TableHead>Item</TableHead>
 <TableHead>Quantity</TableHead>
 <TableHead>Total Cost</TableHead>
 <TableHead>Status</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {order.production_orders.map((po: any) => (
 <TableRow key={po.id}>
 <TableCell>
 <Link href={`/production/orders/${po.id}`} className="font-medium text-info hover:underline">
 {po.order_number}
 </Link>
 </TableCell>
 <TableCell>{po.item_name}</TableCell>
 <TableCell>{po.quantity}</TableCell>
 <TableCell>${Number(po.total_cost).toFixed(2)}</TableCell>
 <TableCell>
 <Badge variant="outline" className={
 po.status === 'in_progress' ? 'btn-primary text-info' :
 po.status === 'completed' ? 'bg-success-muted text-success' :
 'bg-warning-muted text-warning'
 }>
 {po.status}
 </Badge>
 </TableCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 </div>
 ) : (
 <p className="text-sm text-muted-foreground">No production orders created yet</p>
 )}
 </div>

 {/* Invoices & Payments */}
 <div>
 <div className="flex items-center justify-between mb-3">
 <h4 className="font-medium text-sm">Invoices & Payments</h4>
 <div className="flex gap-2">
 {productionOrderCount > 0 ? (
 <>
 {!order.production_invoices?.find((inv: any) => inv.invoice_type === 'deposit') && (
 <Button
 variant="outline"
 size="sm"
 onClick={() => handleGenerateInvoice(order.id, 'deposit')}
 disabled={createInvoiceMutation.isPending}
 >
 Generate Deposit Invoice
 </Button>
 )}
 {order.production_invoices?.find((inv: any) => inv.invoice_type === 'deposit')?.status === 'paid' &&
 !order.production_invoices?.find((inv: any) => inv.invoice_type === 'final') && (
 <Button
 variant="outline"
 size="sm"
 onClick={() => handleGenerateInvoice(order.id, 'final')}
 disabled={createInvoiceMutation.isPending}
 >
 Generate Final Invoice
 </Button>
 )}
 </>
 ) : (
 <div className="text-sm text-muted-foreground italic">
 Create production orders first to generate invoices
 </div>
 )}
 </div>
 </div>
 {order.production_invoices?.length > 0 ? (
 <div className="space-y-4">
 {order.production_invoices.map((invoice: any) => (
 <div key={invoice.id} className="rounded-md border p-4">
 <div className="flex items-center justify-between mb-2">
 <div className="flex items-center gap-3">
 <span className="font-medium">{invoice.invoice_number}</span>
 <Badge variant="outline" className="capitalize">
 {invoice.invoice_type}
 </Badge>
 <Badge variant="outline" className={
 invoice.status === 'paid' ? 'bg-success-muted text-success' :
 invoice.status === 'partial_payment' ? 'bg-warning-muted text-warning' :
 'bg-destructive-muted text-destructive'
 }>
 {invoice.status === 'pending_payment' ? 'Pending' : invoice.status}
 </Badge>
 </div>
 <div className="text-right">
 <div className="text-sm text-muted-foreground">Total: ${Number(invoice.total).toFixed(2)}</div>
 <div className="text-sm font-medium text-success">Paid: ${Number(invoice.amount_paid).toFixed(2)}</div>
 <div className="text-sm font-medium text-destructive">Due: ${Number(invoice.amount_due).toFixed(2)}</div>
 </div>
 </div>
 {invoice.production_payments?.length > 0 && (
 <div className="mt-3 pt-3 border-t">
 <p className="text-xs text-muted-foreground mb-2">Payment History:</p>
 {invoice.production_payments.map((payment: any) => (
 <div key={payment.id} className="flex items-center justify-between text-sm">
 <span>{new Date(payment.payment_date).toLocaleDateString()} - {payment.payment_method}</span>
 <span className="font-medium">${Number(payment.amount).toFixed(2)}</span>
 </div>
 ))}
 </div>
 )}
 </div>
 ))}
 </div>
 ) : (
 <p className="text-sm text-muted-foreground">No invoices generated yet</p>
 )}
 </div>

          {/* Order Actions */}
          <div className="flex justify-end pt-4 border-t">
            <Link href={`/crm/orders/${order.id}/edit`}>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit Order
              </Button>
            </Link>
          </div>

 </div>
 }
 >
 <TableCell>
 <span className="font-medium text-info">{order.order_number}</span>
 </TableCell>
 <TableCell>{order.customers?.name || "—"}</TableCell>
 <TableCell>{order.projects?.name || "—"}</TableCell>
 <TableCell>
 <span className="font-medium">{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
 </TableCell>
 <TableCell>
 <span className="font-medium">${Number(order.total_amount || 0).toFixed(2)}</span>
 </TableCell>
 <TableCell>{getPaymentStatusBadge(order.production_invoices)}</TableCell>
 <TableCell>{getStatusBadge(order.status)}</TableCell>
 <TableCell>
 {order.created_at ? new Date(order.created_at).toLocaleDateString() : "—"}
 </TableCell>
 </ExpandableTableRowWithTrigger>
 );
 })
 )}
 </TableBody>
 </Table>
 </div>
 </div>
 );
}
