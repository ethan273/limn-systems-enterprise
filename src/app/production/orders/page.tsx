"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Search, Package, DollarSign, Calendar } from "lucide-react";
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

  const { data, isLoading } = api.orders.getAll.useQuery(
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
      order.customers?.name?.toLowerCase().includes(query) ||
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
      case 'draft':
        info = { label: "Draft", variant: "outline", className: "bg-gray-100 text-gray-800 border-gray-300" };
        break;
      case 'pending':
        info = { label: "Pending", variant: "outline", className: "bg-yellow-100 text-yellow-800 border-yellow-300" };
        break;
      case 'confirmed':
        info = { label: "Confirmed", variant: "outline", className: "bg-blue-100 text-blue-800 border-blue-300" };
        break;
      case 'in_production':
        info = { label: "In Production", variant: "outline", className: "bg-purple-100 text-purple-800 border-purple-300" };
        break;
      case 'quality_check':
        info = { label: "Quality Check", variant: "outline", className: "bg-indigo-100 text-indigo-800 border-indigo-300" };
        break;
      case 'ready_to_ship':
        info = { label: "Ready to Ship", variant: "outline", className: "bg-green-100 text-green-800 border-green-300" };
        break;
      case 'shipped':
        info = { label: "Shipped", variant: "outline", className: "bg-teal-100 text-teal-800 border-teal-300" };
        break;
      case 'delivered':
        info = { label: "Delivered", variant: "outline", className: "bg-emerald-100 text-emerald-800 border-emerald-300" };
        break;
      case 'completed':
        info = { label: "Completed", variant: "outline", className: "bg-green-200 text-green-900 border-green-400" };
        break;
      case 'cancelled':
        info = { label: "Cancelled", variant: "outline", className: "bg-red-100 text-red-800 border-red-300" };
        break;
      default:
        info = { label: "Draft", variant: "outline", className: "bg-gray-100 text-gray-800 border-gray-300" };
    }
    return <Badge variant={info.variant as any} className={info.className}>{info.label}</Badge>;
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
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Production Orders</h1>
          <p className="text-muted-foreground">
            View orders created from Projects. To create new orders, go to{" "}
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
              placeholder="Search by order number, customer, or project..."
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
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="in_production">In Production</SelectItem>
            <SelectItem value="quality_check">Quality Check</SelectItem>
            <SelectItem value="ready_to_ship">Ready to Ship</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
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
            ${filteredOrders?.reduce((sum: number, order: any) => sum + Number(order.total_amount || 0), 0).toFixed(2)}
          </div>
        </div>
        <div className="p-4 border rounded-lg bg-card">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Package className="h-4 w-4" />
            <span>In Production</span>
          </div>
          <div className="text-2xl font-bold">
            {filteredOrders?.filter((order: any) => order.status === 'in_production').length || 0}
          </div>
        </div>
        <div className="p-4 border rounded-lg bg-card">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Calendar className="h-4 w-4" />
            <span>Completed</span>
          </div>
          <div className="text-2xl font-bold">
            {filteredOrders?.filter((order: any) => order.status === 'completed').length || 0}
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
              <TableHead>Status</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Order Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">Loading orders...</TableCell>
              </TableRow>
            ) : filteredOrders?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="space-y-2">
                    <p className="text-muted-foreground">No orders found</p>
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
                const orderItems = order.order_items || [];

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
                          <span className="font-medium text-blue-600">{order.order_number}</span>
                        </TableCell>
                        <TableCell>{order.customers?.name || "—"}</TableCell>
                        <TableCell>{order.projects?.name || "—"}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell>
                          <span className="font-medium">${Number(order.total_amount || 0).toFixed(2)}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{orderItems.length} items</Badge>
                        </TableCell>
                        <TableCell>
                          {order.created_at ? new Date(order.created_at).toLocaleDateString() : "—"}
                        </TableCell>
                      </TableRow>

                      {/* Expanded Content - Order Items */}
                      <TableRow>
                        <TableCell colSpan={8} className="p-0">
                          <CollapsibleContent>
                            <div className="px-6 py-4 bg-muted/20 border-t">
                              <h4 className="font-medium mb-3">Order Items</h4>
                              {orderItems.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No items in this order</p>
                              ) : (
                                <div className="space-y-3">
                                  {orderItems.map((item: any, index: number) => (
                                    <div key={item.id} className="border rounded-lg p-4 bg-card">
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1 space-y-2">
                                          <div className="flex items-center gap-3">
                                            <Badge variant="outline" className="font-mono text-xs">
                                              Item #{index + 1}
                                            </Badge>
                                            <span className="font-medium">{item.description || item.items?.name || "Unnamed Item"}</span>
                                          </div>

                                          {/* Item Details Grid */}
                                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div>
                                              <span className="text-muted-foreground">Quantity:</span>
                                              <span className="ml-2 font-medium">{item.quantity}</span>
                                            </div>
                                            <div>
                                              <span className="text-muted-foreground">Unit Price:</span>
                                              <span className="ml-2 font-medium">${Number(item.unit_price || 0).toFixed(2)}</span>
                                            </div>
                                            <div>
                                              <span className="text-muted-foreground">Total:</span>
                                              <span className="ml-2 font-medium">
                                                ${(Number(item.quantity || 0) * Number(item.unit_price || 0)).toFixed(2)}
                                              </span>
                                            </div>
                                            {item.project_sku && (
                                              <div>
                                                <span className="text-muted-foreground">Project SKU:</span>
                                                <span className="ml-2 font-mono text-xs">{item.project_sku}</span>
                                              </div>
                                            )}
                                          </div>

                                          {/* Item Catalog Reference */}
                                          {item.items && (
                                            <div className="text-sm">
                                              <span className="text-muted-foreground">Catalog Item:</span>
                                              <span className="ml-2">{item.items.name}</span>
                                              {item.items.sku_full && (
                                                <Badge variant="outline" className="ml-2 font-mono text-xs">
                                                  {item.items.sku_full}
                                                </Badge>
                                              )}
                                            </div>
                                          )}

                                          {/* Specifications */}
                                          {item.specifications && (
                                            <div className="text-sm">
                                              <span className="text-muted-foreground">Specifications:</span>
                                              <div className="mt-1 p-2 bg-muted/50 rounded text-xs">
                                                {typeof item.specifications === 'object' ? (
                                                  <pre className="whitespace-pre-wrap">
                                                    {JSON.stringify(item.specifications, null, 2)}
                                                  </pre>
                                                ) : (
                                                  <span>{String(item.specifications)}</span>
                                                )}
                                              </div>
                                            </div>
                                          )}

                                          {/* Item Status */}
                                          {item.status && (
                                            <div className="text-sm">
                                              <span className="text-muted-foreground">Item Status:</span>
                                              <Badge variant="outline" className="ml-2">{item.status}</Badge>
                                            </div>
                                          )}

                                          {/* Notes */}
                                          {item.notes && (
                                            <div className="text-sm">
                                              <span className="text-muted-foreground">Notes:</span>
                                              <p className="mt-1 text-muted-foreground">{item.notes}</p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Order Notes */}
                              {order.notes && (
                                <div className="mt-4 pt-4 border-t">
                                  <h5 className="font-medium text-sm mb-2">Order Notes</h5>
                                  <p className="text-sm text-muted-foreground">{order.notes}</p>
                                </div>
                              )}
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
