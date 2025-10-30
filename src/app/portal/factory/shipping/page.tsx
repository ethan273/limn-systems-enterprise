'use client';
import { log } from '@/lib/logger';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/common/EmptyState';
import {
  Truck,
  Package,
  Calendar,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  Send,
} from 'lucide-react';

/**
 * Factory Shipping Page
 * External portal for factories to manage shipments
 */
export default function FactoryShippingPage() {
  const router = useRouter();
  const utils = api.useUtils();

  const [shippingDialogOpen, setShippingDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [shippingForm, setShippingForm] = useState({
    trackingNumber: '',
    carrier: '',
    shippingDate: '',
    notes: '',
  });

  // Use portal router procedures
  const { data: _userInfo, error: userError } = api.portal.getCurrentUser.useQuery();
  const { data: ordersData, isLoading, error: ordersError } = api.portal.getFactoryOrders.useQuery({
    limit: 100,
    offset: 0,
  });

  const updateShippingMutation = api.portal.updateFactoryShipping.useMutation();

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
      return <Badge variant="default" className="flex items-center gap-1">
        <CheckCircle className="h-3 w-3" />
        Shipped
      </Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  const handleMarkAsShipped = (orderId: string) => {
    setSelectedOrderId(orderId);
    setShippingDialogOpen(true);
  };

  const handleSubmitShipping = async () => {
    if (!selectedOrderId) return;

    try {
      setSubmitting(true);

      await updateShippingMutation.mutateAsync({
        orderId: selectedOrderId,
        trackingNumber: shippingForm.trackingNumber || undefined,
        carrier: shippingForm.carrier || undefined,
        shippingDate: shippingForm.shippingDate ? new Date(shippingForm.shippingDate) : undefined,
        notes: shippingForm.notes || undefined,
        markAsShipped: true,
      });

      // Show success
      setSuccessMessage('Order marked as shipped successfully');
      setShippingDialogOpen(false);
      void utils.portal.getFactoryOrders.invalidate();

      // Reset form
      setTimeout(() => {
        setSuccessMessage(null);
        setSelectedOrderId(null);
        setShippingForm({
          trackingNumber: '',
          carrier: '',
          shippingDate: '',
          notes: '',
        });
      }, 3000);
    } catch (error) {
      log.error('Failed to update shipping:', { error });
      alert('Failed to update shipping information');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Shipping Management</h1>
        <p className="page-subtitle">Track and manage shipments for completed orders</p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="flex items-center gap-2 p-4 bg-success/10 text-success border border-success/20 rounded-lg">
          <CheckCircle className="h-5 w-5" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

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
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3
                          className="font-semibold cursor-pointer hover:underline"
                          onClick={() => router.push(`/portal/factory/orders/${order.id}`)}
                        >
                          {order.order_number}
                        </h3>
                        {getStatusBadge(order.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">{order.item_name}</p>
                      {order.tracking_number && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Tracking: {order.tracking_number}
                          {order.shipping_carrier && ` (${order.shipping_carrier})`}
                        </p>
                      )}
                    </div>
                    <div className="text-right flex flex-col gap-2">
                      <div>
                        <p className="font-semibold">{formatCurrency(Number(order.total_cost))}</p>
                        <p className="text-sm text-muted-foreground">Qty: {order.quantity}</p>
                      </div>
                      {order.status === 'ready_to_ship' && (
                        <Button
                          size="sm"
                          onClick={() => handleMarkAsShipped(order.id)}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Mark as Shipped
                        </Button>
                      )}
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
                    {order.actual_ship_date && (
                      <div className="flex items-center gap-1 text-success">
                        <CheckCircle className="h-4 w-4" />
                        <span>Shipped: {formatDate(order.actual_ship_date)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Shipping Dialog */}
      <Dialog open={shippingDialogOpen} onOpenChange={setShippingDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Mark Order as Shipped</DialogTitle>
            <DialogDescription>
              Enter shipping information to mark this order as shipped
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Tracking Number */}
            <div>
              <Label htmlFor="tracking">Tracking Number (Optional)</Label>
              <Input
                id="tracking"
                placeholder="Enter tracking number"
                value={shippingForm.trackingNumber}
                onChange={(e) =>
                  setShippingForm({ ...shippingForm, trackingNumber: e.target.value })
                }
              />
            </div>

            {/* Carrier */}
            <div>
              <Label htmlFor="carrier">Shipping Carrier (Optional)</Label>
              <Input
                id="carrier"
                placeholder="e.g., UPS, FedEx, DHL"
                value={shippingForm.carrier}
                onChange={(e) =>
                  setShippingForm({ ...shippingForm, carrier: e.target.value })
                }
              />
            </div>

            {/* Shipping Date */}
            <div>
              <Label htmlFor="ship-date">Shipping Date (Optional)</Label>
              <Input
                id="ship-date"
                type="date"
                value={shippingForm.shippingDate}
                onChange={(e) =>
                  setShippingForm({ ...shippingForm, shippingDate: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave blank to use today&apos;s date
              </p>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add shipping notes or special instructions..."
                value={shippingForm.notes}
                onChange={(e) =>
                  setShippingForm({ ...shippingForm, notes: e.target.value })
                }
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShippingDialogOpen(false);
                setShippingForm({
                  trackingNumber: '',
                  carrier: '',
                  shippingDate: '',
                  notes: '',
                });
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitShipping}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Mark as Shipped
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
