/**
 * Packing List Detail Page
 *
 * Displays full details of a packing job including boxes, shipments, and QC status
 *
 * @module production/packing-lists/[id]
 * @created 2025-10-28
 * @phase Grand Plan Phase 5 - Missing Pages Fix
 */

"use client";

import { useParams, useRouter } from "next/navigation";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { api } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Package,
  Box,
  Truck,
  ClipboardCheck,
  Calendar,
  Weight,
  Ruler,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";

export default function PackingListDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const { data: job, isLoading, error } = api.packing.getJobById.useQuery(
    { id: jobId },
    { enabled: !!jobId }
  );

  // Handle error state
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Packing Job Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive mb-4">
              {error.message || "Unable to load packing job details"}
            </p>
            <Button onClick={() => router.push("/production/packing-lists")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Packing Lists
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
              <span className="ml-3">Loading packing job details...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container mx-auto p-6">
        <Breadcrumb />
        <Card>
          <CardHeader>
            <CardTitle>Packing Job Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">The requested packing job could not be found.</p>
            <Button onClick={() => router.push("/production/packing-lists")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Packing Lists
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
      in_progress: { label: "In Progress", variant: "default" },
      packed: { label: "Packed", variant: "default" },
      shipped: { label: "Shipped", variant: "outline" },
    };

    const info = statusMap[status] || { label: status, variant: "outline" as const };
    return (
      <Badge variant={info.variant}>
        {info.label}
      </Badge>
    );
  };

  // Get priority badge
  const getPriorityBadge = (priority: string) => {
    const priorityMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      low: { label: "Low", variant: "outline" },
      normal: { label: "Normal", variant: "default" },
      high: { label: "High", variant: "destructive" },
    };

    const info = priorityMap[priority] || { label: priority, variant: "outline" as const };
    return (
      <Badge variant={info.variant}>
        {info.label}
      </Badge>
    );
  };

  const packingProgress = job.quantity > 0 ? (job.packed_quantity / job.quantity * 100).toFixed(0) : 0;

  return (
    <>
    <Breadcrumb />
    <div className="container mx-auto p-6 space-y-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/production/packing-lists")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Packing Job Details</h1>
            <p className="text-muted-foreground">Job ID: {job.id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {getStatusBadge(job.packing_status)}
          {getPriorityBadge(job.priority)}
        </div>
      </div>

      {/* Job Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Job Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Order ID</h3>
              <p className="text-base">{job.order_id}</p>
            </div>
            {job.order_items && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Order Item</h3>
                <p className="text-base">
                  {job.order_items.description || "N/A"}
                  {job.order_items.project_sku && <span className="text-muted-foreground"> ({job.order_items.project_sku})</span>}
                </p>
              </div>
            )}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Quantity</h3>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <p className="text-base">
                  {job.packed_quantity} / {job.quantity} packed ({packingProgress}%)
                </p>
              </div>
              <div className="w-full bg-secondary rounded-full h-2 mt-2">
                <div
                  className="bg-primary h-2 rounded-full"
                  style={{ width: `${packingProgress}%` }}
                ></div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Box Count</h3>
              <p className="text-base flex items-center gap-2">
                <Box className="h-4 w-4" />
                {job.box_count} boxes
              </p>
            </div>
            {job.total_weight && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Weight</h3>
                <p className="text-base flex items-center gap-2">
                  <Weight className="h-4 w-4" />
                  {Number(job.total_weight).toFixed(2)} lbs
                </p>
              </div>
            )}
            {job.dimensions && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Dimensions</h3>
                <p className="text-base flex items-center gap-2">
                  <Ruler className="h-4 w-4" />
                  {job.dimensions}
                </p>
              </div>
            )}
            {job.tracking_number && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Tracking Number</h3>
                <p className="text-base flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  {job.tracking_number}
                </p>
              </div>
            )}
            {job.packed_date && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Packed Date</h3>
                <p className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(job.packed_date), "PPp")}
                </p>
              </div>
            )}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Created At</h3>
              <p className="text-base">
                {job.created_at ? format(new Date(job.created_at), "PPp") : "N/A"}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Last Updated</h3>
              <p className="text-base">
                {job.updated_at ? format(new Date(job.updated_at), "PPp") : "N/A"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Special Instructions Card */}
      {job.special_instructions && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              Special Instructions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-accent rounded-lg">
              <p className="text-base whitespace-pre-wrap">{job.special_instructions}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Packing Boxes Card */}
      {job.packing_boxes && job.packing_boxes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Packing Boxes ({job.packing_boxes.length})</CardTitle>
            <CardDescription>
              Individual boxes for this packing job
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Box #</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Dimensions</TableHead>
                  <TableHead>Barcode</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {job.packing_boxes.map((box: any) => (
                  <TableRow key={box.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Box className="h-4 w-4 text-muted-foreground" />
                        {box.box_number}
                      </div>
                    </TableCell>
                    <TableCell>{box.quantity}</TableCell>
                    <TableCell>{box.weight ? `${Number(box.weight).toFixed(2)} lbs` : "N/A"}</TableCell>
                    <TableCell>{box.dimensions || "N/A"}</TableCell>
                    <TableCell><code className="text-xs">{box.barcode || "N/A"}</code></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* QC Inspections Card */}
      {job.qc_inspections && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              QC Inspection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Inspection ID</h3>
                <p className="text-base">{job.qc_inspections.id}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Stage</h3>
                <p className="text-base">{job.qc_inspections.qc_stage || "N/A"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Status</h3>
                {getStatusBadge(job.qc_inspections.status)}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shipments Card */}
      {job.shipments && job.shipments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Related Shipments ({job.shipments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shipment ID</TableHead>
                  <TableHead>Tracking Number</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {job.shipments.map((shipment: any) => (
                  <TableRow key={shipment.id}>
                    <TableCell><code className="text-xs">{shipment.id}</code></TableCell>
                    <TableCell>{shipment.tracking_number || "N/A"}</TableCell>
                    <TableCell>{getStatusBadge(shipment.status)}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/shipping/shipments/${shipment.id}`)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
    </>
  );
}
