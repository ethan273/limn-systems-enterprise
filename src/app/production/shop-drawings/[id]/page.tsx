"use client";

import React, { use, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue
} from "@/components/ui/select";
import { CommentCard } from "@/components/shop-drawings/CommentCard";
import { VersionTimeline } from "@/components/shop-drawings/VersionTimeline";
import { ApprovalStatus } from "@/components/shop-drawings/ApprovalStatus";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// Dynamically import PDF viewer to reduce initial bundle size
const PDFViewer = dynamic(
  () => import("@/components/shop-drawings/PDFViewer").then((mod) => mod.PDFViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    ),
  }
);
import {
 ArrowLeft,
 FileText,
 Package,
 Building2,
 CheckCircle2,
 XCircle,
 Clock,
 AlertTriangle,
 MessageSquare,
 ThumbsUp,
 ThumbsDown,
 GitCommit,
 Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

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
 in_review: {
 label: "In Review",
 className: "bg-warning-muted text-warning border-warning",
 icon: Clock
 },
 designer_approved: {
 label: "Designer Approved",
 className: "bg-info-muted text-info border-info",
 icon: CheckCircle2
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
 revision_requested: {
 label: "Revision Requested",
 className: "bg-orange-100 text-warning border-orange-300",
 icon: AlertTriangle
 }
};

export default function ShopDrawingDetailPage({ params }: PageProps) {
  const { id } = use(params);
 const router = useRouter();
 const [currentPage, setCurrentPage] = useState(1);
 const [commentText, setCommentText] = useState("");
 const [commentType, setCommentType] = useState<"review" | "question" | "change_request" | "approval" | "general">("general");
 const [approvalDecision, setApprovalDecision] = useState<"approved" | "rejected" | "changes_requested">("approved");
 const [approvalComments, setApprovalComments] = useState("");

 // Fetch drawing details
 const { data: drawing, isLoading: drawingLoading } = api.shopDrawings.getById.useQuery({
 id: id,
 });

 // Fetch versions
 const { data: versions } = api.shopDrawings.getVersionHistory.useQuery({
 shopDrawingId: id,
 });

 // Get current version ID
 const currentVersionId = drawing?.shop_drawing_versions?.[0]?.id ?? "";

 // Get tRPC utils for cache invalidation
 const utils = api.useUtils();

 // Fetch comments for current version
 const { data: comments } = api.shopDrawings.getComments.useQuery(
 {
 drawingVersionId: currentVersionId,
 },
 {
 enabled: !!currentVersionId,
 }
 );

 // Fetch approval status
 const { data: approvalStatus } = api.shopDrawings.getApprovalStatus.useQuery({
 shopDrawingId: id,
 });

 // Fetch activity log
 const { data: activityLog } = api.shopDrawings.getActivityLog.useQuery({
 shopDrawingId: id,
 });

 // Mutations
 const addCommentMutation = api.shopDrawings.addComment.useMutation({
 onSuccess: () => {
 toast({
 title: "Comment Added",
 description: "Your comment has been added successfully.",
 });
 setCommentText("");
 // Invalidate queries for instant updates
 utils.shopDrawings.getComments.invalidate();
 },
 onError: (error) => {
 toast({
 title: "Error",
 description: error.message || "Failed to add comment",
 variant: "destructive",
 });
 },
 });

 const resolveCommentMutation = api.shopDrawings.resolveComment.useMutation({
 onSuccess: () => {
 toast({
 title: "Comment Resolved",
 description: "The comment has been marked as resolved.",
 });
 // Invalidate queries for instant updates
 utils.shopDrawings.getComments.invalidate();
 },
 onError: (error) => {
 toast({
 title: "Error",
 description: error.message || "Failed to resolve comment",
 variant: "destructive",
 });
 },
 });

 const approveVersionMutation = api.shopDrawings.approveVersion.useMutation({
 onSuccess: (data) => {
 toast({
 title: "Approval Submitted",
 description: data.message,
 });
 setApprovalComments("");
 // Invalidate queries for instant updates
 utils.shopDrawings.getApprovalStatus.invalidate();
 utils.shopDrawings.getById.invalidate();
 },
 onError: (error) => {
 toast({
 title: "Error",
 description: error.message || "Failed to submit approval",
 variant: "destructive",
 });
 },
 });

 const handleBack = () => {
 router.push("/shop-drawings");
 };

 const handleAddComment = (e: React.FormEvent) => {
 e.preventDefault();
 if (!commentText.trim() || !currentVersionId) return;

 addCommentMutation.mutate({
 drawingVersionId: currentVersionId,
 commentText: commentText.trim(),
 commentType,
 });
 };

 const handleResolveComment = (commentId: string) => {
 resolveCommentMutation.mutate({
 commentId,
 });
 };

 const handleApprovalSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 if (!currentVersionId) return;

 approveVersionMutation.mutate({
 drawingVersionId: currentVersionId,
 decision: approvalDecision,
 comments: approvalComments.trim() || undefined,
 });
 };

 if (drawingLoading) {
 return (
 <div className="flex items-center justify-center min-h-screen">
 <Loader2 className="w-8 h-8 animate-spin text-primary" aria-hidden="true" />
 <span className="ml-3 text-muted-foreground">Loading shop drawing...</span>
 </div>
 );
 }

 if (!drawing) {
 return (
 <div className="flex flex-col items-center justify-center min-h-screen">
 <XCircle className="w-16 h-16 text-destructive mb-4" aria-hidden="true" />
 <h2 className="text-2xl font-bold mb-2">Shop Drawing Not Found</h2>
 <p className="text-muted-foreground mb-4">The requested shop drawing could not be found.</p>
 <Button onClick={handleBack}>
 <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
 Back to Shop Drawings
 </Button>
 </div>
 );
 }

 const config = statusConfig[drawing.status] || statusConfig.in_review;
 const StatusIcon = config.icon;
 const currentVersion = drawing.shop_drawing_versions?.[0];
 const fileUrl = currentVersion?.file_url ?? "";

 return (
 <div className="container mx-auto p-6 space-y-6">
 {/* Header */}
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-4">
 <Button variant="ghost" size="sm" onClick={handleBack}>
 <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
 Back
 </Button>
 <div>
 <h1 className="text-3xl font-bold flex items-center gap-3">
 {drawing.drawing_number}
 <Badge variant="outline" className={cn("text-sm", config.className)}>
 <StatusIcon className="w-4 h-4 mr-1" aria-hidden="true" />
 {config.label}
 </Badge>
 </h1>
 <p className="text-muted-foreground">{drawing.drawing_name}</p>
 </div>
 </div>
 </div>

 {/* Quick Info Cards */}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
 <Card>
 <CardHeader className="pb-2">
 <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
 <Package className="w-4 h-4" aria-hidden="true" />
 Production Order
 </CardTitle>
 </CardHeader>
 <CardContent>
 {drawing.production_orders ? (
 <>
 <div className="font-semibold">{drawing.production_orders.order_number}</div>
 <div className="text-sm text-muted-foreground">{drawing.production_orders.item_name}</div>
 </>
 ) : (
 <span className="text-muted-foreground">—</span>
 )}
 </CardContent>
 </Card>

 <Card>
 <CardHeader className="pb-2">
 <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
 <Building2 className="w-4 h-4" aria-hidden="true" />
 Factory
 </CardTitle>
 </CardHeader>
 <CardContent>
 {drawing.partners ? (
 <div className="font-semibold">{drawing.partners.company_name}</div>
 ) : (
 <span className="text-muted-foreground">—</span>
 )}
 </CardContent>
 </Card>

 <Card>
 <CardHeader className="pb-2">
 <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
 <GitCommit className="w-4 h-4" aria-hidden="true" />
 Current Version
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className="font-semibold font-mono text-lg">v{drawing.current_version}</div>
 {currentVersion && (
 <div className="text-xs text-muted-foreground">
 {format(new Date(currentVersion.uploaded_at), "MMM d, yyyy")}
 </div>
 )}
 </CardContent>
 </Card>

 <Card>
 <CardHeader className="pb-2">
 <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
 <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
 Approval Status
 </CardTitle>
 </CardHeader>
 <CardContent>
 {approvalStatus?.finalApproved ? (
 <div className="font-semibold text-success">Fully Approved</div>
 ) : approvalStatus?.limnApproved && approvalStatus?.designerApproved ? (
 <div className="font-semibold text-success">Fully Approved</div>
 ) : approvalStatus?.limnApproved || approvalStatus?.designerApproved ? (
 <div className="font-semibold text-info">Partially Approved</div>
 ) : (
 <div className="font-semibold text-warning">Pending</div>
 )}
 </CardContent>
 </Card>
 </div>

 {/* Tabs */}
 <Tabs defaultValue="pdf" className="space-y-4">
 <TabsList className="grid grid-cols-5 w-full max-w-3xl">
 <TabsTrigger value="pdf" className="flex items-center gap-2">
 <FileText className="w-4 h-4" aria-hidden="true" />
 PDF
 </TabsTrigger>
 <TabsTrigger value="comments" className="flex items-center gap-2">
 <MessageSquare className="w-4 h-4" aria-hidden="true" />
 Comments
 </TabsTrigger>
 <TabsTrigger value="versions" className="flex items-center gap-2">
 <GitCommit className="w-4 h-4" aria-hidden="true" />
 Versions
 </TabsTrigger>
 <TabsTrigger value="approvals" className="flex items-center gap-2">
 <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
 Approvals
 </TabsTrigger>
 <TabsTrigger value="activity" className="flex items-center gap-2">
 <Activity className="w-4 h-4" aria-hidden="true" />
 Activity
 </TabsTrigger>
 </TabsList>

 {/* PDF Tab */}
 <TabsContent value="pdf" className="space-y-4">
 <Card className="h-[800px]">
 {fileUrl ? (
 <PDFViewer
 fileUrl={fileUrl}
 onPageChange={setCurrentPage}
 initialPage={currentPage}
 />
 ) : (
 <div className="flex items-center justify-center h-full">
 <div className="text-center">
 <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" aria-hidden="true" />
 <p className="text-muted-foreground">No PDF file available</p>
 </div>
 </div>
 )}
 </Card>
 </TabsContent>

 {/* Comments Tab */}
 <TabsContent value="comments" className="space-y-4">
 {/* Add Comment Form */}
 <Card>
 <CardHeader>
 <CardTitle className="text-lg">Add Comment</CardTitle>
 </CardHeader>
 <CardContent>
 <form onSubmit={handleAddComment} className="space-y-4">
 <div className="space-y-2">
 <Label htmlFor="comment-type">Comment Type</Label>
 <Select value={commentType} onValueChange={(value) => setCommentType(value as typeof commentType)}>
 <SelectTrigger id="comment-type">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="general">General</SelectItem>
 <SelectItem value="review">Review</SelectItem>
 <SelectItem value="question">Question</SelectItem>
 <SelectItem value="change_request">Change Request</SelectItem>
 <SelectItem value="approval">Approval</SelectItem>
 </SelectContent>
 </Select>
 </div>

 <div className="space-y-2">
 <Label htmlFor="comment-text">Comment</Label>
 <Textarea
 id="comment-text"
 placeholder="Add your comment..."
 value={commentText}
 onChange={(e) => setCommentText(e.target.value)}
 rows={4}
 />
 </div>

 <Button type="submit" disabled={!commentText.trim() || addCommentMutation.isPending}>
 {addCommentMutation.isPending ? (
 <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
 ) : (
 <MessageSquare className="w-4 h-4 mr-2" aria-hidden="true" />
 )}
 Add Comment
 </Button>
 </form>
 </CardContent>
 </Card>

 {/* Comments List */}
 <div className="space-y-4">
 {comments && comments.length > 0 ? (
 comments.map((comment) => (
 <CommentCard
 key={comment.id}
 comment={{
 id: comment.id,
 text: comment.comment_text,
 author: {
 id: comment.author_id,
 name: comment.users_shop_drawing_comments_author_idTousers.email ?? "Unknown User",
 },
 createdAt: new Date(comment.created_at),
 type: comment.comment_type === "review" ? "question" :
 comment.comment_type === "change_request" ? "issue" :
 comment.comment_type === "approval" ? "approval" : "general",
 status: comment.status === "resolved" ? "resolved" : "open",
 resolvedAt: comment.resolved_at ? new Date(comment.resolved_at) : null,
 resolvedBy: comment.users_shop_drawing_comments_resolved_byTousers ? {
 id: comment.resolved_by ?? "",
 name: comment.users_shop_drawing_comments_resolved_byTousers.email ?? "Unknown User",
 } : null,
 replies: comment.other_shop_drawing_comments?.map((reply) => ({
 id: reply.id,
 text: reply.comment_text,
 author: {
 id: reply.author_id,
 name: reply.users_shop_drawing_comments_author_idTousers.email ?? "Unknown User",
 },
 createdAt: new Date(reply.created_at),
 type: "general" as const,
 status: reply.status === "resolved" ? "resolved" as const : "open" as const,
 })),
 }}
 onResolve={handleResolveComment}
 />
 ))
 ) : (
 <Card>
 <CardContent className="p-12">
 <div className="text-center text-muted-foreground">
 <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" aria-hidden="true" />
 <p className="text-sm">No comments yet. Be the first to add one!</p>
 </div>
 </CardContent>
 </Card>
 )}
 </div>
 </TabsContent>

 {/* Versions Tab */}
 <TabsContent value="versions" className="space-y-4">
 {versions && versions.length > 0 ? (
 <VersionTimeline
 versions={versions.map((v) => ({
 id: v.id,
 versionNumber: String(v.version_number),
 fileName: v.file_name,
 fileSize: Number(v.file_size),
 uploadedAt: new Date(v.uploaded_at),
 uploadedBy: {
 id: v.uploaded_by,
 name: v.users.email ?? "Unknown User",
 },
 status: v.status as "current" | "superseded" | "archived",
 notes: v.upload_notes,
 }))}
 />
 ) : (
 <Card>
 <CardContent className="p-12">
 <div className="text-center text-muted-foreground">
 <GitCommit className="w-12 h-12 mx-auto mb-2 opacity-50" aria-hidden="true" />
 <p className="text-sm">No version history available</p>
 </div>
 </CardContent>
 </Card>
 )}
 </TabsContent>

 {/* Approvals Tab */}
 <TabsContent value="approvals" className="space-y-4">
 {/* Approval Form */}
 <Card>
 <CardHeader>
 <CardTitle className="text-lg">Submit Approval</CardTitle>
 </CardHeader>
 <CardContent>
 <form onSubmit={handleApprovalSubmit} className="space-y-4">
 <div className="space-y-2">
 <Label htmlFor="approval-decision">Decision</Label>
 <Select value={approvalDecision} onValueChange={(value) => setApprovalDecision(value as typeof approvalDecision)}>
 <SelectTrigger id="approval-decision">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="approved">
 <div className="flex items-center gap-2">
 <ThumbsUp className="w-4 h-4 text-success" aria-hidden="true" />
 Approve
 </div>
 </SelectItem>
 <SelectItem value="changes_requested">
 <div className="flex items-center gap-2">
 <AlertTriangle className="w-4 h-4 text-warning" aria-hidden="true" />
 Request Changes
 </div>
 </SelectItem>
 <SelectItem value="rejected">
 <div className="flex items-center gap-2">
 <ThumbsDown className="w-4 h-4 text-destructive" aria-hidden="true" />
 Reject
 </div>
 </SelectItem>
 </SelectContent>
 </Select>
 </div>

 <div className="space-y-2">
 <Label htmlFor="approval-comments">Comments (Optional)</Label>
 <Textarea
 id="approval-comments"
 placeholder="Add any comments or conditions..."
 value={approvalComments}
 onChange={(e) => setApprovalComments(e.target.value)}
 rows={3}
 />
 </div>

 <Button type="submit" disabled={approveVersionMutation.isPending}>
 {approveVersionMutation.isPending ? (
 <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
 ) : (
 <CheckCircle2 className="w-4 h-4 mr-2" aria-hidden="true" />
 )}
 Submit Approval
 </Button>
 </form>
 </CardContent>
 </Card>

 {/* Approval Status */}
 {approvalStatus && (
 <ApprovalStatus
 drawing={{
 id: drawing.id,
 limnApproval: {
 status: approvalStatus.limnApproved ? "approved" : "pending",
 approvedBy: approvalStatus.limnApprovedBy ? {
 id: "",
 name: approvalStatus.limnApprovedBy.email ?? "Unknown User",
 } : null,
 approvedAt: approvalStatus.limnApprovedAt ? new Date(approvalStatus.limnApprovedAt) : null,
 },
 designerApproval: {
 status: approvalStatus.designerApproved ? "approved" : "pending",
 approvedBy: approvalStatus.designerApprovedBy ? {
 id: "",
 name: approvalStatus.designerApprovedBy.email ?? "Unknown User",
 } : null,
 approvedAt: approvalStatus.designerApprovedAt ? new Date(approvalStatus.designerApprovedAt) : null,
 },
 }}
 />
 )}
 </TabsContent>

 {/* Activity Tab */}
 <TabsContent value="activity" className="space-y-4">
 {activityLog && activityLog.length > 0 ? (
 <div className="space-y-2">
 {activityLog.map((activity, index) => (
 <Card key={`activity-${index}-${activity.timestamp.toISOString()}`}>
 <CardContent className="p-4">
 <div className="flex items-start gap-4">
 <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
 <Activity className="w-4 h-4 text-primary" aria-hidden="true" />
 </div>
 <div className="flex-1">
 <div className="flex items-center justify-between">
 <p className="font-medium">{activity.description}</p>
 <time className="text-sm text-muted-foreground" dateTime={activity.timestamp.toISOString()}>
 {format(new Date(activity.timestamp), "MMM d, yyyy h:mm a")}
 </time>
 </div>
 <p className="text-sm text-muted-foreground">{activity.user}</p>
 </div>
 </div>
 </CardContent>
 </Card>
 ))}
 </div>
 ) : (
 <Card>
 <CardContent className="p-12">
 <div className="text-center text-muted-foreground">
 <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" aria-hidden="true" />
 <p className="text-sm">No activity history available</p>
 </div>
 </CardContent>
 </Card>
 )}
 </TabsContent>
 </Tabs>
 </div>
 );
}
