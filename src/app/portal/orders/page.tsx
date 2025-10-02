"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
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
 Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";

// Dynamic route configuration
export const dynamic = 'force-dynamic';

const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
 awaiting_deposit: {
 label: "Awaiting Deposit",
 className: "bg-yellow-100 text-yellow-800 border-yellow-300",
 icon: <Clock className="w-3 h-3" aria-hidden="true" />,
 },
 deposit_paid: {
 label: "Deposit Paid",
 className: "bg-blue-100 text-blue-800 border-blue-300",
 icon: <DollarSign className="w-3 h-3" aria-hidden="true" />,
 },
 in_progress: {
 label: "In Production",
 className: "bg-blue-100 text-blue-800 border-blue-300",
 icon: <Package className="w-3 h-3" aria-hidden="true" />,
 },
 completed: {
 label: "Completed",
 className: "bg-green-100 text-green-800 border-green-300",
 icon: <CheckCircle2 className="w-3 h-3" aria-hidden="true" />,
 },
 awaiting_final_payment: {
 label: "Awaiting Final Payment",
 className: "bg-yellow-100 text-yellow-800 border-yellow-300",
 icon: <Clock className="w-3 h-3" aria-hidden="true" />,
 },
 final_paid: {
 label: "Final Payment Received",
 className: "bg-green-100 text-green-800 border-green-300",
 icon: <DollarSign className="w-3 h-3" aria-hidden="true" />,
 },
 shipped: {
 label: "Shipped",
 className: "bg-purple-100 text-purple-800 border-purple-300",
 icon: <Truck className="w-3 h-3" aria-hidden="true" />,
 },
 delivered: {
 label: "Delivered",
 className: "bg-green-100 text-green-800 border-green-300",
 icon: <CheckCircle2 className="w-3 h-3" aria-hidden="true" />,
 },
};

