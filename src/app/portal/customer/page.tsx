'use client';

import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import {
  Package,
  DollarSign,
  Truck,
  FileText,
  Calendar,
  Clock,
  ShoppingCart,
  CreditCard,
  Upload,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

/**
 * Customer Portal Dashboard
 * Main landing page for customer portal showing overview of orders, payments, shipments
 * Follows established portal pattern from designer/factory dashboards
 */
export default function CustomerPortalPage() {
  const router = useRouter();
  const utils = api.useUtils();

  // Use portal router procedures
  const { data: _userInfo, error: userError } = api.portal.getCurrentUser.useQuery();
  const { data: stats, isLoading: _statsLoading, error: statsError } = api.portal.getDashboardStats.useQuery();
  const { data: ordersData, isLoading: ordersLoading, error: ordersError } = api.portal.getCustomerOrders.useQuery({
    status: 'all',
    limit: 5,
    offset: 0,
  });

  const orders = ordersData?.orders || [];

  // Stats from portal router (show 0 while loading)
  const activeOrders = stats?.activeOrders || 0;
  const pendingPayments = stats?.pendingPayments || 0;
  const recentShipments = stats?.recentShipments || 0;
  const documentsCount = stats?.documentsCount || 0;

  const getStatusBadge = (status: string) => {
    const statusLabels: Record<string, string> = {
      pending: 'Pending',
      pending_deposit: 'Awaiting Deposit',
      in_production: 'In Production',
      ready_to_ship: 'Ready to Ship',
      shipped: 'Shipped',
      delivered: 'Delivered',
    };
    return <Badge variant="outline">{statusLabels[status as keyof typeof statusLabels] || status}</Badge>;
  };

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

  // Handle query errors
  if (userError || statsError || ordersError) {
    const error = userError || statsError || ordersError;
    return (
      <div className="page-container">
        <PageHeader
          title="Customer Portal"
          subtitle="Track your orders, manage payments, and view shipment status"
        />
        <EmptyState
          icon={AlertTriangle}
          title="Failed to load dashboard data"
          description={error?.message || "An unexpected error occurred. Please try again."}
          action={{
            label: 'Try Again',
            onClick: () => {
              utils.portal.getCurrentUser.invalidate();
              utils.portal.getDashboardStats.invalidate();
              utils.portal.getCustomerOrders.invalidate();
            },
            icon: RefreshCw,
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Welcome back</h1>
        <p className="page-subtitle">Track your orders, manage payments, and view shipment status</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeOrders}</div>
            <p className="text-xs text-muted-foreground">Currently in production</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingPayments}</div>
            <p className="text-xs text-muted-foreground">Invoices awaiting payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Shipments</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentShipments}</div>
            <p className="text-xs text-muted-foreground">Shipped in last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documentsCount}</div>
            <p className="text-xs text-muted-foreground">Available to view</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Recent Orders
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/portal/customer/orders')}
            >
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
              <p className="text-muted-foreground">No orders yet</p>
              <p className="text-sm text-muted-foreground mt-1">Contact us to place your first order</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order: any) => (
                <div
                  key={order.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/portal/customer/orders/${order.id}`)}
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
                    {order.estimated_delivery_date && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Est. Delivery: {formatDate(order.estimated_delivery_date)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => router.push('/portal/customer/orders')}
            >
              <ShoppingCart className="h-6 w-6" />
              <span>View Orders</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => router.push('/portal/customer/financials')}
            >
              <CreditCard className="h-6 w-6" />
              <span>Make Payment</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => router.push('/portal/customer/documents')}
            >
              <Upload className="h-6 w-6" />
              <span>Upload Documents</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => router.push('/portal/customer/shipping')}
            >
              <Truck className="h-6 w-6" />
              <span>Track Shipments</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
