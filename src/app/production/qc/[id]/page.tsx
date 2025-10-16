"use client";

import React, { use, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import {
 ClipboardCheck,
 AlertCircle,
 CheckCircle2,
 Camera,
 ArrowLeft,
 XCircle,
 Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { QCDefectsList } from "@/components/qc/QCDefectsList";
import { QCPhotoGallery } from "@/components/qc/QCPhotoGallery";
import { QCCheckpointsList } from "@/components/qc/QCCheckpointsList";

// Dynamic route configuration
export const dynamic = 'force-dynamic';

const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
 pending: {
 label: "Pending",
 className: "badge-neutral",
 icon: <Clock className="w-4 h-4" aria-hidden="true" />,
 },
 in_progress: {
 label: "In Progress",
 className: "bg-info-muted text-info border-info",
 icon: <ClipboardCheck className="w-4 h-4" aria-hidden="true" />,
 },
 passed: {
 label: "Passed",
 className: "bg-success-muted text-success border-success",
 icon: <CheckCircle2 className="w-4 h-4" aria-hidden="true" />,
 },
 failed: {
 label: "Failed",
 className: "bg-destructive-muted text-destructive border-destructive",
 icon: <XCircle className="w-4 h-4" aria-hidden="true" />,
 },
 on_hold: {
 label: "On Hold",
 className: "bg-warning-muted text-warning border-warning",
 icon: <AlertCircle className="w-4 h-4" aria-hidden="true" />,
 },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function QCInspectionDetailPage({ params }: PageProps) {
  const { id } = use(params);
 const router = useRouter();
 const [activeTab, setActiveTab] = useState("overview");

 // Fetch inspection details
 const { data: inspection, isLoading } = api.qc.getInspectionById.useQuery(
 { id: id },
 { enabled: !!id }
 );

 // Get tRPC utils for cache invalidation
 const utils = api.useUtils();

 // Update inspection status mutation
 const updateStatusMutation = api.qc.updateInspectionStatus.useMutation({
 onSuccess: () => {
 toast({
 title: "Success",
 description: "Inspection status updated successfully",
 });
 // Invalidate queries for instant updates
 utils.qc.getInspectionById.invalidate();
 utils.qc.getAllInspections.invalidate();
 },
 onError: (error) => {
 toast({
 title: "Error",
 description: error.message || "Failed to update inspection status",
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
 <div className="container mx-auto p-6">
 <div className="text-center py-12">
 <p className="text-muted-foreground">Loading inspection details...</p>
 </div>
 </div>
 );
 }

 if (!inspection) {
 return (
 <div className="container mx-auto p-6">
 <Alert variant="destructive">
 <AlertCircle className="h-4 w-4" aria-hidden="true" />
 <AlertDescription>QC inspection not found</AlertDescription>
 </Alert>
 </div>
 );
 }

 const config = statusConfig[inspection.status] || statusConfig.pending;

 const defectStats = {
 total: inspection.qc_defects?.length || 0,
 critical: inspection.qc_defects?.filter((d) => d.severity === "critical").length || 0,
 major: inspection.qc_defects?.filter((d) => d.severity === "major").length || 0,
 minor: inspection.qc_defects?.filter((d) => d.severity === "minor").length || 0,
 cosmetic: inspection.qc_defects?.filter((d) => d.severity === "cosmetic").length || 0,
 };

 return (
 <div className="container mx-auto p-6 space-y-6">
 {/* Header */}
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-4">
 <Button variant="ghost" size="sm" onClick={() => router.push("/qc")}>
 <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
 Back
 </Button>
 <div>
 <h1 className="text-3xl font-bold">QC Inspection</h1>
 <p className="text-muted-foreground">
 {inspection.prototype_production?.prototypes?.name ||
 inspection.production_items?.item_name ||
 "Inspection Details"}
 </p>
 </div>
 </div>
 <div className="flex items-center gap-3">
 <Select value={inspection.status} onValueChange={handleStatusChange}>
 <SelectTrigger className="w-[180px]">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="pending">Pending</SelectItem>
 <SelectItem value="in_progress">In Progress</SelectItem>
 <SelectItem value="passed">Passed</SelectItem>
 <SelectItem value="failed">Failed</SelectItem>
 <SelectItem value="on_hold">On Hold</SelectItem>
 </SelectContent>
 </Select>
 </div>
 </div>

 {/* Status Alert */}
 {inspection.status === "failed" && defectStats.critical > 0 && (
 <Alert variant="destructive">
 <AlertCircle className="h-4 w-4" aria-hidden="true" />
 <AlertDescription>
 This inspection has {defectStats.critical} critical defect{defectStats.critical !== 1 ? "s" : ""} that must be resolved before approval.
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
 <CardTitle className="text-sm font-medium">Total Defects</CardTitle>
 <AlertCircle className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold">{defectStats.total}</div>
 {defectStats.critical > 0 && (
 <p className="text-xs text-destructive mt-1">{defectStats.critical} critical</p>
 )}
 </CardContent>
 </Card>

 <Card>
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
 <CardTitle className="text-sm font-medium">Photos</CardTitle>
 <Camera className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold">{inspection.qc_photos?.length || 0}</div>
 </CardContent>
 </Card>

 <Card>
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
 <CardTitle className="text-sm font-medium">QC Stage</CardTitle>
 <ClipboardCheck className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
 </CardHeader>
 <CardContent>
 <Badge variant="outline" className="capitalize">
 {inspection.qc_stage.replace(/_/g, " ")}
 </Badge>
 </CardContent>
 </Card>
 </div>

 {/* Tabs */}
 <Tabs value={activeTab} onValueChange={setActiveTab}>
 <TabsList className="grid w-full grid-cols-4">
 <TabsTrigger value="overview">Overview</TabsTrigger>
 <TabsTrigger value="defects">
 Defects ({defectStats.total})
 </TabsTrigger>
 <TabsTrigger value="photos">
 Photos ({inspection.qc_photos?.length || 0})
 </TabsTrigger>
 <TabsTrigger value="checkpoints">Checkpoints</TabsTrigger>
 </TabsList>

 <TabsContent value="overview" className="space-y-4">
 {/* Inspection Details */}
 <Card>
 <CardHeader>
 <CardTitle>Inspection Details</CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label className="text-sm font-medium text-muted-foreground">Item/Prototype</label>
 <p className="text-base">
 {inspection.prototype_production?.prototypes?.name ||
 inspection.production_items?.item_name ||
 "—"}
 </p>
 {inspection.prototype_production?.prototypes?.prototype_number && (
 <p className="text-sm text-muted-foreground">
 {inspection.prototype_production.prototypes.prototype_number}
 </p>
 )}
 </div>
 <div>
 <label className="text-sm font-medium text-muted-foreground">QC Stage</label>
 <p className="text-base capitalize">{inspection.qc_stage.replace(/_/g, " ")}</p>
 </div>
 <div>
 <label className="text-sm font-medium text-muted-foreground">Priority</label>
 <Badge
 variant="outline"
 className={cn(
 "capitalize",
 inspection.priority === "high" && "bg-destructive-muted text-destructive border-destructive",
 inspection.priority === "normal" && "bg-info-muted text-info border-info",
 inspection.priority === "low" && "badge-neutral"
 )}
 >
 {inspection.priority}
 </Badge>
 </div>
 <div>
 <label className="text-sm font-medium text-muted-foreground">Started At</label>
 <p className="text-base">
 {inspection.started_at
 ? format(new Date(inspection.started_at), "MMM d, yyyy h:mm a")
 : "—"}
 </p>
 </div>
 {inspection.completed_at && (
 <div>
 <label className="text-sm font-medium text-muted-foreground">Completed At</label>
 <p className="text-base">
 {format(new Date(inspection.completed_at), "MMM d, yyyy h:mm a")}
 </p>
 </div>
 )}
 {inspection.batch_id && (
 <div>
 <label className="text-sm font-medium text-muted-foreground">Batch ID</label>
 <p className="text-base">{inspection.batch_id}</p>
 </div>
 )}
 </div>

 {inspection.notes && (
 <div>
 <label className="text-sm font-medium text-muted-foreground">Notes</label>
 <p className="text-base mt-1">{inspection.notes}</p>
 </div>
 )}
 </CardContent>
 </Card>

 {/* Defects Summary */}
 <Card>
 <CardHeader>
 <CardTitle>Defects Summary</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 <div className="text-center p-4 bg-destructive/10 dark:bg-destructive/5 rounded-lg border border-destructive/20 dark:border-destructive/30">
 <p className="text-2xl font-bold text-destructive">{defectStats.critical}</p>
 <p className="text-sm text-muted-foreground">Critical</p>
 </div>
 <div className="text-center p-4 bg-warning/10 dark:bg-warning/5 rounded-lg border border-warning/20 dark:border-warning/30">
 <p className="text-2xl font-bold text-warning">{defectStats.major}</p>
 <p className="text-sm text-muted-foreground">Major</p>
 </div>
 <div className="text-center p-4 bg-warning/10 dark:bg-warning/5 rounded-lg border border-warning/20 dark:border-warning/30">
 <p className="text-2xl font-bold text-warning">{defectStats.minor}</p>
 <p className="text-sm text-muted-foreground">Minor</p>
 </div>
 <div className="text-center p-4 bg-muted/50 dark:bg-muted/20 rounded-lg border border-border">
 <p className="text-2xl font-bold">{defectStats.cosmetic}</p>
 <p className="text-sm text-muted-foreground">Cosmetic</p>
 </div>
 </div>
 </CardContent>
 </Card>
 </TabsContent>

 <TabsContent value="defects">
 <QCDefectsList inspectionId={id} defects={inspection.qc_defects || []} onUpdate={() => {
   utils.qc.getInspectionById.invalidate();
 }} />
 </TabsContent>

 <TabsContent value="photos">
 <QCPhotoGallery inspectionId={id} photos={inspection.qc_photos || []} onUpdate={() => {
   utils.qc.getInspectionById.invalidate();
 }} />
 </TabsContent>

 <TabsContent value="checkpoints">
 <QCCheckpointsList inspectionId={id} onUpdate={() => {
   utils.qc.getInspectionById.invalidate();
 }} />
 </TabsContent>
 </Tabs>
 </div>
 );
}
