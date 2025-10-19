'use client';

import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/EmptyState';
import {
  Package,
  Clock,
  CheckCircle,
  FileText,
  Calendar,
  Truck,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

/**
 * Factory Portal Dashboard
 * External portal for factory partners to view their orders and performance
 * Phase 3: Migrated to use portal router with enforcePortalAccessByType
 */
export default function FactoryPortalPage() {
  const router = useRouter();
  const utils = api.useUtils();

  // Use portal router procedures (enforces factory portal access)
  const { data: _userInfo, error: userError } = api.portal.getCurrentUser.useQuery();
  const { data: stats, isLoading: _statsLoading, error: statsError } = api.portal.getFactoryDashboardStats.useQuery();
  const { data: ordersData, isLoading: ordersLoading, error: ordersError } = api.portal.getFactoryOrders.useQuery({
    limit: 50,
    offset: 0,
  });

  // Handle query errors
  if (userError) {
    return (
      <div className="space-y-6">
        <div className="page-header">
          <h1 className="page-title">Factory Dashboard</h1>
          <p className="page-subtitle">Monitor production orders and manage your factory operations</p>
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

  if (statsError) {
    return (
      <div className="space-y-6">
        <div className="page-header">
          <h1 className="page-title">Factory Dashboard</h1>
          <p className="page-subtitle">Monitor production orders and manage your factory operations</p>
        </div>
        <EmptyState
          icon={AlertTriangle}
          title="Failed to load dashboard statistics"
          description={statsError.message || "An unexpected error occurred. Please try again."}
          action={{
            label: 'Try Again',
            onClick: () => utils.portal.getFactoryDashboardStats.invalidate(),
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
          <h1 className="page-title">Factory Dashboard</h1>
          <p className="page-subtitle">Monitor production orders and manage your factory operations</p>
        </div>
        <EmptyState
          icon={AlertTriangle}
          title="Failed to load production orders"
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

  // Stats from portal router (show 0 while loading)
  const activeOrders = stats?.activeOrders || 0;
  const pendingDeposit = stats?.pendingDeposit || 0;
  const inProduction = stats?.inProduction || 0;
  const readyToShip = stats?.readyToShip || 0;

  const getStatusBadge = (status: string) => {
    const statusLabels: Record<string, string> = {
      awaiting_deposit: 'Awaiting Deposit',
      deposit_paid: 'Ready to Start',
      in_progress: 'In Production',
      awaiting_final_payment: 'Awaiting Payment',
      ready_to_ship: 'Ready to Ship',
      shipped: 'Shipped',
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Factory Dashboard</h1>
        <p className="page-subtitle">Monitor production orders and manage your factory operations</p>
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
            <CardTitle className="text-sm font-medium">Pending Deposit</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingDeposit}</div>
            <p className="text-xs text-muted-foreground">Awaiting deposit payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Production</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProduction}</div>
            <p className="text-xs text-muted-foreground">Being manufactured</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready to Ship</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{readyToShip}</div>
            <p className="text-xs text-muted-foreground">Awaiting shipment</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Production Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
              <p className="text-muted-foreground">No production orders assigned yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order: any) => (
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
                        <Clock className="h-4 w-4" />
                        <span>Ship by: {formatDate(order.estimated_ship_date)}</span>
                      </div>
                    )}
                    {order.status === 'awaiting_deposit' && (
                      <div className="flex items-center gap-1 text-warning">
                        <AlertCircle className="h-4 w-4" />
                        <span>Waiting for customer deposit</span>
                      </div>
                    )}
                    {order.status === 'awaiting_final_payment' && (
                      <div className="flex items-center gap-1 text-warning">
                        <AlertCircle className="h-4 w-4" />
                        <span>Waiting for final payment before shipping</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => router.push('/portal/factory/documents')}
            >
              <FileText className="h-6 w-6" />
              <span>View Documents</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => router.push('/portal/factory/quality')}
            >
              <CheckCircle className="h-6 w-6" />
              <span>Quality Reports</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => router.push('/portal/factory/settings')}
            >
              <Package className="h-6 w-6" />
              <span>Factory Settings</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
