'use client';

import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/EmptyState';
import {
  Truck,
  Package,
  Calendar,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

/**
 * Factory Shipping Page
 * External portal for factories to manage shipments
 * Phase 3: Portal router integration
 */
export default function FactoryShippingPage() {
  const router = useRouter();
  const utils = api.useUtils();

  // Use portal router procedures
  const { data: _userInfo, error: userError } = api.portal.getCurrentUser.useQuery();
  const { data: ordersData, isLoading, error: ordersError } = api.portal.getFactoryOrders.useQuery({
    limit: 100,
    offset: 0,
  });

  // Handle query errors
  if (userError) {
    return (
      <div className="space-y-6">
        <div className="page-header">
          <h1 className="page-title">Shipping Management</h1>
          <p className="page-subtitle">Track and manage shipments for completed orders</p>
        </div>
        <EmptyState
          icon={AlertTriangle}
          title="Failed to load user information"
          description={userError.message || "An unexpected error occurred. Please try again."}
          action={{
            label: 'Try Again',
            onClick: () => utils.portal.getCurrentUser.invalidate(),
            icon: RefreshCw,
          }}
        />
      </div>
    );
  }

  if (ordersError) {
    return (
      <div className="space-y-6">
        <div className="page-header">
          <h1 className="page-title">Shipping Management</h1>
          <p className="page-subtitle">Track and manage shipments for completed orders</p>
        </div>
        <EmptyState
          icon={AlertTriangle}
          title="Failed to load orders"
          description={ordersError.message || "An unexpected error occurred. Please try again."}
          action={{
            label: 'Try Again',
            onClick: () => utils.portal.getFactoryOrders.invalidate(),
            icon: RefreshCw,
          }}
        />
      </div>
    );
  }

  const orders = ordersData?.orders || [];

  // Filter to only show orders ready to ship or shipped
  const shippableOrders = orders.filter((order: any) =>
    order.status === 'ready_to_ship' || order.status === 'shipped'
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    // Validate status to prevent object injection
    if (status === 'ready_to_ship') {
      return <Badge variant="outline">Ready to Ship</Badge>;
    }
    if (status === 'shipped') {
      return <Badge variant="outline">Shipped</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Shipping Management</h1>
        <p className="page-subtitle">Track and manage shipments for completed orders</p>
      </div>

      {/* Shipping Statistics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready to Ship</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.filter((o: any) => o.status === 'ready_to_ship').length}
            </div>
            <p className="text-xs text-muted-foreground">Orders awaiting shipment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shipped</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.filter((o: any) => o.status === 'shipped').length}
            </div>
            <p className="text-xs text-muted-foreground">Orders in transit</p>
          </CardContent>
        </Card>
      </div>

      {/* Shipments List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Shipments ({shippableOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading shipments...</div>
          ) : shippableOrders.length === 0 ? (
            <div className="text-center py-12">
              <Truck className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
              <p className="text-muted-foreground">No orders ready for shipment</p>
            </div>
          ) : (
            <div className="space-y-4">
              {shippableOrders.map((order: any) => (
                <div
                  key={order.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/portal/factory/orders/${order.id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold">{order.order_number}</h3>
                        {getStatusBadge(order.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">{order.item_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(Number(order.total_cost))}</p>
                      <p className="text-sm text-muted-foreground">Qty: {order.quantity}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Ordered: {formatDate(order.order_date)}</span>
                    </div>
                    {order.estimated_ship_date && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Truck className="h-4 w-4" />
                        <span>Ship by: {formatDate(order.estimated_ship_date)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
