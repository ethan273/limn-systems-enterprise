"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search } from "lucide-react";
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

  const { data, isLoading } = api.productionOrders.getAll.useQuery(
    {
      status: statusFilter === "all" ? undefined : statusFilter,
    },
    { enabled: !!user }
  );

  // Filter by search query (client-side)
  const filteredItems = data?.items.filter((order: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      order.order_number.toLowerCase().includes(query) ||
      order.item_name.toLowerCase().includes(query) ||
      order.projects?.name?.toLowerCase().includes(query)
    );
  });

  const getStatusBadge = (status: string, _depositPaid: boolean, _finalPaymentPaid: boolean) => {
    if (status === "awaiting_deposit") return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Awaiting Deposit</Badge>;
    if (status === "in_progress") return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">In Production</Badge>;
    if (status === "completed") return <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">Completed</Badge>;
    if (status === "awaiting_final_payment") return <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">Awaiting Final Payment</Badge>;
    if (status === "final_paid") return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Ready to Ship</Badge>;
    if (status === "shipped") return <Badge variant="outline" className="bg-green-200 text-green-900 border-green-400">Shipped</Badge>;
    return <Badge variant="outline">{status}</Badge>;
  };

  const getPaymentStatus = (depositPaid: boolean, finalPaymentPaid: boolean) => {
    if (!depositPaid) return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">No Deposit</Badge>;
    if (depositPaid && !finalPaymentPaid) return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Deposit Paid</Badge>;
    if (finalPaymentPaid) return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Fully Paid</Badge>;
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
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
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Production Orders</h1>
          <p className="text-muted-foreground">Manage all production orders and track progress</p>
        </div>
        <Link href="/production/orders/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Production Order
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6 filters-section">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by order number, project, or item name..."
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
            <SelectItem value="in_progress">In Production</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="awaiting_final_payment">Awaiting Final Payment</SelectItem>
            <SelectItem value="final_paid">Ready to Ship</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
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
              <TableHead>Factory</TableHead>
              <TableHead>Ship Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">Loading...</TableCell>
              </TableRow>
            ) : filteredItems?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">No production orders found</TableCell>
              </TableRow>
            ) : (
              filteredItems?.map((order: any) => (
                <TableRow key={order.id} className="hover:bg-muted/50 cursor-pointer">
                  <TableCell>
                    <Link href={`/production/orders/${order.id}`} className="font-medium text-blue-600 hover:underline">
                      {order.order_number}
                    </Link>
                  </TableCell>
                  <TableCell>{order.item_name}</TableCell>
                  <TableCell>{order.projects?.name ?? "—"}</TableCell>
                  <TableCell>{order.quantity}</TableCell>
                  <TableCell>${Number(order.total_cost).toFixed(2)}</TableCell>
                  <TableCell>{getPaymentStatus(order.deposit_paid, order.final_payment_paid)}</TableCell>
                  <TableCell>{getStatusBadge(order.status, order.deposit_paid, order.final_payment_paid)}</TableCell>
                  <TableCell>{order.manufacturers?.name ?? "Not Assigned"}</TableCell>
                  <TableCell>{order.estimated_ship_date ? new Date(order.estimated_ship_date).toLocaleDateString() : "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
