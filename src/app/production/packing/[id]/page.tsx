"use client";

import React, { use } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
 Box,
 Weight,
 ArrowLeft,
 AlertCircle,
 CheckCircle2,
 Calendar,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { PackingBoxesList } from "@/components/packing/PackingBoxesList";

// Dynamic route configuration
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PackingJobDetailPage({ params }: PageProps) {
  const { id } = use(params);
 const router = useRouter();

 // Fetch packing job details
 const { data: job, isLoading, refetch } = api.packing.getJobById.useQuery(
 { id: id },
 { enabled: !!id }
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
 id: id,
 status: newStatus as any,
 });
 };

 if (isLoading) {
    return (
      <div className="page-container">
        <LoadingState message="Loading packing job details..." size="lg" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="page-container">
        <EmptyState
          icon={AlertCircle}
          title="Packing Job Not Found"
          description="The packing job you're looking for doesn't exist or you don't have permission to view it."
          action={{
            label: 'Back to Packing',
            onClick: () => router.push("/production/packing"),
            icon: ArrowLeft,
          }}
        />
      </div>
    );
  }

 const packingProgress = job.quantity > 0
 ? Math.round((job.packed_quantity / job.quantity) * 100)
 : 0;

  const metadata: EntityMetadata[] = [
    { icon: Package, value: `${job.packed_quantity} / ${job.quantity}`, label: 'Packed Quantity' },
    { icon: Box, value: `${job.box_count}`, label: 'Boxes' },
    { icon: Weight, value: job.total_weight ? `${Number(job.total_weight).toFixed(2)} lbs` : "0 lbs", label: 'Total Weight' },
  ];

  if (job.packed_date) {
    metadata.push({ icon: Calendar, value: formatDistanceToNow(new Date(job.packed_date), { addSuffix: true }), label: 'Packed' });
  }

  return (
    <div className="page-container">
      <EntityDetailHeader
        icon={Package}
        title="Packing Job"
        subtitle={job.order_items?.description || "Packing Details"}
        metadata={metadata}
        status={job.packing_status}
      />

      {/* Status Update Control */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Update Status:</span>
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
        <Alert className="mb-6">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>
            Packing complete. Ready to assign tracking number and ship.
          </AlertDescription>
        </Alert>
      )}

      {/* Packing Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <InfoCard
          title="Packing Information"
          items={[
            { label: 'Item Description', value: job.order_items?.description || "—" },
            { label: 'SKU', value: job.order_items?.project_sku || "—" },
            { label: 'Quantity', value: `${job.packed_quantity} / ${job.quantity} items` },
            ...(packingProgress === 100 ? [{ label: 'Packing Progress', value: 'Complete', type: 'badge' as 'badge', badgeVariant: 'success' as const }] : [{ label: 'Packing Progress', value: `${packingProgress}%` }]),
            { label: 'Priority', value: job.priority as string, type: 'badge', badgeVariant: job.priority === 'high' ? 'destructive' : 'default' },
            ...(job.dimensions ? [{ label: 'Dimensions', value: job.dimensions }] : []),
            ...(job.tracking_number ? [{ label: 'Tracking Number', value: job.tracking_number }] : []),
            ...(job.packed_date ? [{ label: 'Packed Date', value: format(new Date(job.packed_date), "MMM d, yyyy h:mm a") }] : []),
          ]}
        />

        <InfoCard
          title="Additional Details"
          items={[
            { label: 'Box Count', value: `${job.box_count}` },
            { label: 'Total Weight', value: job.total_weight ? `${Number(job.total_weight).toFixed(2)} lbs` : "0 lbs" },
            ...(job.qc_inspections && job.qc_inspections.status === 'passed' ? [{
              label: 'QC Status',
              value: job.qc_inspections.status as string,
              type: 'badge' as 'badge',
              badgeVariant: 'success' as 'success'
            }] : job.qc_inspections ? [{
              label: 'QC Status',
              value: job.qc_inspections.status as string,
              type: 'badge' as 'badge',
              badgeVariant: 'destructive' as 'destructive'
            }] : []),
            ...(job.special_instructions ? [{ label: 'Special Instructions', value: job.special_instructions }] : []),
          ]}
        />
      </div>

      {/* Packing Boxes */}
      <PackingBoxesList packingJobId={id} boxes={job.packing_boxes || []} onUpdate={refetch} />
    </div>
 );
}
