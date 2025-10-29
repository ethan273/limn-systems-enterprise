"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Package, DollarSign, Calendar, User } from "lucide-react";
import Link from "next/link";

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  // Fetch order details using the tRPC query
  const { data: order, isLoading, error } = api.orders.getFullDetails.useQuery(
    { orderId },
    { enabled: !!orderId }
  );

  // Handle error state
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Order Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive mb-4">
              {error.message || "Unable to load order details"}
            </p>
            <Button onClick={() => router.push("/crm/orders")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3">Loading order details...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Order Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">The requested order could not be found.</p>
            <Button onClick={() => router.push("/crm/orders")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any; className: string }> = {
      draft: { label: "Draft", variant: "outline", className: "badge-neutral" },
      pending: { label: "Pending", variant: "outline", className: "bg-warning-muted text-warning border-warning" },
      confirmed: { label: "Confirmed", variant: "outline", className: "btn-primary text-info border-primary" },
      in_production: { label: "In Production", variant: "outline", className: "btn-secondary text-secondary border-secondary" },
      completed: { label: "Completed", variant: "outline", className: "bg-success text-success border-success" },
      cancelled: { label: "Cancelled", variant: "outline", className: "bg-destructive text-destructive border-destructive" },
    };

    const info = statusMap[status] || { label: status, variant: "outline", className: "badge-neutral" };
    return (
      <Badge variant={info.variant as any} className={info.className}>
        {info.label}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/crm/orders")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Orders
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Order {order.order_number}</h1>
            <p className="text-muted-foreground">
              {order.customers?.name || "Unknown Customer"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(order.status)}
            <Link href={`/crm/orders/${orderId}/edit`}>
              <Button variant="outline">Edit Order</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Order Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Order Date
                </p>
                <p className="font-medium">
                  {order.created_at ? new Date(order.created_at).toLocaleDateString() : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  <User className="h-4 w-4 inline mr-1" />
                  Customer
                </p>
                <p className="font-medium">{order.customers?.name || "Unknown"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  <Package className="h-4 w-4 inline mr-1" />
                  Project
                </p>
                <p className="font-medium">{order.projects?.name || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  <DollarSign className="h-4 w-4 inline mr-1" />
                  Total Amount
                </p>
                <p className="font-medium text-lg">
                  ${order.total_amount ? Number(order.total_amount).toFixed(2) : "0.00"}
                </p>
              </div>
            </div>

            {order.notes && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-1">Notes</p>
                <p className="text-sm">{order.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href={`/crm/orders/${orderId}/edit`} className="w-full">
              <Button variant="outline" className="w-full">
                Edit Order
              </Button>
            </Link>
            {order.projects?.id && (
              <Link href={`/crm/projects/${order.projects.id}`} className="w-full">
                <Button variant="outline" className="w-full">
                  View Project
                </Button>
              </Link>
            )}
            {order.customers?.id && (
              <Link href={`/crm/customers/${order.customers.id}`} className="w-full">
                <Button variant="outline" className="w-full">
                  View Customer
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Items */}
      {order.order_items && order.order_items.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Order Items ({order.order_items.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.order_items.map((item: any) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{item.product_name || "Unnamed Item"}</h4>
                      {item.product_sku && (
                        <p className="text-sm text-muted-foreground">SKU: {item.product_sku}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        ${item.unit_price ? Number(item.unit_price).toFixed(2) : "0.00"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Qty: {item.quantity || 0}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoices */}
      {order.invoices && order.invoices.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Invoices ({order.invoices.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {order.invoices.map((invoice: any) => (
                <div key={invoice.id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{invoice.invoice_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {invoice.created_at ? new Date(invoice.created_at).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      ${invoice.total_amount ? Number(invoice.total_amount).toFixed(2) : "0.00"}
                    </p>
                    <Badge variant="outline">{invoice.status || "pending"}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
