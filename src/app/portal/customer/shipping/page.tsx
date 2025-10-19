'use client';

import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/EmptyState';
import {
  Truck,
  Package,
  Calendar,
  MapPin,
  ExternalLink,
  CheckCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

/**
 * Customer Portal Shipping Page
 * Track shipments and view shipping status
 */
export default function CustomerShippingPage() {
  const { data: shipmentsData, isLoading, error } = api.portal.getCustomerShipments.useQuery({
    limit: 100,
    offset: 0,
  });

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  const shipments = shipmentsData?.shipments || [];

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getShipmentStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
      pending: { label: 'Pending', variant: 'secondary' },
      in_transit: { label: 'In Transit', variant: 'default' },
      delivered: { label: 'Delivered', variant: 'default' },
      cancelled: { label: 'Cancelled', variant: 'destructive' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'in_transit':
        return <Truck className="h-5 w-5 text-primary" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-warning" />;
      default:
        return <Package className="h-5 w-5 text-muted-foreground" />;
    }
  };

  // Handle query error
  if (error) {
    return (
      <div className="space-y-6">
        <div className="page-header">
          <h1 className="page-title">Shipping & Tracking</h1>
          <p className="page-subtitle">Track your shipments and view delivery status</p>
        </div>
        <EmptyState
          icon={AlertTriangle}
          title="Failed to load shipments"
          description={error.message || "An unexpected error occurred. Please try again."}
          action={{
            label: 'Try Again',
            onClick: () => utils.portal.getCustomerShipments.invalidate(),
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
        <h1 className="page-title">Shipping & Tracking</h1>
        <p className="page-subtitle">Track your shipments and view delivery status</p>
      </div>

      {/* Shipments List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Active Shipments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading shipments...
            </div>
          ) : shipments.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="No shipments yet"
              description="Shipments will appear here once your orders are ready to ship"
            />
          ) : (
            <div className="space-y-4">
              {shipments.map((shipment: any) => (
                <div
                  key={shipment.id}
                  className="border rounded-lg p-6 hover:bg-muted/50 transition-colors"
                >
                  {/* Shipment Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className="mt-1">
                        {getStatusIcon(shipment.status)}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-lg">
                            {shipment.production_orders?.order_number || 'Order'}
                          </h3>
                          {getShipmentStatusBadge(shipment.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {shipment.production_orders?.item_name}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Shipment Details */}
                  <div className="grid gap-4 md:grid-cols-2 mb-4">
                    {/* Tracking Information */}
                    {shipment.tracking_number && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                          Tracking Number
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-sm">{shipment.tracking_number}</p>
                          {shipment.tracking_url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(shipment.tracking_url, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Carrier */}
                    {shipment.carrier && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                          Carrier
                        </p>
                        <p className="text-sm font-medium">{shipment.carrier}</p>
                      </div>
                    )}

                    {/* Ship Date */}
                    {shipment.ship_date && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Ship Date
                        </p>
                        <p className="text-sm">{formatDate(shipment.ship_date)}</p>
                      </div>
                    )}

                    {/* Estimated Delivery */}
                    {shipment.estimated_delivery_date && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Estimated Delivery
                        </p>
                        <p className="text-sm">{formatDate(shipment.estimated_delivery_date)}</p>
                      </div>
                    )}

                    {/* Actual Delivery */}
                    {shipment.actual_delivery_date && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" />
                          Delivered
                        </p>
                        <p className="text-sm font-semibold text-success">
                          {formatDate(shipment.actual_delivery_date)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Shipping Address */}
                  {shipment.shipping_address && (
                    <div className="border-t pt-4">
                      <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        Delivery Address
                      </p>
                      <div className="text-sm space-y-1">
                        {shipment.shipping_address.recipient_name && (
                          <p>{shipment.shipping_address.recipient_name}</p>
                        )}
                        <p>{shipment.shipping_address.address_line1}</p>
                        {shipment.shipping_address.address_line2 && (
                          <p>{shipment.shipping_address.address_line2}</p>
                        )}
                        <p>
                          {shipment.shipping_address.city}, {shipment.shipping_address.state_province}{' '}
                          {shipment.shipping_address.postal_code}
                        </p>
                        {shipment.shipping_address.country && (
                          <p>{shipment.shipping_address.country}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Track Shipment Button */}
                  {shipment.tracking_url && (
                    <div className="border-t pt-4 mt-4">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => window.open(shipment.tracking_url, '_blank')}
                      >
                        <Truck className="h-4 w-4 mr-2" />
                        Track Shipment
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Shipping Information */}
      <Card>
        <CardHeader>
          <CardTitle>Shipping Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Tracking Your Shipment</h4>
            <p className="text-sm text-muted-foreground">
              Once your order ships, you&apos;ll receive a tracking number. Click the &quot;Track Shipment&quot;
              button to view real-time updates from the carrier.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Delivery Questions?</h4>
            <p className="text-sm text-muted-foreground">
              If you have questions about your delivery, please contact our support team.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
