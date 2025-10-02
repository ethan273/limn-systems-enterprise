"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  Clock,
  PackageCheck,
  Truck,
  Box,
  Weight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { PackingBoxesList } from "@/components/packing/PackingBoxesList";

// Dynamic route configuration
export const dynamic = 'force-dynamic';

const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  pending: {
    label: "Pending",
    className: "bg-gray-100 text-gray-800 border-gray-300",
    icon: <Clock className="w-4 h-4" aria-hidden="true" />,
  },
  in_progress: {
    label: "In Progress",
    className: "bg-blue-100 text-blue-800 border-blue-300",
    icon: <Package className="w-4 h-4" aria-hidden="true" />,
  },
  packed: {
    label: "Packed",
    className: "bg-green-100 text-green-800 border-green-300",
    icon: <PackageCheck className="w-4 h-4" aria-hidden="true" />,
  },
  shipped: {
    label: "Shipped",
    className: "bg-purple-100 text-purple-800 border-purple-300",
    icon: <Truck className="w-4 h-4" aria-hidden="true" />,
  },
};

export default function PackingJobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params?.id as string;

  // Fetch packing job details
  const { data: job, isLoading, refetch } = api.packing.getJobById.useQuery(
    { id: jobId },
    { enabled: !!jobId }
  );

  // Update status mutation
  const updateStatusMutation = api.packing.updateJobStatus.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Packing job status updated successfully",
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (newStatus: string) => {
    updateStatusMutation.mutate({
      id: jobId,
      status: newStatus as any,
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading packing job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>Packing job not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  const config = statusConfig[job.packing_status] || statusConfig.pending;
  const packingProgress = job.quantity > 0
    ? Math.round((job.packed_quantity / job.quantity) * 100)
    : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/packing")}>
            <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Packing Job</h1>
            <p className="text-muted-foreground">
              {job.order_items?.description || "Packing Details"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={job.packing_status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="packed">Packed</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Status Alert */}
      {job.packing_status === "packed" && !job.tracking_number && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>
            Packing complete. Ready to assign tracking number and ship.
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            {config.icon}
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className={cn(config.className, "text-base")}>
              {config.label}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Packing Progress</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{packingProgress}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {job.packed_quantity} of {job.quantity} items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Boxes</CardTitle>
            <Box className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{job.box_count}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Weight</CardTitle>
            <Weight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {job.total_weight ? Number(job.total_weight).toFixed(2) : "0"} lbs
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Job Details */}
      <Card>
        <CardHeader>
          <CardTitle>Packing Job Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Item Description</label>
              <p className="text-base">
                {job.order_items?.description || "—"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">SKU</label>
              <p className="text-base">{job.order_items?.project_sku || "—"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Quantity</label>
              <p className="text-base">
                {job.packed_quantity} / {job.quantity} items
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Priority</label>
              <Badge
                variant="outline"
                className={cn(
                  "capitalize",
                  job.priority === "high" && "bg-red-100 text-red-800 border-red-300",
                  job.priority === "normal" && "bg-blue-100 text-blue-800 border-blue-300",
                  job.priority === "low" && "bg-gray-100 text-gray-800 border-gray-300"
                )}
              >
                {job.priority}
              </Badge>
            </div>
            {job.dimensions && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Dimensions</label>
                <p className="text-base">{job.dimensions}</p>
              </div>
            )}
            {job.tracking_number && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tracking Number</label>
                <p className="text-base font-mono">{job.tracking_number}</p>
              </div>
            )}
            {job.packed_date && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Packed Date</label>
                <p className="text-base">
                  {format(new Date(job.packed_date), "MMM d, yyyy h:mm a")}
                </p>
              </div>
            )}
            {job.qc_inspections && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">QC Status</label>
                <Badge
                  variant="outline"
                  className={cn(
                    "capitalize",
                    job.qc_inspections.status === "passed" && "bg-green-100 text-green-800 border-green-300",
                    job.qc_inspections.status === "failed" && "bg-red-100 text-red-800 border-red-300"
                  )}
                >
                  {job.qc_inspections.status}
                </Badge>
              </div>
            )}
          </div>

          {job.special_instructions && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Special Instructions</label>
              <Alert className="mt-2">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                <AlertDescription>{job.special_instructions}</AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Packing Boxes */}
      <PackingBoxesList packingJobId={jobId} boxes={job.packing_boxes || []} onUpdate={refetch} />
    </div>
  );
}
