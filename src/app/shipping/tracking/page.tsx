"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// Dynamic route configuration
export const dynamic = 'force-dynamic';

export default function TrackingPage() {
  const router = useRouter();
  useAuth();
  const [trackingNumber, setTrackingNumber] = useState("");
  const [searchAttempted, setSearchAttempted] = useState(false);

  // Track shipment query
  const { data: trackingData, isLoading, refetch } = api.shipping.trackShipment.useQuery(
    {
      trackingNumber,
    },
    {
      enabled: false, // Only fetch when user clicks Track button
    }
  );

  const handleTrack = () => {
    if (trackingNumber.trim()) {
      setSearchAttempted(true);
      refetch();
    }
  };

  const shipment = trackingData;

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
                          shipment.status === "shipped" && "bg-green-100 text-green-800 border-green-300",
                          shipment.status === "in_transit" && "bg-blue-100 text-blue-800 border-blue-300",
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

                  {shipment.orders && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-muted mb-1">Order Number</p>
                          <p className="font-medium text-sm">{shipment.orders.order_number}</p>
                        </div>
                        {shipment.orders.projects && (
                          <div>
                            <p className="text-sm text-muted mb-1">Project</p>
                            <p className="font-medium text-sm">
                              {shipment.orders.projects.project_name}
                            </p>
                          </div>
                        )}
                        {shipment.orders.customers && (
                          <div>
                            <p className="text-sm text-muted mb-1">Customer</p>
                            <p className="font-medium text-sm">
                              {shipment.orders.customers.company_name ||
                                shipment.orders.customers.name}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
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
                      <div className="p-2 bg-green-100 rounded-full">
                        <CheckCircle2 className="w-4 h-4 text-green-600" aria-hidden="true" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">Shipment Created</p>
                        <p className="text-xs text-muted">
                          {shipment.created_at && format(new Date(shipment.created_at), "MMM d, yyyy h:mm a")}
                        </p>
                      </div>
                    </div>

                    {shipment.shipped_date && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 rounded-full">
                          <TruckIcon className="w-4 h-4 text-blue-600" aria-hidden="true" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">Picked Up</p>
                          <p className="text-xs text-muted">
                            {format(new Date(shipment.shipped_date), "MMM d, yyyy h:mm a")}
                          </p>
                        </div>
                      </div>
                    )}

                    {shipment.status === "in_transit" && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-yellow-100 rounded-full">
                          <Clock className="w-4 h-4 text-yellow-600" aria-hidden="true" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">In Transit</p>
                          <p className="text-xs text-muted">Currently en route to destination</p>
                        </div>
                      </div>
                    )}

                    {shipment.status === "delivered" && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-green-100 rounded-full">
                          <CheckCircle2 className="w-4 h-4 text-green-600" aria-hidden="true" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">Delivered</p>
                          <p className="text-xs text-muted">Package successfully delivered</p>
                        </div>
                      </div>
                    )}

                    {shipment.status === "delayed" && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-red-100 rounded-full">
                          <AlertCircle className="w-4 h-4 text-red-600" aria-hidden="true" />
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
              {Array.isArray(shipment.packages) && shipment.packages.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Package Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {shipment.packages.map((pkg: any, index: number) => (
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
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="card-content-compact">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MapPin className="w-5 h-5 text-blue-600" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900">How to Track Your Shipment</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Enter your tracking number in the search box above. Tracking numbers are typically provided
                  in your shipping confirmation email or can be found on your packing slip.
                </p>
                <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
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
