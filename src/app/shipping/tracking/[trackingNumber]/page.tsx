"use client";

import React from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Package,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Truck,
  MapPin,
} from "lucide-react";
import { format } from "date-fns";

// Dynamic route configuration
export const dynamic = 'force-dynamic';

const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  pending: {
    label: "Pending",
    className: "badge-neutral",
    icon: <Clock className="w-4 h-4" aria-hidden="true" />,
  },
  preparing: {
    label: "Preparing",
    className: "bg-blue-100 text-blue-800 border-blue-300",
    icon: <Package className="w-4 h-4" aria-hidden="true" />,
  },
  ready: {
    label: "Ready",
    className: "bg-purple-100 text-purple-800 border-purple-300",
    icon: <CheckCircle2 className="w-4 h-4" aria-hidden="true" />,
  },
  shipped: {
    label: "Shipped",
    className: "bg-green-100 text-green-800 border-green-300",
    icon: <Truck className="w-4 h-4" aria-hidden="true" />,
  },
  in_transit: {
    label: "In Transit",
    className: "bg-cyan-100 text-cyan-800 border-cyan-300",
    icon: <Truck className="w-4 h-4" aria-hidden="true" />,
  },
  delivered: {
    label: "Delivered",
    className: "bg-green-100 text-green-800 border-green-300",
    icon: <MapPin className="w-4 h-4" aria-hidden="true" />,
  },
  delayed: {
    label: "Delayed",
    className: "bg-yellow-100 text-yellow-800 border-yellow-300",
    icon: <AlertCircle className="w-4 h-4" aria-hidden="true" />,
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-gray-100 text-gray-800 border-gray-300",
    icon: <XCircle className="w-4 h-4" aria-hidden="true" />,
  },
};

export default function TrackingDetailPage() {
  const params = useParams();
  const trackingNumber = params?.trackingNumber as string;

  // Fetch tracking info (public endpoint - no auth required)
  const { data: shipment, isLoading } = api.shipping.getTrackingInfo.useQuery(
    { trackingNumber },
    { enabled: !!trackingNumber }
  );

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading tracking information...</p>
        </div>
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="page-container">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>Tracking number not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  const config = statusConfig[shipment.status] || statusConfig.pending;

  // Parse destination address
  const destAddress = typeof shipment.destination_address === 'object' ? shipment.destination_address : null;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Track Your Shipment</h1>
          <p className="page-description">
            Tracking Number: {shipment.tracking_number}
            {shipment.shipment_number && ` • Order: ${shipment.shipment_number}`}
          </p>
        </div>
        <Badge className={config.className}>
          <span className="flex items-center gap-1">
            {config.icon}
            {config.label}
          </span>
        </Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={config.className}>
              <span className="flex items-center gap-1">
                {config.icon}
                {config.label}
              </span>
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Estimated Delivery</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">
              {shipment.estimated_delivery ? format(new Date(shipment.estimated_delivery), "MMM dd, yyyy") : "N/A"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Shipping Method</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">{shipment.carrier || "N/A"}</p>
            <p className="text-sm text-muted-foreground">{shipment.service_level || ""}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tracking Timeline */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Tracking Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {shipment.tracking_events && Array.isArray(shipment.tracking_events) && (shipment.tracking_events as any[]).length > 0 ? (
            <div className="space-y-4">
              {(shipment.tracking_events as any[]).map((event: any, index: number) => (
                <div key={index} className="flex gap-4 pb-4 border-b last:border-b-0">
                  <div className="flex-shrink-0 w-32">
                    <p className="text-sm font-medium">
                      {event.timestamp && format(new Date(event.timestamp), "MMM dd, yyyy")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {event.timestamp && format(new Date(event.timestamp), "h:mm a")}
                    </p>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{event.description || event.status || "Status update"}</p>
                    {event.location && (
                      <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" aria-hidden="true" />
                        {event.location}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No tracking events available</p>
          )}
        </CardContent>
      </Card>

      {/* Shipment Information */}
      <Card>
        <CardHeader>
          <CardTitle>Shipment Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Tracking Number</p>
              <p className="font-medium">{shipment.tracking_number}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Shipment Number</p>
              <p className="font-medium">{shipment.shipment_number || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Carrier</p>
              <p className="font-medium">{shipment.carrier || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Service Level</p>
              <p className="font-medium">{shipment.service_level || "N/A"}</p>
            </div>
          </div>

          {destAddress && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">Delivery Address</p>
              <div className="space-y-1">
                <p className="font-medium">{(destAddress as any).name || ""}</p>
                {(destAddress as any).company && <p>{(destAddress as any).company}</p>}
                <p>{(destAddress as any).address_line1 || ""}</p>
                {(destAddress as any).address_line2 && <p>{(destAddress as any).address_line2}</p>}
                <p>
                  {(destAddress as any).city || ""}, {(destAddress as any).state || ""} {(destAddress as any).postal_code || ""}
                </p>
                <p>{(destAddress as any).country || ""}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
