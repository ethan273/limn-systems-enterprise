"use client";

import React, { use, useState } from "react";
import { useRouter } from "next/navigation";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue
} from "@/components/ui/select";
import {
 ArrowLeft,
 Lightbulb,
 Package,
 Briefcase,
 CheckCircle2,
 XCircle,
 Clock,
 AlertTriangle,
 Loader2,
 DollarSign,
 Factory,
 User,
 Calendar,
 TrendingUp,
 Award,
 Image as ImageIcon,
 FileText,
 MessageSquare,
 AlertCircleIcon,
 Upload,
 Target,
 GitCommit,
 Activity,
 RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { PhotoGallery } from "@/components/prototypes/PhotoGallery";
import { ProgressTracker } from "@/components/prototypes/ProgressTracker";
import { EmptyState } from "@/components/common";

// Dynamic route configuration
export const dynamic = 'force-dynamic';

interface PageProps {
 params: Promise<{
 id: string;
 }>;
}

// Status badge configuration
const statusConfig: Record<string, {
 label: string;
 className: string;
 icon: React.ElementType;
}> = {
 concept: {
 label: "Concept",
 className: "bg-primary-muted text-primary border-primary",
 icon: Lightbulb
 },
 design_review: {
 label: "Design Review",
 className: "bg-warning-muted text-warning border-warning",
 icon: Clock
 },
 design_approved: {
 label: "Design Approved",
 className: "bg-info-muted text-info border-info",
 icon: CheckCircle2
 },
 production_pending: {
 label: "Production Pending",
 className: "bg-orange-100 text-warning border-orange-300",
 icon: Clock
 },
 in_production: {
 label: "In Production",
 className: "bg-info-muted text-info border-info",
 icon: Activity
 },
 assembly_complete: {
 label: "Assembly Complete",
 className: "bg-primary text-primary border-primary",
 icon: CheckCircle2
 },
 quality_review: {
 label: "Quality Review",
 className: "bg-warning-muted text-warning border-warning",
 icon: AlertTriangle
 },
 client_review: {
 label: "Client Review",
 className: "bg-warning-muted text-warning border-warning",
 icon: MessageSquare
 },
 approved: {
 label: "Approved",
 className: "bg-success-muted text-success border-success",
 icon: CheckCircle2
 },
 rejected: {
 label: "Rejected",
 className: "bg-destructive-muted text-destructive border-destructive",
 icon: XCircle
 },
 ready_for_catalog: {
 label: "Ready for Catalog",
 className: "bg-success text-success border-success",
 icon: Award
 },
 archived: {
 label: "Archived",
 className: "badge-neutral",
 icon: Package
 }
};

// Priority badge configuration
const priorityConfig: Record<string, {
 label: string;
 className: string;
}> = {
 low: {
 label: "Low",
 className: "bg-success-muted text-success border-success"
 },
 medium: {
 label: "Medium",
 className: "bg-warning-muted text-warning border-warning"
 },
 high: {
 label: "High",
 className: "bg-destructive-muted text-destructive border-destructive"
 }
};

export default function PrototypeDetailPage({ params }: PageProps) {
  const { id } = use(params);
 const router = useRouter();
 const [feedbackText, setFeedbackText] = useState("");
 const [feedbackSource, setFeedbackSource] = useState<"client" | "designer" | "factory" | "quality" | "stakeholder">("client");

 // Get tRPC utils for cache invalidation
 const utils = api.useUtils();

 // Fetch prototype details
 const { data: prototype, isLoading: prototypeLoading, error: prototypeError } = api.prototypes.getById.useQuery({
 id: id,
 });

 // Fetch production details
 const { data: production } = api.prototypes.getProduction.useQuery(
 { prototypeId: id },
 { enabled: !!prototype }
 );

 // Fetch milestones
 const { data: milestones } = api.prototypes.getMilestones.useQuery(
 { prototypeId: id },
 { enabled: !!prototype }
 );

 // Fetch photos
 const { data: photos } = api.prototypes.getPhotos.useQuery(
 { prototypeId: id },
 { enabled: !!prototype }
 );

 // Fetch documents
 const { data: documents } = api.prototypes.getDocuments.useQuery(
 { prototypeId: id },
 { enabled: !!prototype }
 );

 // Fetch reviews
 const { data: reviews } = api.prototypes.getReviews.useQuery(
 { prototypeId: id },
 { enabled: !!prototype }
 );

 // Fetch feedback
 const { data: feedback } = api.prototypes.getFeedback.useQuery(
 { prototypeId: id },
 { enabled: !!prototype }
 );

 // Fetch revisions
 const { data: revisions } = api.prototypes.getRevisions.useQuery(
 { prototypeId: id },
 { enabled: !!prototype }
 );

 // Mutations
 const submitFeedbackMutation = api.prototypes.submitFeedback.useMutation({
 onSuccess: () => {
 toast({
 title: "Feedback Submitted",
 description: "Your feedback has been submitted successfully.",
 });
 setFeedbackText("");
 // Invalidate queries for instant updates
 utils.prototypes.getFeedback.invalidate();
 },
 onError: (error) => {
 toast({
 title: "Error",
 description: error.message || "Failed to submit feedback",
 variant: "destructive",
 });
 },
 });

 const handleBack = () => {
 router.push("/prototypes");
 };

 const handleSubmitFeedback = (e: React.FormEvent) => {
 e.preventDefault();
 if (!feedbackText.trim()) return;

 submitFeedbackMutation.mutate({
 prototypeId: id,
 feedbackText: feedbackText.trim(),
 feedbackSource,
 });
 };

 // Handle query error
 if (prototypeError) {
 return (
 <div className="container mx-auto p-6">
 <div className="flex items-center gap-4 mb-6">
 <Button variant="ghost" size="sm" onClick={handleBack}>
 <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
 Back
 </Button>
 <div>
 <h1 className="text-3xl font-bold">Prototype Details</h1>
 <p className="text-muted-foreground">View prototype information</p>
 </div>
 </div>
 <EmptyState
 icon={AlertTriangle}
 title="Failed to load prototype"
 description={prototypeError.message || "An unexpected error occurred. Please try again."}
 action={{
 label: 'Try Again',
 onClick: () => utils.prototypes.getById.invalidate(),
 icon: RefreshCw,
 }}
 />
 </div>
 );
 }

 if (prototypeLoading) {
 return (
 <div className="flex items-center justify-center min-h-screen">
 <Loader2 className="w-8 h-8 animate-spin text-primary" aria-hidden="true" />
 <span className="ml-3 text-muted-foreground">Loading prototype...</span>
 </div>
 );
 }

 if (!prototype) {
 return (
 <div className="flex flex-col items-center justify-center min-h-screen">
 <XCircle className="w-16 h-16 text-destructive mb-4" aria-hidden="true" />
 <h2 className="text-2xl font-bold mb-2">Prototype Not Found</h2>
 <p className="text-muted-foreground mb-4">The requested prototype could not be found.</p>
 <Button onClick={handleBack}>
 <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
 Back to Prototypes
 </Button>
 </div>
 );
 }

 const config = statusConfig[prototype.status] || statusConfig.concept;
 const StatusIcon = config.icon;
 const priorityConf = priorityConfig[prototype.priority] || priorityConfig.medium;

 return (
 <div className="container mx-auto p-6 space-y-6">
 <Breadcrumb />
 {/* Header */}
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-4">
 <Button variant="ghost" size="sm" onClick={handleBack}>
 <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
 Back
 </Button>
 <div>
 <h1 className="text-3xl font-bold flex items-center gap-3">
 {prototype.prototype_number}
 <Badge variant="outline" className={cn("text-sm", config.className)}>
 <StatusIcon className="w-4 h-4 mr-1" aria-hidden="true" />
 {config.label}
 </Badge>
 <Badge variant="outline" className={cn("text-sm", priorityConf.className)}>
 {priorityConf.label}
 </Badge>
 </h1>
 <p className="text-muted-foreground">{prototype.name}</p>
 </div>
 </div>
 </div>

 {/* Summary Cards */}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
 <Card>
 <CardHeader className="pb-2">
 <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
 <Activity className="w-4 h-4" aria-hidden="true" />
 Status
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className="font-semibold">{config.label}</div>
 </CardContent>
 </Card>

 <Card>
 <CardHeader className="pb-2">
 <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
 <TrendingUp className="w-4 h-4" aria-hidden="true" />
 Production Progress
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className="font-semibold text-lg">
 {production?.overall_progress || 0}%
 </div>
 </CardContent>
 </Card>

 <Card>
 <CardHeader className="pb-2">
 <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
 <Target className="w-4 h-4" aria-hidden="true" />
 Milestones Completed
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className="font-semibold text-lg">
 {milestones?.filter((m: Record<string, any>) => m.status === 'completed').length || 0} / {milestones?.length || 0}
 </div>
 </CardContent>
 </Card>

 <Card>
 <CardHeader className="pb-2">
 <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
 <ImageIcon className="w-4 h-4" aria-hidden="true" />
 Photos
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className="font-semibold text-lg">
 {photos?.length || 0}
 </div>
 </CardContent>
 </Card>
 </div>

 {/* Tabs */}
 <Tabs defaultValue="overview" className="space-y-4">
 <TabsList className="grid grid-cols-8 w-full">
 <TabsTrigger value="overview">Overview</TabsTrigger>
 <TabsTrigger value="production">Production</TabsTrigger>
 <TabsTrigger value="milestones">Milestones</TabsTrigger>
 <TabsTrigger value="photos">Photos</TabsTrigger>
 <TabsTrigger value="documents">Documents</TabsTrigger>
 <TabsTrigger value="reviews">Reviews</TabsTrigger>
 <TabsTrigger value="feedback">Feedback</TabsTrigger>
 <TabsTrigger value="revisions">Revisions</TabsTrigger>
 </TabsList>

 {/* Overview Tab */}
 <TabsContent value="overview" className="space-y-4">
 <Card>
 <CardHeader>
 <CardTitle>Prototype Details</CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 {/* Projects */}
 <div className="grid grid-cols-2 gap-4">
 <div>
 <Label className="text-muted-foreground flex items-center gap-2">
 <Lightbulb className="w-4 h-4" aria-hidden="true" />
 Design Project
 </Label>
 <p className="font-medium">
 {prototype.design_projects?.project_name || "—"}
 </p>
 </div>
 <div>
 <Label className="text-muted-foreground flex items-center gap-2">
 <Briefcase className="w-4 h-4" aria-hidden="true" />
 CRM Project
 </Label>
 <p className="font-medium">
 {prototype.projects?.name || "—"}
 </p>
 </div>
 </div>

 {/* Base Item */}
 {prototype.items && (
 <div>
 <Label className="text-muted-foreground flex items-center gap-2">
 <Package className="w-4 h-4" aria-hidden="true" />
 Base Item
 </Label>
 <p className="font-medium">
 {prototype.items.name} {prototype.items.sku_full ? `(${prototype.items.sku_full})` : ''}
 </p>
 </div>
 )}

 {/* Type */}
 <div>
 <Label className="text-muted-foreground">Type</Label>
 <p className="font-medium capitalize">
 {prototype.prototype_type.replace('_', ' ')}
 </p>
 </div>

 {/* Description */}
 {prototype.description && (
 <div>
 <Label className="text-muted-foreground">Description</Label>
 <p className="mt-1">{prototype.description}</p>
 </div>
 )}

 {/* Flags */}
 <div className="flex gap-4">
 {prototype.is_client_specific && (
 <Badge variant="outline">Client Specific</Badge>
 )}
 {prototype.is_catalog_candidate && (
 <Badge variant="outline" className="bg-success-muted text-success border-success">
 Catalog Candidate
 </Badge>
 )}
 </div>

 {/* Pricing */}
 {(prototype.target_price_usd || prototype.target_cost_usd) && (
 <div className="grid grid-cols-2 gap-4">
 {prototype.target_price_usd && (
 <div>
 <Label className="text-muted-foreground flex items-center gap-2">
 <DollarSign className="w-4 h-4" aria-hidden="true" />
 Target Price
 </Label>
 <p className="font-medium">
 ${Number(prototype.target_price_usd).toFixed(2)} USD
 </p>
 </div>
 )}
 {prototype.target_cost_usd && (
 <div>
 <Label className="text-muted-foreground flex items-center gap-2">
 <DollarSign className="w-4 h-4" aria-hidden="true" />
 Target Cost
 </Label>
 <p className="font-medium">
 ${Number(prototype.target_cost_usd).toFixed(2)} USD
 </p>
 </div>
 )}
 </div>
 )}

 {/* Notes */}
 {prototype.notes && (
 <div>
 <Label className="text-muted-foreground">Notes</Label>
 <p className="mt-1 text-sm">{prototype.notes}</p>
 </div>
 )}

 {/* Tags */}
 {prototype.tags && Array.isArray(prototype.tags) && prototype.tags.length > 0 && (
 <div>
 <Label className="text-muted-foreground">Tags</Label>
 <div className="flex flex-wrap gap-2 mt-2">
 {prototype.tags.map((tag: string) => (
 <Badge key={tag} variant="secondary">{tag}</Badge>
 ))}
 </div>
 </div>
 )}
 </CardContent>
 </Card>
 </TabsContent>

 {/* Production Tab */}
 <TabsContent value="production" className="space-y-4">
 {production ? (
 <>
 <ProgressTracker
 prototypeId={id}
 production={production}
 onUpdate={() => {
   utils.prototypes.getProduction.invalidate();
 }}
 />

 <Card>
 <CardHeader>
 <CardTitle>Production Status</CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="grid grid-cols-2 gap-4">
 <div>
 <Label className="text-muted-foreground flex items-center gap-2">
 <Factory className="w-4 h-4" aria-hidden="true" />
 Factory
 </Label>
 <p className="font-medium">
 {production.partners?.company_name || "—"}
 </p>
 </div>
 <div>
 <Label className="text-muted-foreground flex items-center gap-2">
 <User className="w-4 h-4" aria-hidden="true" />
 Production Manager
 </Label>
 <p className="font-medium">
 {production.users?.email || "—"}
 </p>
 </div>
 </div>

 <div>
 <Label className="text-muted-foreground">Overall Progress</Label>
 <div className="flex items-center gap-3 mt-2">
 <Progress value={production.overall_progress || 0} className="flex-1" />
 <span className="font-medium">{production.overall_progress || 0}%</span>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <Label className="text-muted-foreground flex items-center gap-2">
 <Calendar className="w-4 h-4" aria-hidden="true" />
 Start Date
 </Label>
 <p className="font-medium">
 {production.start_date
 ? format(new Date(production.start_date), "MMM d, yyyy")
 : "—"}
 </p>
 </div>
 <div>
 <Label className="text-muted-foreground flex items-center gap-2">
 <Calendar className="w-4 h-4" aria-hidden="true" />
 Target Date
 </Label>
 <p className="font-medium">
 {production.target_date
 ? format(new Date(production.target_date), "MMM d, yyyy")
 : "—"}
 </p>
 </div>
 </div>

 {production.estimated_completion && (
 <div>
 <Label className="text-muted-foreground">Estimated Completion</Label>
 <p className="font-medium">
 {format(new Date(production.estimated_completion), "MMM d, yyyy")}
 </p>
 </div>
 )}

 {production.actual_completion && (
 <div>
 <Label className="text-muted-foreground">Actual Completion</Label>
 <p className="font-medium">
 {format(new Date(production.actual_completion), "MMM d, yyyy")}
 </p>
 </div>
 )}
 </CardContent>
 </Card>

 <Card>
 <CardHeader>
 <CardTitle>Cost Tracking</CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="grid grid-cols-2 gap-4">
 {production.estimated_cost && (
 <div>
 <Label className="text-muted-foreground">Estimated Cost</Label>
 <p className="font-medium text-lg">
 ${Number(production.estimated_cost).toFixed(2)} USD
 </p>
 </div>
 )}
 {production.actual_cost && (
 <div>
 <Label className="text-muted-foreground">Actual Cost</Label>
 <p className="font-medium text-lg">
 ${Number(production.actual_cost).toFixed(2)} USD
 </p>
 </div>
 )}
 </div>
 </CardContent>
 </Card>

 <Card>
 <CardHeader>
 <CardTitle>Quality Metrics</CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="grid grid-cols-3 gap-4">
 {production.quality_score !== null && (
 <div>
 <Label className="text-muted-foreground">Quality Score</Label>
 <p className="font-medium text-lg">{production.quality_score}/100</p>
 </div>
 )}
 {production.defects_found !== null && (
 <div>
 <Label className="text-muted-foreground">Defects Found</Label>
 <p className="font-medium text-lg">{production.defects_found}</p>
 </div>
 )}
 <div>
 <Label className="text-muted-foreground">Rework Required</Label>
 <p className="font-medium text-lg">
 {production.rework_required ? "Yes" : "No"}
 </p>
 </div>
 </div>
 </CardContent>
 </Card>
 </>
 ) : (
 <Card>
 <CardContent className="p-12">
 <div className="text-center text-muted-foreground">
 <Factory className="w-12 h-12 mx-auto mb-2 opacity-50" aria-hidden="true" />
 <p className="text-sm">No production data available</p>
 </div>
 </CardContent>
 </Card>
 )}
 </TabsContent>

 {/* Milestones Tab */}
 <TabsContent value="milestones" className="space-y-4">
 {milestones && milestones.length > 0 ? (
 <div className="space-y-4">
 {milestones.map((milestone) => (
 <Card key={milestone.id}>
 <CardHeader>
 <div className="flex items-center justify-between">
 <CardTitle className="text-lg">{milestone.milestone_name}</CardTitle>
 <Badge
 variant="outline"
 className={cn(
 milestone.status === 'completed' && "bg-success-muted text-success border-success",
 milestone.status === 'in_progress' && "bg-info-muted text-info border-info",
 milestone.status === 'blocked' && "bg-destructive-muted text-destructive border-destructive",
 milestone.status === 'pending' && "badge-neutral"
 )}
 >
 {milestone.status}
 </Badge>
 </div>
 </CardHeader>
 <CardContent className="space-y-4">
 <div>
 <Label className="text-muted-foreground">Progress</Label>
 <div className="flex items-center gap-3 mt-2">
 <Progress value={milestone.completion_percentage} className="flex-1" />
 <span className="font-medium">{milestone.completion_percentage}%</span>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 {milestone.planned_start && (
 <div>
 <Label className="text-muted-foreground">Planned Start</Label>
 <p>{format(new Date(milestone.planned_start), "MMM d, yyyy")}</p>
 </div>
 )}
 {milestone.planned_end && (
 <div>
 <Label className="text-muted-foreground">Planned End</Label>
 <p>{format(new Date(milestone.planned_end), "MMM d, yyyy")}</p>
 </div>
 )}
 </div>

 {(milestone.actual_start || milestone.actual_end) && (
 <div className="grid grid-cols-2 gap-4">
 {milestone.actual_start && (
 <div>
 <Label className="text-muted-foreground">Actual Start</Label>
 <p>{format(new Date(milestone.actual_start), "MMM d, yyyy")}</p>
 </div>
 )}
 {milestone.actual_end && (
 <div>
 <Label className="text-muted-foreground">Actual End</Label>
 <p>{format(new Date(milestone.actual_end), "MMM d, yyyy")}</p>
 </div>
 )}
 </div>
 )}

 {milestone.users_prototype_milestones_assigned_toTousers && (
 <div>
 <Label className="text-muted-foreground">Assigned To</Label>
 <p>{milestone.users_prototype_milestones_assigned_toTousers.email || "—"}</p>
 </div>
 )}
 </CardContent>
 </Card>
 ))}
 </div>
 ) : (
 <Card>
 <CardContent className="p-12">
 <div className="text-center text-muted-foreground">
 <Target className="w-12 h-12 mx-auto mb-2 opacity-50" aria-hidden="true" />
 <p className="text-sm">No milestones available</p>
 </div>
 </CardContent>
 </Card>
 )}
 </TabsContent>

 {/* Photos Tab */}
 <TabsContent value="photos" className="space-y-4">
 <PhotoGallery prototypeId={id} />
 </TabsContent>

 {/* Documents Tab */}
 <TabsContent value="documents" className="space-y-4">
 {documents && documents.length > 0 ? (
 <div className="space-y-2">
 {documents.map((doc) => (
 <Card key={doc.id}>
 <CardContent className="p-4">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <FileText className="w-8 h-8 text-muted-foreground" aria-hidden="true" />
 <div>
 <p className="font-medium">{doc.title}</p>
 <div className="flex items-center gap-2 text-sm text-muted-foreground">
 <Badge variant="outline" className="text-xs">
 {doc.document_type}
 </Badge>
 {doc.version && <span>v{doc.version}</span>}
 <Badge
 variant="outline"
 className={cn(
 "text-xs",
 doc.status === 'approved' && "bg-success-muted text-success border-success",
 doc.status === 'under_review' && "bg-warning-muted text-warning border-warning"
 )}
 >
 {doc.status}
 </Badge>
 </div>
 </div>
 </div>
 <Button variant="outline" size="sm" asChild>
 <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
 View
 </a>
 </Button>
 </div>
 </CardContent>
 </Card>
 ))}
 </div>
 ) : (
 <Card>
 <CardContent className="p-12">
 <div className="text-center text-muted-foreground">
 <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" aria-hidden="true" />
 <p className="text-sm">No documents available</p>
 <Button variant="outline" className="mt-4">
 <Upload className="w-4 h-4 mr-2" aria-hidden="true" />
 Upload Document
 </Button>
 </div>
 </CardContent>
 </Card>
 )}
 </TabsContent>

 {/* Reviews Tab */}
 <TabsContent value="reviews" className="space-y-4">
 {reviews && reviews.length > 0 ? (
 <div className="space-y-4">
 {reviews.map((review) => (
 <Card key={review.id}>
 <CardHeader>
 <div className="flex items-center justify-between">
 <CardTitle className="text-lg capitalize">
 {review.review_type.replace('_', ' ')}
 </CardTitle>
 <Badge
 variant="outline"
 className={cn(
 review.status === 'completed' && "bg-success-muted text-success border-success",
 review.status === 'in_progress' && "bg-info-muted text-info border-info",
 review.status === 'scheduled' && "bg-warning-muted text-warning border-warning"
 )}
 >
 {review.status}
 </Badge>
 </div>
 </CardHeader>
 <CardContent className="space-y-2">
 <div className="flex items-center gap-2 text-sm">
 <Calendar className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
 <span>Review Date: {format(new Date(review.review_date), "MMM d, yyyy")}</span>
 </div>
 {review.status === 'completed' && (
 <div className="flex items-center gap-2 text-sm">
 <CheckCircle2 className="w-4 h-4 text-success" aria-hidden="true" />
 <span>Completed</span>
 </div>
 )}
 <div className="flex items-center gap-2 text-sm text-muted-foreground">
 <AlertCircleIcon className="w-4 h-4" aria-hidden="true" />
 <span>{review.prototype_review_actions?.length || 0} Action Items</span>
 </div>
 </CardContent>
 </Card>
 ))}
 </div>
 ) : (
 <Card>
 <CardContent className="p-12">
 <div className="text-center text-muted-foreground">
 <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" aria-hidden="true" />
 <p className="text-sm">No reviews available</p>
 </div>
 </CardContent>
 </Card>
 )}
 </TabsContent>

 {/* Feedback Tab */}
 <TabsContent value="feedback" className="space-y-4">
 {/* Submit Feedback Form */}
 <Card>
 <CardHeader>
 <CardTitle className="text-lg">Submit Feedback</CardTitle>
 </CardHeader>
 <CardContent>
 <form onSubmit={handleSubmitFeedback} className="space-y-4">
 <div className="space-y-2">
 <Label htmlFor="feedback-source">Feedback Source</Label>
 <Select
 value={feedbackSource}
 onValueChange={(value) => setFeedbackSource(value as typeof feedbackSource)}
 >
 <SelectTrigger id="feedback-source">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="client">Client</SelectItem>
 <SelectItem value="designer">Designer</SelectItem>
 <SelectItem value="factory">Factory</SelectItem>
 <SelectItem value="quality">Quality</SelectItem>
 <SelectItem value="stakeholder">Stakeholder</SelectItem>
 </SelectContent>
 </Select>
 </div>

 <div className="space-y-2">
 <Label htmlFor="feedback-text">Feedback</Label>
 <Textarea
 id="feedback-text"
 placeholder="Enter your feedback..."
 value={feedbackText}
 onChange={(e) => setFeedbackText(e.target.value)}
 rows={4}
 />
 </div>

 <Button
 type="submit"
 disabled={!feedbackText.trim() || submitFeedbackMutation.isPending}
 >
 {submitFeedbackMutation.isPending ? (
 <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
 ) : (
 <MessageSquare className="w-4 h-4 mr-2" aria-hidden="true" />
 )}
 Submit Feedback
 </Button>
 </form>
 </CardContent>
 </Card>

 {/* Feedback List */}
 {feedback && feedback.length > 0 ? (
 <div className="space-y-2">
 {feedback.map((item) => (
 <Card key={item.id}>
 <CardContent className="p-4">
 <div className="space-y-2">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <Badge variant="outline" className="text-xs">
 {item.feedback_source}
 </Badge>
 {item.sentiment && (
 <Badge
 variant="outline"
 className={cn(
 "text-xs",
 item.sentiment === 'positive' && "bg-success-muted text-success border-success",
 item.sentiment === 'negative' && "bg-destructive-muted text-destructive border-destructive",
 item.sentiment === 'critical' && "bg-destructive-muted text-destructive border-destructive"
 )}
 >
 {item.sentiment}
 </Badge>
 )}
 <Badge variant="outline" className="text-xs">
 {item.status}
 </Badge>
 </div>
 <span className="text-xs text-muted-foreground">
 {format(new Date(item.submitted_at), "MMM d, yyyy")}
 </span>
 </div>
 <p className="text-sm">{item.feedback_text}</p>
 <p className="text-xs text-muted-foreground">
 By {item.users_prototype_feedback_submitted_byTousers?.email || "Unknown"}
 </p>
 </div>
 </CardContent>
 </Card>
 ))}
 </div>
 ) : (
 <Card>
 <CardContent className="p-12">
 <div className="text-center text-muted-foreground">
 <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" aria-hidden="true" />
 <p className="text-sm">No feedback yet. Be the first to submit!</p>
 </div>
 </CardContent>
 </Card>
 )}
 </TabsContent>

 {/* Revisions Tab */}
 <TabsContent value="revisions" className="space-y-4">
 {revisions && revisions.length > 0 ? (
 <div className="space-y-4">
 {revisions.map((revision) => (
 <Card key={revision.id}>
 <CardHeader>
 <div className="flex items-center justify-between">
 <CardTitle className="text-lg">
 Revision #{revision.revision_number}
 </CardTitle>
 <Badge
 variant="outline"
 className={cn(
 revision.approved_at && "bg-success-muted text-success border-success",
 !revision.approved_at && "bg-warning-muted text-warning border-warning",
 false && "bg-destructive-muted text-destructive border-destructive"
 )}
 >
 {revision.approved_at ? "Approved" : "Pending"}
 </Badge>
 </div>
 </CardHeader>
 <CardContent className="space-y-2">
 <div>
 <Badge variant="outline" className="text-xs capitalize">
 {revision.revision_type.replace('_', ' ')}
 </Badge>
 </div>
 <p className="text-sm">{revision.description}</p>
 {(revision.cost_impact || revision.timeline_impact_days) && (
 <div className="flex gap-4 text-sm">
 {revision.cost_impact && (
 <div className="flex items-center gap-1">
 <DollarSign className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
 <span>Cost Impact: ${Number(revision.cost_impact).toFixed(2)}</span>
 </div>
 )}
 {revision.timeline_impact_days && (
 <div className="flex items-center gap-1">
 <Calendar className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
 <span>Timeline Impact: {revision.timeline_impact_days} days</span>
 </div>
 )}
 </div>
 )}
 <p className="text-xs text-muted-foreground">
 Created: {format(new Date(revision.created_at), "MMM d, yyyy")}
 </p>
 </CardContent>
 </Card>
 ))}
 </div>
 ) : (
 <Card>
 <CardContent className="p-12">
 <div className="text-center text-muted-foreground">
 <GitCommit className="w-12 h-12 mx-auto mb-2 opacity-50" aria-hidden="true" />
 <p className="text-sm">No revisions available</p>
 </div>
 </CardContent>
 </Card>
 )}
 </TabsContent>
 </Tabs>
 </div>
 );
}
