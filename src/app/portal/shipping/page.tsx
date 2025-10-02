"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Truck,
  Package,
  MapPin,
  Clock,
  CheckCircle2,
  Search,
  ArrowRight,
  Box,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// Dynamic route configuration
export const dynamic = 'force-dynamic';

const shipmentStatusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  pending: {
    label: "Pending",
    className: "badge-neutral",
    icon: <Clock className="w-3 h-3" aria-hidden="true" />,
  },
  picked_up: {
    label: "Picked Up",
    className: "bg-blue-100 text-blue-800 border-blue-300",
    icon: <Package className="w-3 h-3" aria-hidden="true" />,
  },
  in_transit: {
    label: "In Transit",
    className: "bg-blue-100 text-blue-800 border-blue-300",
    icon: <Truck className="w-3 h-3" aria-hidden="true" />,
  },
  out_for_delivery: {
    label: "Out for Delivery",
    className: "bg-purple-100 text-purple-800 border-purple-300",
    icon: <Truck className="w-3 h-3" aria-hidden="true" />,
  },
  delivered: {
    label: "Delivered",
    className: "bg-green-100 text-green-800 border-green-300",
    icon: <CheckCircle2 className="w-3 h-3" aria-hidden="true" />,
  },
  exception: {
    label: "Exception",
    className: "bg-red-100 text-red-800 border-red-300",
    icon: <Clock className="w-3 h-3" aria-hidden="true" />,
  },
};

