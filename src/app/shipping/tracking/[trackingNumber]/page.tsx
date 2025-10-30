"use client";

import React, { use } from "react";
import { api } from "@/lib/api/client";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EntityDetailHeader } from "@/components/common/EntityDetailHeader";
import { InfoCard } from "@/components/common/InfoCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingState } from "@/components/common/LoadingState";
import {
  Package,
  AlertCircle,
  Truck,
  MapPin,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";

// Dynamic route configuration
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ trackingNumber: string }>;
}

export default function TrackingDetailPage({ params }: PageProps) {
  const { trackingNumber } = use(params);
  // Fetch tracking info (public endpoint - no auth required)
  const { data: shipment, isLoading, error } = api.shipping.getTrackingInfo.useQuery(
    { trackingNumber },
    { enabled: !!trackingNumber }
  );

  const utils = api.useUtils();

  // Handle query error
  if (error) {
    return (
      <div className="page-container">
        <EntityDetailHeader
          icon={Package}
          title="Track Your Shipment"
          subtitle={`Tracking: ${trackingNumber}`}
          metadata={[]}
          status="unknown"
        />
        <EmptyState
          icon={AlertTriangle}
          title="Failed to load tracking information"
          description={error.message || "An unexpected error occurred. Please try again."}
          action={{
            label: 'Try Again',
            onClick: () => utils.shipping.getTrackingInfo.invalidate(),
            icon: RefreshCw,
          }}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="page-container">
        <LoadingState message="Loading tracking information..." size="md" />
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="page-container">
        <EmptyState
          icon={AlertCircle}
          title="Tracking Number Not Found"
          description="The tracking number you entered could not be found in our system."
        />
      </div>
    );
  }

  // Parse destination address
  const destAddress = typeof shipment.destination_address === 'object' ? shipment.destination_address : null;

  return (
    <div className="page-container">
      <Breadcrumb />
      {/* Shipment Header */}
      <EntityDetailHeader
        icon={Package}
        title="Track Your Shipment"
        subtitle={`Tracking: ${shipment.tracking_number}${shipment.shipment_number ? ` • Order: ${shipment.shipment_number}` : ''}`}
        metadata={[
          ...(shipment.carrier ? [{ icon: Truck, value: shipment.carrier, type: 'text' as const }] : []),
          ...(shipment.service_level ? [{ icon: Truck, value: shipment.service_level, type: 'text' as const }] : []),
        ]}
        status={shipment.status}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Current Status</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusBadge status={shipment.status} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Estimated Delivery</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">
              {shipment.estimated_delivery ? format(new Date(shipment.estimated_delivery), "MMM dd, yyyy") : "N/A"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Shipping Method</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">{shipment.carrier || "N/A"}</p>
            {shipment.service_level && (
              <p className="text-sm text-muted-foreground">{shipment.service_level}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tracking Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Tracking Timeline</CardTitle>
        </CardHeader>
        <CardContent className="card-content-compact">
          {shipment.tracking_events && Array.isArray(shipment.tracking_events) && (shipment.tracking_events as any[]).length > 0 ? (
            <div className="activity-timeline">
              {(shipment.tracking_events as any[]).map((event: any, index: number) => (
                <div key={index} className="activity-timeline-item">
                  <div className="activity-timeline-icon">
                    <MapPin className="icon-sm status-in-progress" aria-hidden="true" />
                  </div>
                  <div className="activity-timeline-content">
                    <div className="activity-timeline-header">
                      <h4 className="activity-timeline-title">
                        {event.description || event.status || "Status update"}
                      </h4>
                      {event.timestamp && (
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(event.timestamp), "MMM dd, yyyy h:mm a")}
                        </span>
                      )}
                    </div>
                    {event.location && (
                      <p className="activity-timeline-description">
                        <MapPin className="icon-xs inline" aria-hidden="true" />
                        {event.location}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Package}
              title="No Tracking Events"
              description="No tracking events are available for this shipment yet."
            />
          )}
        </CardContent>
      </Card>

      {/* Shipment Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoCard
          title="Shipment Information"
          items={[
            { label: 'Tracking Number', value: shipment.tracking_number },
            { label: 'Shipment Number', value: shipment.shipment_number || '—' },
            { label: 'Carrier', value: shipment.carrier || '—' },
            { label: 'Service Level', value: shipment.service_level || '—' },
          ]}
        />

        {destAddress && (
          <InfoCard
            title="Delivery Address"
            items={[
              { label: 'Recipient', value: (destAddress as any).name || '—' },
              ...(((destAddress as any).company) ? [{ label: 'Company', value: (destAddress as any).company }] : []),
              {
                label: 'Address',
                value: (
                  <>
                    {(destAddress as any).address_line1 || ''}
                    {(destAddress as any).address_line2 && <><br />{(destAddress as any).address_line2}</>}
                    <br />
                    {(destAddress as any).city || ''}, {(destAddress as any).state || ''} {(destAddress as any).postal_code || ''}
                    <br />
                    {(destAddress as any).country || ''}
                  </>
                ),
              },
            ]}
          />
        )}
      </div>
    </div>
  );
}
