"use client";

import React, { use, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  EntityDetailHeader,
  InfoCard,
  LoadingState,
  EmptyState,
  type EntityMetadata,
} from "@/components/common";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  XCircle,
  Clock,
  Truck,
  MapPin,
  Calendar,
  Weight,
  DollarSign,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

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
    className: "bg-info-muted text-info border-info",
    icon: <Package className="w-4 h-4" aria-hidden="true" />,
  },
  ready: {
    label: "Ready",
    className: "bg-primary-muted text-primary border-primary",
    icon: <CheckCircle2 className="w-4 h-4" aria-hidden="true" />,
  },
  shipped: {
    label: "Shipped",
    className: "bg-success-muted text-success border-success",
    icon: <Truck className="w-4 h-4" aria-hidden="true" />,
  },
  in_transit: {
    label: "In Transit",
    className: "bg-info text-info border-info",
    icon: <Truck className="w-4 h-4" aria-hidden="true" />,
  },
  delivered: {
    label: "Delivered",
    className: "bg-success-muted text-success border-success",
    icon: <MapPin className="w-4 h-4" aria-hidden="true" />,
  },
  delayed: {
    label: "Delayed",
    className: "bg-warning-muted text-warning border-warning",
    icon: <AlertCircle className="w-4 h-4" aria-hidden="true" />,
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-muted text-muted border-muted",
    icon: <XCircle className="w-4 h-4" aria-hidden="true" />,
  },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ShipmentDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch shipment details
  const { data: shipment, isLoading, refetch } = api.shipping.getShipmentById.useQuery(
    { id: id },
    { enabled: !!id }
  );

  // Update shipment status mutation
  const updateStatusMutation = api.shipping.updateShipmentStatus.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Shipment status updated successfully",
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update shipment status",
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (newStatus: string) => {
    updateStatusMutation.mutate({
      id: id,
      status: newStatus as "pending" | "preparing" | "ready" | "shipped" | "in_transit" | "delivered" | "delayed" | "cancelled",
    });
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <LoadingState message="Loading shipment details..." size="lg" />
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="page-container">
        <EmptyState
          icon={AlertCircle}
          title="Shipment Not Found"
          description="The shipment you're looking for doesn't exist or you don't have permission to view it."
          action={{
            label: 'Back to Shipments',
            onClick: () => router.push("/shipping/shipments"),
            icon: ArrowLeft,
          }}
        />
      </div>
    );
  }

  // Parse packages data
  const packages = Array.isArray(shipment.packages) ? shipment.packages : [];
  const totalWeight = packages.reduce((sum: number, pkg: any) => sum + Number(pkg.weight || 0), 0);

  // Parse addresses
  const originAddress = typeof shipment.origin_address === 'object' ? shipment.origin_address : null;
  const destAddress = typeof shipment.destination_address === 'object' ? shipment.destination_address : null;

  const metadata: EntityMetadata[] = [
    { icon: Truck, value: shipment.carrier || "N/A", label: 'Carrier' },
    { icon: Weight, value: `${totalWeight.toFixed(2)} lbs`, label: 'Total Weight' },
    { icon: Calendar, value: shipment.estimated_delivery ? format(new Date(shipment.estimated_delivery), "MMM dd, yyyy") : "N/A", label: 'Est. Delivery' },
    { icon: DollarSign, value: `$${Number(shipment.shipping_cost || 0).toFixed(2)}`, label: 'Shipping Cost' },
  ];

  return (
    <div className="page-container">
      <EntityDetailHeader
        icon={Package}
        title={shipment.shipment_number || "Shipment"}
        subtitle={`Tracking: ${shipment.tracking_number || "N/A"}${shipment.projects ? ` • ${shipment.projects.name}` : ''}`}
        metadata={metadata}
        status={shipment.status}
      />

      {/* Status Update Control */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Update Status:</span>
          <Select value={shipment.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(statusConfig).map(([status, { label, icon }]) => (
                <SelectItem key={status} value={status}>
                  <div className="flex items-center gap-2">
                    {icon}
                    <span>{label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tracking">Tracking</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Shipment Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <InfoCard
              title="Shipment Details"
              items={[
                { label: 'Shipment Number', value: shipment.shipment_number || "N/A" },
                { label: 'Tracking Number', value: shipment.tracking_number || "N/A" },
                { label: 'Carrier', value: shipment.carrier || "N/A" },
                { label: 'Service Level', value: shipment.service_level || "N/A" },
                { label: 'Estimated Delivery', value: shipment.estimated_delivery ? format(new Date(shipment.estimated_delivery), "MMM dd, yyyy") : "N/A" },
                { label: 'Shipping Cost', value: `$${Number(shipment.shipping_cost || 0).toFixed(2)}` },
                ...(shipment.special_instructions ? [{ label: 'Special Instructions', value: shipment.special_instructions }] : []),
              ]}
            />

            <InfoCard
              title="Weight & Package Info"
              items={[
                { label: 'Total Weight', value: `${totalWeight.toFixed(2)} lbs` },
                { label: 'Package Count', value: `${packages.length}` },
              ]}
            />
          </div>

          {/* Package Contents */}
          <Card>
            <CardHeader>
              <CardTitle>Package Contents</CardTitle>
            </CardHeader>
            <CardContent>
              {shipment.ordered_items_production && shipment.ordered_items_production.length > 0 ? (
                <div className="space-y-2">
                  {shipment.ordered_items_production.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">{item.catalog_items?.name || "Item"}</p>
                        <p className="text-sm text-muted-foreground">
                          SKU: {item.catalog_items?.sku || "N/A"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Production Order</p>
                        <p className="font-medium">{item.production_orders?.production_order_number || "N/A"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No items in this shipment</p>
              )}
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Origin Address</CardTitle>
              </CardHeader>
              <CardContent>
                {originAddress ? (
                  <div className="space-y-1">
                    <p className="font-medium">{(originAddress as any).name || ""}</p>
                    {(originAddress as any).company && <p>{(originAddress as any).company}</p>}
                    <p>{(originAddress as any).address_line1 || ""}</p>
                    {(originAddress as any).address_line2 && <p>{(originAddress as any).address_line2}</p>}
                    <p>
                      {(originAddress as any).city || ""}, {(originAddress as any).state || ""} {(originAddress as any).postal_code || ""}
                    </p>
                    <p>{(originAddress as any).country || ""}</p>
                    {(originAddress as any).phone && <p className="pt-2">Phone: {(originAddress as any).phone}</p>}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No origin address</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Destination Address</CardTitle>
              </CardHeader>
              <CardContent>
                {destAddress ? (
                  <div className="space-y-1">
                    <p className="font-medium">{(destAddress as any).name || ""}</p>
                    {(destAddress as any).company && <p>{(destAddress as any).company}</p>}
                    <p>{(destAddress as any).address_line1 || ""}</p>
                    {(destAddress as any).address_line2 && <p>{(destAddress as any).address_line2}</p>}
                    <p>
                      {(destAddress as any).city || ""}, {(destAddress as any).state || ""} {(destAddress as any).postal_code || ""}
                    </p>
                    <p>{(destAddress as any).country || ""}</p>
                    {(destAddress as any).phone && <p className="pt-2">Phone: {(destAddress as any).phone}</p>}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No destination address</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tracking Tab */}
        <TabsContent value="tracking">
          <Card>
            <CardHeader>
              <CardTitle>Tracking History</CardTitle>
            </CardHeader>
            <CardContent>
              {shipment.tracking_events && Array.isArray(shipment.tracking_events) && (shipment.tracking_events as any[]).length > 0 ? (
                <div className="space-y-4">
                  {(shipment.tracking_events as any[]).map((event: any, index: number) => (
                    <div key={index} className="flex gap-4 pb-4 border-b last:border-b-0">
                      <div className="flex-shrink-0 w-24 text-sm text-muted-foreground">
                        {event.timestamp && format(new Date(event.timestamp), "MMM dd, yyyy")}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{event.description || event.status || "Status update"}</p>
                        {event.location && (
                          <p className="text-sm text-muted-foreground mt-1">{event.location}</p>
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
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Shipping Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {shipment.label_url ? (
                <div className="space-y-2">
                  <Button variant="outline" asChild>
                    <a href={shipment.label_url} target="_blank" rel="noopener noreferrer">
                      View Shipping Label
                    </a>
                  </Button>
                </div>
              ) : (
                <p className="text-muted-foreground">No documents available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
