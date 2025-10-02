"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Search, Package, DollarSign, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

export default function ProductionOrdersPage() {
 const [statusFilter, setStatusFilter] = useState<string>("all");
 const [searchQuery, setSearchQuery] = useState("");
 const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
 const { user, loading: authLoading } = useAuth();
 const router = useRouter();

 // Redirect to login if not authenticated
 useEffect(() => {
 if (!authLoading && !user) {
 router.push("/login");
 }
 }, [authLoading, user, router]);

 // Query PRODUCTION ORDERS (Phase 1 system with invoices/payments)
 const { data, isLoading } = api.productionOrders.getAll.useQuery(
 {},
 { enabled: !authLoading && !!user }
 );

 // Filter by status and search query (client-side)
 const filteredOrders = data?.items.filter((order: any) => {
 // Status filter
 if (statusFilter !== "all" && order.status !== statusFilter) {
 return false;
 }
 // Search filter
 if (!searchQuery) return true;
 const query = searchQuery.toLowerCase();
 return (
 order.order_number.toLowerCase().includes(query) ||
 order.item_name.toLowerCase().includes(query) ||
 order.projects?.name?.toLowerCase().includes(query)
 );
 });

 const toggleOrderExpansion = (orderId: string) => {
 setExpandedOrders(prev => {
 const newSet = new Set(prev);
 if (newSet.has(orderId)) {
 newSet.delete(orderId);
 } else {
 newSet.add(orderId);
 }
 return newSet;
 });
 };

 const getStatusBadge = (status: string) => {
 // Define status info with explicit switch for security
 let info: { label: string; variant: string; className: string };
 switch (status) {
 case 'awaiting_deposit':
 info = { label: "Awaiting Deposit", variant: "outline", className: "bg-yellow-100 text-yellow-800 border-yellow-300" };
 break;
 case 'in_progress':
 info = { label: "In Progress", variant: "outline", className: "bg-blue-100 text-blue-800 border-blue-300" };
 break;
 case 'completed':
 info = { label: "Completed", variant: "outline", className: "bg-purple-100 text-purple-800 border-purple-300" };
 break;
 case 'awaiting_final_payment':
 info = { label: "Awaiting Final Payment", variant: "outline", className: "bg-orange-100 text-orange-800 border-orange-300" };
 break;
 case 'final_paid':
 info = { label: "Ready to Ship", variant: "outline", className: "bg-green-100 text-green-800 border-green-300" };
 break;
 case 'shipped':
 info = { label: "Shipped", variant: "outline", className: "bg-teal-100 text-teal-800 border-teal-300" };
 break;
 case 'delivered':
 info = { label: "Delivered", variant: "outline", className: "bg-emerald-100 text-emerald-800 border-emerald-300" };
 break;
 default:
 info = { label: "Unknown", variant: "outline", className: "badge-neutral" };
 }
 return <Badge variant={info.variant as any} className={info.className}>{info.label}</Badge>;
 };

 const getPaymentStatusBadge = (depositPaid: boolean, finalPaymentPaid: boolean) => {
 if (!depositPaid) {
 return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">No Deposit</Badge>;
 }
 if (depositPaid && !finalPaymentPaid) {
 return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Deposit Paid</Badge>;
 }
 return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Fully Paid</Badge>;
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

 return (
 <div className="container mx-auto py-6 space-y-6">
 {/* Header */}
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-3xl font-bold">Production Orders</h1>
 <p className="text-muted-foreground">
 View production orders with auto-generated invoices and payment tracking. To create orders, go to{" "}
 <Link href="/crm/projects" className="text-blue-600 hover:underline font-medium">
 CRM → Projects
 </Link>
 </p>
 </div>
 </div>

 {/* Filters */}
 <div className="flex gap-4 filters-section">
 <div className="flex-1">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
 <Input
 placeholder="Search by order number, item name, or project..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="pl-10 w-full"
 />
 </div>
 </div>
 <Select value={statusFilter} onValueChange={setStatusFilter}>
 <SelectTrigger className="w-[200px]">
 <SelectValue placeholder="Filter by status" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">All Statuses</SelectItem>
 <SelectItem value="awaiting_deposit">Awaiting Deposit</SelectItem>
 <SelectItem value="in_progress">In Progress</SelectItem>
 <SelectItem value="completed">Completed</SelectItem>
 <SelectItem value="awaiting_final_payment">Awaiting Final Payment</SelectItem>
 <SelectItem value="final_paid">Ready to Ship</SelectItem>
 <SelectItem value="shipped">Shipped</SelectItem>
 <SelectItem value="delivered">Delivered</SelectItem>
 </SelectContent>
 </Select>
 </div>

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
 ${filteredOrders?.reduce((sum: number, order: any) => sum + Number(order.total_cost || 0), 0).toFixed(2)}
 </div>
 </div>
 <div className="p-4 border rounded-lg bg-card">
 <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
 <Package className="h-4 w-4" />
 <span>In Production</span>
 </div>
 <div className="text-2xl font-bold">
 {filteredOrders?.filter((order: any) => order.status === 'in_progress').length || 0}
 </div>
 </div>
 <div className="p-4 border rounded-lg bg-card">
 <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
 <AlertCircle className="h-4 w-4" />
 <span>Awaiting Payment</span>
 </div>
 <div className="text-2xl font-bold">
 {filteredOrders?.filter((order: any) => order.status === 'awaiting_deposit' || order.status === 'awaiting_final_payment').length || 0}
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
 <TableHead>Item</TableHead>
 <TableHead>Project</TableHead>
 <TableHead>Quantity</TableHead>
 <TableHead>Total Cost</TableHead>
 <TableHead>Payment Status</TableHead>
 <TableHead>Status</TableHead>
 <TableHead>Order Date</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {isLoading ? (
 <TableRow>
 <TableCell colSpan={9} className="text-center py-8">Loading production orders...</TableCell>
 </TableRow>
 ) : filteredOrders?.length === 0 ? (
 <TableRow>
 <TableCell colSpan={9} className="text-center py-8">
 <div className="space-y-2">
 <p className="text-muted-foreground">No production orders found</p>
 <p className="text-sm text-muted-foreground">
 Create orders from{" "}
 <Link href="/crm/projects" className="text-blue-600 hover:underline">
 Projects
 </Link>
 </p>
 </div>
 </TableCell>
 </TableRow>
 ) : (
 filteredOrders?.map((order: any) => {
 const isExpanded = expandedOrders.has(order.id);

 return (
 <Collapsible key={order.id} open={isExpanded} onOpenChange={() => toggleOrderExpansion(order.id)} asChild>
 <>
 <TableRow className="cursor-pointer hover:bg-muted/50">
 <TableCell>
 <CollapsibleTrigger asChild>
 <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
 {isExpanded ? (
 <ChevronDown className="h-4 w-4" />
 ) : (
 <ChevronRight className="h-4 w-4" />
 )}
 </Button>
 </CollapsibleTrigger>
 </TableCell>
 <TableCell>
 <Link href={`/production/orders/${order.id}`} className="font-medium text-blue-600 hover:underline">
 {order.order_number}
 </Link>
 </TableCell>
 <TableCell>{order.item_name}</TableCell>
 <TableCell>{order.projects?.name || "—"}</TableCell>
 <TableCell>{order.quantity}</TableCell>
 <TableCell>
 <span className="font-medium">${Number(order.total_cost || 0).toFixed(2)}</span>
 </TableCell>
 <TableCell>{getPaymentStatusBadge(order.deposit_paid, order.final_payment_paid)}</TableCell>
 <TableCell>{getStatusBadge(order.status)}</TableCell>
 <TableCell>
 {order.order_date ? new Date(order.order_date).toLocaleDateString() : "—"}
 </TableCell>
 </TableRow>

 {/* Expanded Content - Order Details */}
 <TableRow>
 <TableCell colSpan={9} className="p-0">
 <CollapsibleContent>
 <div className="px-6 py-4 bg-muted/20 border-t">
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 {/* Order Details */}
 <div className="space-y-2">
 <h4 className="font-medium text-sm">Order Details</h4>
 <div className="text-sm space-y-1">
 <div>
 <span className="text-muted-foreground">Type:</span>
 <Badge variant="outline" className="ml-2 capitalize">{order.product_type}</Badge>
 </div>
 <div>
 <span className="text-muted-foreground">Unit Price:</span>
 <span className="ml-2 font-medium">${Number(order.unit_price).toFixed(2)}</span>
 </div>
 {order.item_description && (
 <div>
 <span className="text-muted-foreground">Description:</span>
 <p className="text-sm mt-1">{order.item_description}</p>
 </div>
 )}
 </div>
 </div>

 {/* Payment Info */}
 <div className="space-y-2">
 <h4 className="font-medium text-sm">Payment Status</h4>
 <div className="text-sm space-y-1">
 <div>
 <span className="text-muted-foreground">Deposit (50%):</span>
 <Badge variant="outline" className={`ml-2 ${order.deposit_paid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
 {order.deposit_paid ? 'Paid' : 'Pending'}
 </Badge>
 </div>
 <div>
 <span className="text-muted-foreground">Final Payment (50%):</span>
 <Badge variant="outline" className={`ml-2 ${order.final_payment_paid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
 {order.final_payment_paid ? 'Paid' : 'Pending'}
 </Badge>
 </div>
 </div>
 </div>

 {/* Shipping Info */}
 <div className="space-y-2">
 <h4 className="font-medium text-sm">Shipping</h4>
 <div className="text-sm space-y-1">
 <div>
 <span className="text-muted-foreground">Estimated Ship:</span>
 <span className="ml-2">{order.estimated_ship_date ? new Date(order.estimated_ship_date).toLocaleDateString() : '—'}</span>
 </div>
 {order.actual_ship_date && (
 <div>
 <span className="text-muted-foreground">Actual Ship:</span>
 <span className="ml-2">{new Date(order.actual_ship_date).toLocaleDateString()}</span>
 </div>
 )}
 {order.manufacturers && (
 <div>
 <span className="text-muted-foreground">Factory:</span>
 <span className="ml-2">{order.manufacturers.name}</span>
 </div>
 )}
 </div>
 </div>
 </div>

 {/* Action Button */}
 <div className="mt-4 pt-4 border-t">
 <Link href={`/production/orders/${order.id}`}>
 <Button variant="outline" size="sm">
 View Full Details →
 </Button>
 </Link>
 </div>
 </div>
 </CollapsibleContent>
 </TableCell>
 </TableRow>
 </>
 </Collapsible>
 );
 })
 )}
 </TableBody>
 </Table>
 </div>
 </div>
 );
}
