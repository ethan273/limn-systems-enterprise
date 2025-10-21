"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
// Auth is handled by middleware - no client-side checks needed
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  MapPin,
  TruckIcon,
  Search,
  Package,
  CheckCircle2,
  Clock,
  AlertCircle,
  Ship,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// Dynamic route configuration
export const dynamic = 'force-dynamic';

export default function TrackingPage() {
  const router = useRouter();
  const [trackingNumber, setTrackingNumber] = useState("");
  const [searchAttempted, setSearchAttempted] = useState(false);

  // Track shipment query
  const { data: trackingData, isLoading, error } = api.shipping.trackShipment.useQuery(
    {
      tracking_number: trackingNumber,
    },
    {
      enabled: false, // Only fetch when user clicks Track button
    }
  );

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  const handleTrack = () => {
    if (trackingNumber.trim()) {
      setSearchAttempted(true);
      // Invalidate queries for instant updates
      utils.shipping.trackShipment.invalidate();
    }
  };

  const shipment = trackingData;

  // Handle query error
  if (error && searchAttempted) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Track Shipment</h1>
            <p className="page-description">
              Enter a tracking number to view real-time shipment status
            </p>
          </div>
          <Button
            onClick={() => router.push("/shipping/shipments")}
            variant="outline"
            className="btn-outline"
          >
            View All Shipments
          </Button>
        </div>
        <Card>
          <CardContent className="card-content-compact">
            <div className="empty-state">
              <AlertTriangle className="empty-state-icon text-destructive" aria-hidden="true" />
              <h3 className="empty-state-title">Failed to load tracking information</h3>
              <p className="empty-state-description">
                {error.message || "An unexpected error occurred. Please try again."}
              </p>
              <Button
                onClick={() => {
                  utils.shipping.trackShipment.invalidate();
                  handleTrack();
                }}
                className="btn-primary mt-4"
              >
                <RefreshCw className="icon-sm" aria-hidden="true" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Track Shipment</h1>
          <p className="page-description">
            Enter a tracking number to view real-time shipment status
          </p>
        </div>
        <Button
          onClick={() => router.push("/shipping/shipments")}
          variant="outline"
          className="btn-outline"
        >
          View All Shipments
        </Button>
      </div>

      {/* Tracking Input */}
      <Card>
        <CardContent className="card-content-compact">
          <div className="flex gap-2">
            <div className="flex-1 search-input-wrapper">
              <Search className="search-icon" aria-hidden="true" />
              <Input
                placeholder="Enter tracking number (e.g., 1Z999AA10123456784)"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleTrack()}
                className="search-input"
              />
            </div>
            <Button
              onClick={handleTrack}
              disabled={!trackingNumber.trim() || isLoading}
              className="btn-primary"
            >
              {isLoading ? "Tracking..." : "Track"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tracking Results */}
      {searchAttempted && !isLoading && (
        <>
          {shipment ? (
            <div className="space-y-4">
              {/* Shipment Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Shipment Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted mb-1">Tracking Number</p>
                      <p className="font-mono text-sm font-medium">
                        {shipment.tracking_number}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted mb-1">Carrier</p>
                      <Badge variant="outline" className="badge-neutral">
                        {shipment.carrier || "N/A"}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted mb-1">Status</p>
                      <Badge
                        variant="outline"
                        className={cn(
                          shipment.status === "delivered" && "status-completed",
                          shipment.status === "shipped" && "bg-success-muted text-success border-success",
                          shipment.status === "in_transit" && "bg-info-muted text-info border-info",
                          shipment.status === "pending" && "badge-neutral",
                          shipment.status === "delayed" && "status-cancelled"
                        )}
                      >
                        {shipment.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted mb-1">Est. Delivery</p>
                      <p className="font-medium text-sm">
                        {shipment.estimated_delivery
                          ? format(new Date(shipment.estimated_delivery), "MMM d, yyyy")
                          : "TBD"}
                      </p>
                    </div>
                  </div>

                  {/* Order details would be shown here if available from database lookup */}
                </CardContent>
              </Card>

              {/* Tracking Events Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle>Tracking History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Example tracking events - in a real implementation, this would come from SEKO API */}
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-success-muted rounded-full">
                        <CheckCircle2 className="w-4 h-4 text-success" aria-hidden="true" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">Shipment Created</p>
                        <p className="text-xs text-muted">
                          {(shipment as any).created_at && format(new Date((shipment as any).created_at), "MMM d, yyyy h:mm a")}
                        </p>
                      </div>
                    </div>

                    {(shipment as any).shipped_date && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-info-muted rounded-full">
                          <TruckIcon className="w-4 h-4 text-info" aria-hidden="true" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">Picked Up</p>
                          <p className="text-xs text-muted">
                            {format(new Date((shipment as any).shipped_date), "MMM d, yyyy h:mm a")}
                          </p>
                        </div>
                      </div>
                    )}

                    {shipment.status === "in_transit" && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-warning-muted rounded-full">
                          <Clock className="w-4 h-4 text-warning" aria-hidden="true" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">In Transit</p>
                          <p className="text-xs text-muted">Currently en route to destination</p>
                        </div>
                      </div>
                    )}

                    {shipment.status === "delivered" && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-success-muted rounded-full">
                          <CheckCircle2 className="w-4 h-4 text-success" aria-hidden="true" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">Delivered</p>
                          <p className="text-xs text-muted">Package successfully delivered</p>
                        </div>
                      </div>
                    )}

                    {shipment.status === "delayed" && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-destructive-muted rounded-full">
                          <AlertCircle className="w-4 h-4 text-destructive" aria-hidden="true" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">Delayed</p>
                          <p className="text-xs text-muted">Shipment experiencing delays</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Packages */}
              {Array.isArray((shipment as any).packages) && (shipment as any).packages.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Package Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(shipment as any).packages.map((pkg: any, index: number) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Package className="w-4 h-4 text-muted" aria-hidden="true" />
                            <p className="font-medium text-sm">Package #{index + 1}</p>
                          </div>
                          <div className="text-xs text-muted space-y-1">
                            <p>Weight: {pkg.weight || "N/A"}</p>
                            <p>Dimensions: {pkg.dimensions || "N/A"}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="card-content-compact">
                <div className="empty-state">
                  <Ship className="empty-state-icon" aria-hidden="true" />
                  <h3 className="empty-state-title">No Tracking Information Found</h3>
                  <p className="empty-state-description">
                    We couldn&apos;t find any shipment with tracking number &quot;{trackingNumber}&quot;.
                    Please verify the number and try again.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Instructions (shown when no search attempted) */}
      {!searchAttempted && (
        <Card className="bg-info/10 border-info/20 dark:bg-info/5 dark:border-info/30">
          <CardContent className="card-content-compact">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-info/20 dark:bg-info/10 rounded-lg">
                <MapPin className="w-5 h-5 text-info" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-info dark:text-info">How to Track Your Shipment</h3>
                <p className="text-sm text-info/90 dark:text-info/80 mt-1">
                  Enter your tracking number in the search box above. Tracking numbers are typically provided
                  in your shipping confirmation email or can be found on your packing slip.
                </p>
                <ul className="text-sm text-info/90 dark:text-info/80 mt-2 space-y-1 list-disc list-inside">
                  <li>Tracking numbers are usually 10-20 characters long</li>
                  <li>They may contain letters and numbers</li>
                  <li>Real-time tracking information is powered by SEKO</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