export default function ShippingTrackingPage() {
  const searchParams = useSearchParams();
  const [trackingInput, setTrackingInput] = useState("");
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);

  // Get tracking number from URL if provided
  useEffect(() => {
    const trackingFromUrl = searchParams?.get("tracking");
    if (trackingFromUrl) {
      setTrackingInput(trackingFromUrl);
    }
  }, [searchParams]);

  // Fetch shipment tracking data if shipment ID is selected
  const { data: trackingData } = api.portal.getShipmentTracking.useQuery(
    { shipmentId: selectedShipmentId || "" },
    { enabled: !!selectedShipmentId }
  );

  // Fetch customer shipments list
  const { data: shipmentsData, isLoading: isLoadingShipments } = api.portal.getCustomerShipments.useQuery({
    limit: 50,
    offset: 0,
  });

  const shipments = shipmentsData?.shipments || [];

  // Filter shipments by tracking number if searching
  const filteredShipments = shipments.filter((shipment) => {
    if (!trackingInput) return true;
    return (
      shipment.tracking_number?.toLowerCase().includes(trackingInput.toLowerCase()) ||
      shipment.shipment_number?.toLowerCase().includes(trackingInput.toLowerCase())
    );
  });

  const handleTrackShipment = (shipmentId: string) => {
    setSelectedShipmentId(shipmentId);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Shipment Tracking</h1>
          <p className="text-muted-foreground">Track your orders in real-time</p>
        </div>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle>Track a Shipment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="trackingNumber">Tracking Number or Shipment Number</Label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" aria-hidden="true" />
                <Input
                  id="trackingNumber"
                  placeholder="Enter tracking number..."
                  value={trackingInput}
                  onChange={(e) => setTrackingInput(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shipment Detail View (when tracking number is selected) */}
      {selectedShipmentId && trackingData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Shipment Details</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Tracking: {trackingData.shipment.tracking_number}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setSelectedShipmentId(null)}>
                Back to List
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status and Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Status</CardTitle>
                  {shipmentStatusConfig[trackingData.status || 'pending']?.icon}
                </CardHeader>
                <CardContent>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-sm",
                      shipmentStatusConfig[trackingData.status || 'pending']?.className
                    )}
                  >
                    {shipmentStatusConfig[trackingData.status || 'pending']?.label}
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Carrier</CardTitle>
                  <Truck className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-medium">{trackingData.shipment.carrier || "—"}</p>
                  {trackingData.shipment.service_level && (
                    <p className="text-xs text-muted-foreground">{trackingData.shipment.service_level}</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Est. Delivery</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-medium">
                    {trackingData.estimatedDelivery
                      ? format(new Date(trackingData.estimatedDelivery), "MMM d, yyyy")
                      : "TBD"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Packages</CardTitle>
                  <Box className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-medium">{trackingData.shipment.package_count || 1}</p>
                  {trackingData.shipment.weight && (
                    <p className="text-xs text-muted-foreground">
                      {Number(trackingData.shipment.weight).toFixed(2)} lbs
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Addresses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ship From */}
              {trackingData.shipment.origin_address && typeof trackingData.shipment.origin_address === 'object' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MapPin className="w-4 h-4" aria-hidden="true" />
                      Ship From
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm space-y-1">
                      <p className="font-medium">
                        {(trackingData.shipment.origin_address as any).company ||
                         (trackingData.shipment.origin_address as any).name || "—"}
                      </p>
                      {(trackingData.shipment.origin_address as any).street1 && (
                        <p>{(trackingData.shipment.origin_address as any).street1}</p>
                      )}
                      {(trackingData.shipment.origin_address as any).street2 && (
                        <p>{(trackingData.shipment.origin_address as any).street2}</p>
                      )}
                      <p>
                        {(trackingData.shipment.origin_address as any).city}, {(trackingData.shipment.origin_address as any).state} {(trackingData.shipment.origin_address as any).zip}
                      </p>
                      <p>{(trackingData.shipment.origin_address as any).country || "USA"}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Ship To */}
              {trackingData.shipment.destination_address && typeof trackingData.shipment.destination_address === 'object' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MapPin className="w-4 h-4" aria-hidden="true" />
                      Ship To
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm space-y-1">
                      <p className="font-medium">
                        {(trackingData.shipment.destination_address as any).company ||
                         (trackingData.shipment.destination_address as any).name || "—"}
                      </p>
                      {(trackingData.shipment.destination_address as any).street1 && (
                        <p>{(trackingData.shipment.destination_address as any).street1}</p>
                      )}
                      {(trackingData.shipment.destination_address as any).street2 && (
                        <p>{(trackingData.shipment.destination_address as any).street2}</p>
                      )}
                      <p>
                        {(trackingData.shipment.destination_address as any).city}, {(trackingData.shipment.destination_address as any).state} {(trackingData.shipment.destination_address as any).zip}
                      </p>
                      <p>{(trackingData.shipment.destination_address as any).country || "USA"}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Tracking Events Timeline */}
            {trackingData.trackingEvents && Array.isArray(trackingData.trackingEvents) && trackingData.trackingEvents.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Tracking History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(trackingData.trackingEvents as any[]).map((event: any, index: number) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={cn(
                            "w-3 h-3 rounded-full",
                            index === 0 ? "bg-blue-600" : "bg-gray-300"
                          )} />
                          {index < (trackingData.trackingEvents as any[]).length - 1 && (
                            <div className="w-0.5 h-full bg-gray-200 mt-1" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">{event.description || event.status}</p>
                              {event.location && (
                                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                  <MapPin className="w-3 h-3" aria-hidden="true" />
                                  {event.location}
                                </p>
                              )}
                            </div>
                            <div className="text-right text-sm text-muted-foreground">
                              {event.timestamp && (
                                <>
                                  <p>{format(new Date(event.timestamp), "MMM d, yyyy")}</p>
                                  <p>{format(new Date(event.timestamp), "h:mm a")}</p>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Project Link */}
            {trackingData.shipment.projects?.name && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Related Project</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{trackingData.shipment.projects.name}</p>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      )}

      {/* Shipments List */}
      {!selectedShipmentId && (
        <Card>
          <CardHeader>
            <CardTitle>My Shipments</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingShipments ? (
              <div className="text-center py-8 text-muted-foreground">Loading shipments...</div>
            ) : filteredShipments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Truck className="w-12 h-12 mx-auto mb-2 opacity-50" aria-hidden="true" />
                <p>No shipments found</p>
                {trackingInput && <p className="text-sm mt-2">Try a different tracking number</p>}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Shipment Number</TableHead>
                      <TableHead>Tracking Number</TableHead>
                      <TableHead>Carrier</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Shipped Date</TableHead>
                      <TableHead>Est. Delivery</TableHead>
                      <TableHead>Packages</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredShipments.map((shipment) => {
                      const config = shipmentStatusConfig[shipment.status || 'pending'] || shipmentStatusConfig.pending;

                      return (
                        <TableRow
                          key={shipment.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleTrackShipment(shipment.id)}
                        >
                          <TableCell>
                            <span className="font-mono text-sm">{shipment.shipment_number || "—"}</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-sm font-medium">
                              {shipment.tracking_number || "—"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{shipment.carrier || "—"}</p>
                              {shipment.service_level && (
                                <p className="text-xs text-muted-foreground">{shipment.service_level}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn(config.className, "flex items-center gap-1 w-fit")}>
                              {config.icon}
                              {config.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {shipment.shipped_date ? (
                              <span className="text-sm">
                                {format(new Date(shipment.shipped_date), "MMM d, yyyy")}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {shipment.estimated_delivery ? (
                              <span className="text-sm">
                                {format(new Date(shipment.estimated_delivery), "MMM d, yyyy")}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Box className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                              <span className="text-sm">{shipment.package_count || 1}</span>
                              {shipment.weight && (
                                <span className="text-xs text-muted-foreground ml-2">
                                  ({Number(shipment.weight).toFixed(2)} lbs)
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTrackShipment(shipment.id);
                              }}
                            >
                              Track
                              <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
