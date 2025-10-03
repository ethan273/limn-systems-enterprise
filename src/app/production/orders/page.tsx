"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Package, DollarSign, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

export default function ProductionOrdersPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
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

      {/* Orders Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
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
                <TableCell colSpan={8} className="text-center py-8">Loading production orders...</TableCell>
              </TableRow>
            ) : filteredOrders?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
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
              filteredOrders?.map((order: any) => (
                <TableRow
                  key={order.id}
                  className="cursor-pointer hover:bg-muted/50 data-table-row"
                  onClick={() => router.push(`/production/orders/${order.id}`)}
                >
                  <TableCell>
                    <span className="font-medium text-blue-600">
                      {order.order_number}
                    </span>
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
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
