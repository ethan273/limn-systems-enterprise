'use client';

import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import {
  Package,
  Calendar,
  DollarSign,
  Truck,
  Clock,
  CheckCircle,
  ArrowLeft,
  AlertTriangle,
  RefreshCw,
  Factory,
  User,
} from 'lucide-react';

/**
 * Customer Portal Order Detail
 * Displays full order details including timeline, payments, shipping, documents
 */
export default function CustomerOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;
  const utils = api.useUtils();

  const { data: order, isLoading, error } = api.portal.getOrderById.useQuery(
    { orderId },
    { enabled: !!orderId }
  );

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Number(amount));
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
      pending: { label: 'Pending', variant: 'secondary' },
      pending_deposit: { label: 'Awaiting Deposit', variant: 'outline' },
      in_production: { label: 'In Production', variant: 'default' },
      ready_to_ship: { label: 'Ready to Ship', variant: 'default' },
      shipped: { label: 'Shipped', variant: 'default' },
      delivered: { label: 'Delivered', variant: 'default' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Handle query error
  if (error) {
    return (
      <div className="page-container">
        <PageHeader
          title="Order Details"
          subtitle="View order information"
        />
        <EmptyState
          icon={AlertTriangle}
          title="Failed to load order"
          description={error.message || "An unexpected error occurred. Please try again."}
          action={{
            label: 'Try Again',
            onClick: () => utils.portal.getOrderById.invalidate(),
            icon: RefreshCw,
          }}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="page-header">
          <h1 className="page-title">Loading Order...</h1>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-6">
        <EmptyState
          icon={Package}
          title="Order not found"
          description="This order does not exist or you don't have access to view it"
          action={{
            label: 'Back to Orders',
            onClick: () => router.push('/portal/customer/orders'),
            icon: ArrowLeft,
          }}
        />
      </div>
    );
  }

  // Calculate payment progress
  const totalCost = Number(order.total_cost || 0);
  const depositAmount = Number(order.deposit_amount || 0);
  const balanceAmount = Number(order.balance_amount || 0);
  const depositPaid = order.deposit_paid || false;
  const balancePaid = order.final_payment_paid || false;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center gap-4 mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/portal/customer/orders')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="page-title">{order.order_number}</h1>
            <p className="page-subtitle">{order.item_name}</p>
          </div>
          {getStatusBadge(order.status)}
        </div>
      </div>

      {/* Order Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quantity</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{order.quantity}</div>
            <p className="text-xs text-muted-foreground">Units ordered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCost)}</div>
            <p className="text-xs text-muted-foreground">Total order value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Order Date</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{formatDate(order.order_date)}</div>
            <p className="text-xs text-muted-foreground">Placed on</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Est. Delivery</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{formatDate(order.estimated_ship_date)}</div>
            <p className="text-xs text-muted-foreground">Expected arrival</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Order Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">Order Number:</div>
              <div className="font-medium">{order.order_number}</div>

              <div className="text-muted-foreground">Item:</div>
              <div className="font-medium">{order.item_name}</div>

              {order.projects && (
                <>
                  <div className="text-muted-foreground">Project:</div>
                  <div className="font-medium">{order.projects.name}</div>
                </>
              )}

              <div className="text-muted-foreground">Quantity:</div>
              <div className="font-medium">{order.quantity}</div>

              <div className="text-muted-foreground">Unit Price:</div>
              <div className="font-medium">{formatCurrency(Number(order.unit_price || 0))}</div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Payment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">Total Cost:</div>
              <div className="font-bold">{formatCurrency(totalCost)}</div>

              <div className="text-muted-foreground">Deposit ({depositPaid ? '✓' : '✗'}):</div>
              <div className={depositPaid ? 'text-success font-medium' : 'font-medium'}>
                {formatCurrency(depositAmount)}
                {depositPaid && <CheckCircle className="inline h-4 w-4 ml-1" />}
              </div>

              <div className="text-muted-foreground">Balance ({balancePaid ? '✓' : '✗'}):</div>
              <div className={balancePaid ? 'text-success font-medium' : 'font-medium'}>
                {formatCurrency(balanceAmount)}
                {balancePaid && <CheckCircle className="inline h-4 w-4 ml-1" />}
              </div>
            </div>

            {!depositPaid && (
              <Button
                className="w-full"
                onClick={() => router.push('/portal/customer/financials')}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Make Payment
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Production Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Production Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className={`rounded-full p-2 ${order.order_date ? 'bg-success/10' : 'bg-muted'}`}>
                <Calendar className={`h-4 w-4 ${order.order_date ? 'text-success' : 'text-muted-foreground'}`} />
              </div>
              <div className="flex-1">
                <p className="font-medium">Order Placed</p>
                <p className="text-sm text-muted-foreground">{formatDate(order.order_date)}</p>
              </div>
            </div>

            {order.production_start_date && (
              <div className="flex items-start gap-4">
                <div className="rounded-full p-2 bg-success/10">
                  <Factory className="h-4 w-4 text-success" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Production Started</p>
                  <p className="text-sm text-muted-foreground">{formatDate(order.production_start_date)}</p>
                </div>
              </div>
            )}

            {order.estimated_completion_date && (
              <div className="flex items-start gap-4">
                <div className={`rounded-full p-2 ${order.status === 'ready_to_ship' || order.status === 'shipped' || order.status === 'delivered' ? 'bg-success/10' : 'bg-muted'}`}>
                  <CheckCircle className={`h-4 w-4 ${order.status === 'ready_to_ship' || order.status === 'shipped' || order.status === 'delivered' ? 'text-success' : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Production Complete</p>
                  <p className="text-sm text-muted-foreground">{formatDate(order.estimated_completion_date)}</p>
                </div>
              </div>
            )}

            {order.shipped_date && (
              <div className="flex items-start gap-4">
                <div className="rounded-full p-2 bg-success/10">
                  <Truck className="h-4 w-4 text-success" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Shipped</p>
                  <p className="text-sm text-muted-foreground">{formatDate(order.shipped_date)}</p>
                </div>
              </div>
            )}

            {order.delivered_date && (
              <div className="flex items-start gap-4">
                <div className="rounded-full p-2 bg-success/10">
                  <CheckCircle className="h-4 w-4 text-success" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Delivered</p>
                  <p className="text-sm text-muted-foreground">{formatDate(order.delivered_date)}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Related Documents - Placeholder for future implementation */}

      {/* Contact Support */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Need Help?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Have questions about this order? Our team is here to help.
          </p>
          <Button variant="outline">
            Contact Support
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