export default function CustomerOrdersPage() {
 const router = useRouter();
 const [statusFilter, setStatusFilter] = useState<string>("all");
 const [searchQuery, setSearchQuery] = useState("");

 // Fetch customer orders
 const { data, isLoading } = api.portal.getCustomerOrders.useQuery({
 status: statusFilter === "all" ? undefined : statusFilter as any,
 limit: 50,
 offset: 0,
 });

 const orders = data?.orders || [];

 // Client-side search filtering
 const filteredOrders = orders.filter((order) => {
 if (!searchQuery) return true;
 const searchLower = searchQuery.toLowerCase();
 return (
 order.order_number.toLowerCase().includes(searchLower) ||
 order.item_name.toLowerCase().includes(searchLower) ||
 order.projects?.name?.toLowerCase().includes(searchLower)
 );
 });

 // Calculate statistics
 const stats = {
 total: orders.length,
 awaitingDeposit: orders.filter((o) => o.status === "awaiting_deposit").length,
 inProduction: orders.filter((o) => o.status === "in_progress").length,
 shipped: orders.filter((o) => o.status === "shipped").length,
 delivered: orders.filter((o) => o.status === "delivered").length,
 };

 return (
 <div className="container mx-auto p-6 space-y-6">
 {/* Header */}
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-3xl font-bold">My Orders</h1>
 <p className="text-muted-foreground">Track your production orders and shipments</p>
 </div>
 </div>

 {/* Statistics Cards */}
 <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
 <Card>
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
 <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
 <Package className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold">{stats.total}</div>
 </CardContent>
 </Card>

 <Card>
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
 <CardTitle className="text-sm font-medium">Awaiting Deposit</CardTitle>
 <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold text-yellow-600">{stats.awaitingDeposit}</div>
 </CardContent>
 </Card>

 <Card>
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
 <CardTitle className="text-sm font-medium">In Production</CardTitle>
 <Package className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold text-blue-600">{stats.inProduction}</div>
 </CardContent>
 </Card>

 <Card>
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
 <CardTitle className="text-sm font-medium">Shipped</CardTitle>
 <Truck className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold text-purple-600">{stats.shipped}</div>
 </CardContent>
 </Card>

 <Card>
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
 <CardTitle className="text-sm font-medium">Delivered</CardTitle>
 <CheckCircle2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
 </CardContent>
 </Card>
 </div>

 {/* Filters */}
 <Card>
 <CardHeader>
 <CardTitle>Filter Orders</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="flex flex-col md:flex-row gap-4">
 {/* Search */}
 <div className="flex-1">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" aria-hidden="true" />
 <Input
 placeholder="Search order number, item name, or project..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="pl-10"
 />
 </div>
 </div>

 {/* Status Filter */}
 <div className="w-full md:w-[250px]">
 <Select value={statusFilter} onValueChange={setStatusFilter}>
 <SelectTrigger>
 <SelectValue placeholder="Filter by status" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">All Statuses</SelectItem>
 <SelectItem value="awaiting_deposit">Awaiting Deposit</SelectItem>
 <SelectItem value="deposit_paid">Deposit Paid</SelectItem>
 <SelectItem value="in_progress">In Production</SelectItem>
 <SelectItem value="completed">Completed</SelectItem>
 <SelectItem value="awaiting_final_payment">Awaiting Final Payment</SelectItem>
 <SelectItem value="final_paid">Final Payment Received</SelectItem>
 <SelectItem value="shipped">Shipped</SelectItem>
 <SelectItem value="delivered">Delivered</SelectItem>
 </SelectContent>
 </Select>
 </div>
 </div>
 </CardContent>
 </Card>

 {/* Orders Table */}
 <Card>
 <CardHeader>
 <CardTitle>Production Orders</CardTitle>
 </CardHeader>
 <CardContent>
 {isLoading ? (
 <div className="text-center py-8 text-muted-foreground">Loading orders...</div>
 ) : filteredOrders.length === 0 ? (
 <div className="text-center py-12 text-muted-foreground">
 <Package className="w-12 h-12 mx-auto mb-2 opacity-50" aria-hidden="true" />
 <p>No orders found</p>
 {searchQuery && <p className="text-sm mt-2">Try adjusting your search</p>}
 </div>
 ) : (
 <div className="overflow-x-auto">
 <Table>
 <TableHeader>
 <TableRow>
 <TableHead>Order Number</TableHead>
 <TableHead>Project</TableHead>
 <TableHead>Item</TableHead>
 <TableHead>Quantity</TableHead>
 <TableHead>Status</TableHead>
 <TableHead>Payment Status</TableHead>
 <TableHead>Total</TableHead>
 <TableHead>Est. Ship Date</TableHead>
 <TableHead>Actions</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {filteredOrders.map((order) => {
 const config = statusConfig[order.status] || statusConfig.awaiting_deposit;
 const depositInvoice = order.production_invoices?.find((inv) => inv.invoice_type === 'deposit');
 const finalInvoice = order.production_invoices?.find((inv) => inv.invoice_type === 'final');

 return (
 <TableRow
 key={order.id}
 className="cursor-pointer hover:bg-muted/50"
 onClick={() => router.push(`/portal/orders/${order.id}`)}
 >
 <TableCell>
 <span className="font-mono font-medium">{order.order_number}</span>
 </TableCell>
 <TableCell>
 <span className="text-sm">{order.projects?.name || "—"}</span>
 </TableCell>
 <TableCell>
 <div>
 <p className="font-medium">{order.item_name}</p>
 {order.item_description && (
 <p className="text-xs text-muted-foreground">{order.item_description}</p>
 )}
 </div>
 </TableCell>
 <TableCell>
 <span className="font-medium">{order.quantity}</span>
 </TableCell>
 <TableCell>
 <Badge variant="outline" className={cn(config.className, "flex items-center gap-1 w-fit")}>
 {config.icon}
 {config.label}
 </Badge>
 </TableCell>
 <TableCell>
 <div className="space-y-1">
 {depositInvoice && (
 <Badge
 variant="outline"
 className={cn(
 "text-xs",
 depositInvoice.status === "paid"
 ? "bg-green-100 text-green-800 border-green-300"
 : "bg-yellow-100 text-yellow-800 border-yellow-300"
 )}
 >
 Deposit: {depositInvoice.status === "paid" ? "Paid" : "Pending"}
 </Badge>
 )}
 {finalInvoice && (
 <Badge
 variant="outline"
 className={cn(
 "text-xs",
 finalInvoice.status === "paid"
 ? "bg-green-100 text-green-800 border-green-300"
 : "bg-yellow-100 text-yellow-800 border-yellow-300"
 )}
 >
 Final: {finalInvoice.status === "paid" ? "Paid" : "Pending"}
 </Badge>
 )}
 </div>
 </TableCell>
 <TableCell>
 <span className="font-semibold">${Number(order.total_cost).toLocaleString()}</span>
 </TableCell>
 <TableCell>
 {order.estimated_ship_date ? (
 <span className="text-sm">
 {format(new Date(order.estimated_ship_date), "MMM d, yyyy")}
 </span>
 ) : (
 <span className="text-sm text-muted-foreground">—</span>
 )}
 </TableCell>
 <TableCell>
 <Button
 variant="outline"
 size="sm"
 onClick={(e) => {
 e.stopPropagation();
 router.push(`/portal/orders/${order.id}`);
 }}
 >
 View Details
 </Button>
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
