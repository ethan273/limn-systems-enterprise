/**
 * Ordered Item Production Detail Page
 *
 * Displays full details of an individual ordered production item including SKU, QC status, and shipment tracking
 *
 * @module production/ordered-items/[id]
 * @created 2025-10-28
 * @phase Grand Plan Phase 5 - Missing Pages Fix
 */

"use client";

import { useParams, useRouter } from "next/navigation";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  Truck,
  ClipboardCheck,
  Calendar,
  User,
  Building2,
  Barcode,
} from "lucide-react";
import { format } from "date-fns";

export default function OrderedItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = params.id as string;

  const { data: item, isLoading, error } = api.orderedItemsProduction.getById.useQuery(
    { id: itemId },
    { enabled: !!itemId }
  );

  // Handle error state
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Ordered Item Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive mb-4">
              {error.message || "Unable to load ordered item details"}
            </p>
            <Button onClick={() => router.push("/production/ordered-items")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Ordered Items
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3">Loading ordered item details...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container mx-auto p-6">
        <Breadcrumb />
        <Card>
          <CardHeader>
            <CardTitle>Ordered Item Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">The requested ordered item could not be found.</p>
            <Button onClick={() => router.push("/production/ordered-items")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Ordered Items
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "Pending", variant: "secondary" },
      in_production: { label: "In Production", variant: "default" },
      qc_passed: { label: "QC Passed", variant: "default" },
      qc_failed: { label: "QC Failed", variant: "destructive" },
      packed: { label: "Packed", variant: "outline" },
      shipped: { label: "Shipped", variant: "outline" },
    };

    const info = statusMap[status] || { label: status, variant: "outline" as const };
    return (
      <Badge variant={info.variant}>
        {info.label}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Breadcrumb />
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/production/ordered-items")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Ordered Item Details</h1>
            <p className="text-muted-foreground">
              SKU: {item.sku || "N/A"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {getStatusBadge(item.status)}
          {item.qc_status && (
            <Badge variant="secondary">
              QC: {item.qc_status}
            </Badge>
          )}
        </div>
      </div>

      {/* Item Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Item Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">SKU</h3>
              <p className="text-base flex items-center gap-2">
                <Barcode className="h-4 w-4" />
                {item.sku || "Not assigned"}
              </p>
            </div>
            {item.serial_number && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Serial Number</h3>
                <p className="text-base">{item.serial_number}</p>
              </div>
            )}
            {item.production_orders && (
              <>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Production Order</h3>
                  <p className="text-base">{item.production_orders.order_number}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Item Name</h3>
                  <p className="text-base">{item.production_orders.item_name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Order Status</h3>
                  {getStatusBadge(item.production_orders.status)}
                </div>
              </>
            )}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Created At</h3>
              <p className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {item.created_at ? format(new Date(item.created_at), "PPp") : "N/A"}
              </p>
            </div>
            {item.manufactured_date && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Manufactured Date</h3>
                <p className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(item.manufactured_date), "PPp")}
                </p>
              </div>
            )}
            {item.qc_inspection_date && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">QC Inspection Date</h3>
                <p className="text-base flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4" />
                  {format(new Date(item.qc_inspection_date), "PPp")}
                </p>
              </div>
            )}
            {item.qc_inspector_id && item.users && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">QC Inspector</h3>
                <p className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {item.users.name || item.users.email}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Project & Customer Information */}
      {item.production_orders?.projects && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Project & Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Project Name</h3>
                <p className="text-base">{item.production_orders.projects.project_name}</p>
              </div>
              {item.production_orders.projects.customers && (
                <>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Customer Name</h3>
                    <p className="text-base">{item.production_orders.projects.customers.name}</p>
                  </div>
                  {item.production_orders.projects.customers.company_name && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Company</h3>
                      <p className="text-base">{item.production_orders.projects.customers.company_name}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* QC Notes */}
      {item.qc_notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              QC Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-base whitespace-pre-wrap">{item.qc_notes}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shipment Information */}
      {item.shipments && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Shipment Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Shipment Number</h3>
                <p className="text-base">{item.shipments.shipment_number}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Carrier</h3>
                <p className="text-base">{item.shipments.carrier || "N/A"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Tracking Number</h3>
                <p className="text-base">{item.shipments.tracking_number || "N/A"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Shipment Status</h3>
                {getStatusBadge(item.shipments.status)}
              </div>
              <div className="col-span-2">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/shipping/shipments/${item.shipment_id}`)}
                >
                  View Shipment Details
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
