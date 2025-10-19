"use client";

import React, { use, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog";
import { EntityDetailHeader } from "@/components/common/EntityDetailHeader";
import { InfoCard } from "@/components/common/InfoCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingState } from "@/components/common/LoadingState";
import {
 Factory,
 Calendar,
 MapPin,
 Image as ImageIcon,
 MessageSquare,
 FileText,
 ArrowLeft,
 AlertCircle,
 AlertTriangle,
 CheckCircle,
 Edit,
 RefreshCw,
 Trash2,
 Upload,
 Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

// Dynamic route configuration
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function FactoryReviewDetailPage({ params }: PageProps) {
  const { id } = use(params);
 const router = useRouter();

 const [activeTab, setActiveTab] = useState("overview");
 const [severityFilter, setSeverityFilter] = useState<string>("all");
 const [commentDialogOpen, setCommentDialogOpen] = useState(false);
 const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
 const [commentText, setCommentText] = useState("");
 const [commentType, setCommentType] = useState("issue");
 const [isActionItem, setIsActionItem] = useState(false);
 const [statusDialogOpen, setStatusDialogOpen] = useState(false);
 const [newStatus, setNewStatus] = useState("");

 // Fetch session details
 const { data: session, isLoading, error: sessionError } = api.factoryReviews.getSessionById.useQuery({
 id: id,
 });

 // Get tRPC utils for cache invalidation
 const utils = api.useUtils();

 // Fetch action items
 const { data: actionItems, error: actionItemsError } = api.factoryReviews.getActionItems.useQuery({
 sessionId: id,
 resolved: false,
 });

 // Update session status mutation
 const updateStatusMutation = api.factoryReviews.updateSession.useMutation({
 onSuccess: () => {
 toast({
 title: "Success",
 description: "Session status updated successfully",
 });
 // Invalidate queries for instant updates
 utils.factoryReviews.getSessionById.invalidate();
 utils.factoryReviews.getAllSessions.invalidate();
 setStatusDialogOpen(false);
 },
 onError: (error) => {
 toast({
 title: "Error",
 description: error.message || "Failed to update session status",
 variant: "destructive",
 });
 },
 });

 // Add comment mutation
 const addCommentMutation = api.factoryReviews.addComment.useMutation({
 onSuccess: () => {
 toast({
 title: "Success",
 description: "Comment added successfully",
 });
 // Invalidate queries for instant updates
 utils.factoryReviews.getSessionById.invalidate();
 setCommentDialogOpen(false);
 setCommentText("");
 setSelectedPhotoId(null);
 setIsActionItem(false);
 },
 onError: (error) => {
 toast({
 title: "Error",
 description: error.message || "Failed to add comment",
 variant: "destructive",
 });
 },
 });

 // Resolve action item mutation
 const resolveActionMutation = api.factoryReviews.resolveActionItem.useMutation({
 onSuccess: () => {
 toast({
 title: "Success",
 description: "Action item resolved",
 });
 // Invalidate queries for instant updates
 utils.factoryReviews.getSessionById.invalidate();
 utils.factoryReviews.getActionItems.invalidate();
 },
 onError: (error) => {
 toast({
 title: "Error",
 description: error.message || "Failed to resolve action item",
 variant: "destructive",
 });
 },
 });

 // Delete photo mutation
 const deletePhotoMutation = api.factoryReviews.deletePhoto.useMutation({
 onSuccess: () => {
 toast({
 title: "Success",
 description: "Photo deleted successfully",
 });
 // Invalidate queries for instant updates
 utils.factoryReviews.getSessionById.invalidate();
 },
 onError: (error) => {
 toast({
 title: "Error",
 description: error.message || "Failed to delete photo",
 variant: "destructive",
 });
 },
 });

 const handleAddComment = () => {
 if (!commentText.trim()) {
 toast({
 title: "Error",
 description: "Comment text is required",
 variant: "destructive",
 });
 return;
 }

 addCommentMutation.mutate({
 sessionId: id,
 photoId: selectedPhotoId || undefined,
 commentText,
 commentType,
 authorRole: "limn_team",
 isActionItem,
 });
 };

 const handleUpdateStatus = () => {
 if (!newStatus) {
 toast({
 title: "Error",
 description: "Please select a status",
 variant: "destructive",
 });
 return;
 }

 updateStatusMutation.mutate({
 id: id,
 status: newStatus,
 });
 };

 const handleDeletePhoto = (photoId: string) => {
 if (confirm("Are you sure you want to delete this photo?")) {
 deletePhotoMutation.mutate({ id: photoId });
 }
 };

 const handleResolveAction = (commentId: string) => {
 resolveActionMutation.mutate({ commentId });
 };

 // Handle query errors
 if (sessionError || actionItemsError) {
 const error = sessionError || actionItemsError;
 return (
 <div className="page-container">
 <div className="page-header">
 <Button
 onClick={() => router.push("/production/factory-reviews")}
 variant="ghost"
 className="btn-secondary"
 >
 <ArrowLeft className="icon-sm" aria-hidden="true" />
 Back
 </Button>
 </div>
 <EmptyState
 icon={AlertTriangle}
 title="Failed to load session details"
 description={error?.message || "An unexpected error occurred. Please try again."}
 action={{
 label: 'Try Again',
 onClick: () => {
 if (sessionError) utils.factoryReviews.getSessionById.invalidate();
 if (actionItemsError) utils.factoryReviews.getActionItems.invalidate();
 },
 icon: RefreshCw,
 }}
 />
 </div>
 );
 }

 if (isLoading) {
 return (
 <div className="page-container">
 <LoadingState message="Loading session details..." size="md" />
 </div>
 );
 }

 if (!session) {
 return (
 <div className="page-container">
 <EmptyState
 icon={AlertCircle}
 title="Session Not Found"
 description="The factory review session you're looking for doesn't exist."
 action={{
 label: 'Back to Sessions',
 onClick: () => router.push("/production/factory-reviews"),
 icon: ArrowLeft,
 }}
 />
 </div>
 );
 }

 // Filter photos by severity
 const filteredPhotos =
 severityFilter === "all"
 ? session.factory_review_photos || []
 : session.factory_review_photos?.filter((p) => p.issue_severity === severityFilter) || [];

 // Group comments by photo
 const sessionComments = session.factory_review_comments?.filter((c) => !c.photo_id) || [];
 const unresolvedActions = actionItems || [];

 return (
 <div className="page-container">
 {/* Header Section */}
 <div className="page-header">
 <Button
 onClick={() => router.push("/production/factory-reviews")}
 variant="ghost"
 className="btn-secondary"
 >
 <ArrowLeft className="icon-sm" aria-hidden="true" />
 Back
 </Button>
 </div>

 {/* Session Header */}
 <EntityDetailHeader
 icon={Factory}
 title={session.session_name}
 subtitle={`Review #${session.session_number}`}
 status={session.status}
 metadata={[
 {
 icon: Calendar,
 value: format(new Date(session.review_date), "MMMM d, yyyy"),
 type: 'text' as const
 },
 ...(session.location ? [{
 icon: MapPin,
 value: session.location,
 type: 'text' as const
 }] : []),
 ...(session.prototype_production?.partners?.company_name ? [{
 icon: Factory,
 value: session.prototype_production.partners.company_name,
 type: 'text' as const
 }] : []),
 ]}
 actions={[
 {
 label: 'Update Status',
 icon: Edit,
 onClick: () => setStatusDialogOpen(true),
 },
 ]}
 />

 {/* Overview Cards */}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
 <Card>
 <CardHeader className="card-header-sm">
 <CardTitle className="card-title-sm">Photos</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="stat-value">{session.factory_review_photos?.length || 0}</div>
 <p className="stat-label">Uploaded</p>
 </CardContent>
 </Card>

 <Card>
 <CardHeader className="card-header-sm">
 <CardTitle className="card-title-sm">Comments</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="stat-value">{session.factory_review_comments?.length || 0}</div>
 <p className="stat-label">Total comments</p>
 </CardContent>
 </Card>

 <Card>
 <CardHeader className="card-header-sm">
 <CardTitle className="card-title-sm">Action Items</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="stat-value stat-warning">
 {unresolvedActions.length}
 </div>
 <p className="stat-label">Unresolved</p>
 </CardContent>
 </Card>

 <Card>
 <CardHeader className="card-header-sm">
 <CardTitle className="card-title-sm">Documents</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="stat-value">{session.factory_review_documents?.length || 0}</div>
 <p className="stat-label">Attached</p>
 </CardContent>
 </Card>
 </div>

 {/* Tabbed Content */}
 <Tabs value={activeTab} onValueChange={setActiveTab}>
 <TabsList className="tabs-list">
 <TabsTrigger value="overview" className="tabs-trigger">
 <Factory className="icon-sm" aria-hidden="true" />
 Overview
 </TabsTrigger>
 <TabsTrigger value="photos" className="tabs-trigger">
 <ImageIcon className="icon-sm" aria-hidden="true" />
 Photos
 </TabsTrigger>
 <TabsTrigger value="comments" className="tabs-trigger">
 <MessageSquare className="icon-sm" aria-hidden="true" />
 Comments
 </TabsTrigger>
 <TabsTrigger value="actions" className="tabs-trigger">
 <AlertCircle className="icon-sm" aria-hidden="true" />
 Action Items
 </TabsTrigger>
 <TabsTrigger value="documents" className="tabs-trigger">
 <FileText className="icon-sm" aria-hidden="true" />
 Documents
 </TabsTrigger>
 </TabsList>

 {/* Overview Tab */}
 <TabsContent value="overview">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {/* Session Details */}
 <InfoCard
 title="Session Details"
 items={[
 {
 label: 'Prototype',
 value: session.prototype_production?.prototypes?.name || "—"
 },
 {
 label: 'Prototype Number',
 value: session.prototype_production?.prototypes?.prototype_number || "—"
 },
 {
 label: 'Factory',
 value: session.prototype_production?.partners?.company_name || "—"
 },
 {
 label: 'Review Date',
 value: format(new Date(session.review_date), "MMMM d, yyyy")
 },
 {
 label: 'Location',
 value: session.location || "—"
 },
 ]}
 />

 {/* Team Members */}
 <InfoCard
 title="Team Members"
 items={[
 {
 label: 'Limn Team',
 value: session.limn_team_members && session.limn_team_members.length > 0
 ? `${session.limn_team_members.length} team members`
 : "—"
 },
 {
 label: 'Factory Representatives',
 value: session.factory_representatives && session.factory_representatives.length > 0
 ? (
 <ul className="list-disc list-inside text-sm">
 {session.factory_representatives.map((rep, idx) => (
 <li key={idx}>{rep}</li>
 ))}
 </ul>
 )
 : "—"
 },
 {
 label: 'Completion Notes',
 value: session.completion_notes ? (
 <p className="text-sm whitespace-pre-wrap">{session.completion_notes}</p>
 ) : "—"
 },
 ]}
 />
 </div>
 </TabsContent>

 {/* Photos Tab */}
 <TabsContent value="photos" className="space-y-4">
 <Card>
 <CardHeader>
 <div className="flex items-center justify-between">
 <CardTitle>Photos</CardTitle>
 <div className="flex items-center gap-2">
 <Select value={severityFilter} onValueChange={setSeverityFilter}>
 <SelectTrigger className="w-[180px]">
 <SelectValue placeholder="Filter by severity" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">All Severities</SelectItem>
 <SelectItem value="critical">Critical</SelectItem>
 <SelectItem value="major">Major</SelectItem>
 <SelectItem value="minor">Minor</SelectItem>
 <SelectItem value="observation">Observation</SelectItem>
 </SelectContent>
 </Select>
 <Button size="sm">
 <Upload className="w-4 h-4 mr-2" aria-hidden="true" />
 Upload Photo
 </Button>
 </div>
 </div>
 </CardHeader>
 <CardContent>
 {filteredPhotos.length === 0 ? (
 <EmptyState
 icon={ImageIcon}
 title="No Photos"
 description="No photos uploaded yet"
 />
 ) : (
 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
 {filteredPhotos.map((photo) => (
 <Card key={photo.id} className="overflow-hidden group">
 <CardContent className="p-0">
 <div className="relative aspect-square bg-muted">
 <Image
 src={photo.file_url}
 alt={photo.component_area || "Review photo"}
 fill
 className="object-cover"
 />
 <StatusBadge
 status={photo.issue_severity}
 className="absolute top-2 right-2"
 />
 <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
 <Button
 size="sm"
 variant="secondary"
 onClick={() => {
 setSelectedPhotoId(photo.id);
 setCommentDialogOpen(true);
 }}
 >
 <MessageSquare className="w-4 h-4" aria-hidden="true" />
 </Button>
 <Button
 size="sm"
 variant="destructive"
 onClick={() => handleDeletePhoto(photo.id)}
 disabled={deletePhotoMutation.isPending}
 >
 <Trash2 className="w-4 h-4" aria-hidden="true" />
 </Button>
 </div>
 </div>
 <div className="p-3 space-y-1">
 {photo.component_area && (
 <p className="text-sm font-medium">{photo.component_area}</p>
 )}
 <p className="text-xs text-muted-foreground">
 {photo._count?.factory_review_comments || 0} comments
 </p>
 </div>
 </CardContent>
 </Card>
 ))}
 </div>
 )}
 </CardContent>
 </Card>
 </TabsContent>

 {/* Comments Tab */}
 <TabsContent value="comments" className="space-y-4">
 <Card>
 <CardHeader>
 <div className="flex items-center justify-between">
 <CardTitle>Session Comments</CardTitle>
 <Button size="sm" onClick={() => setCommentDialogOpen(true)}>
 <MessageSquare className="w-4 h-4 mr-2" aria-hidden="true" />
 Add Comment
 </Button>
 </div>
 </CardHeader>
 <CardContent>
 {sessionComments.length === 0 ? (
 <EmptyState
 icon={MessageSquare}
 title="No Comments"
 description="No comments yet"
 />
 ) : (
 <div className="space-y-4">
 {sessionComments.map((comment) => (
 <div key={comment.id} className="border rounded-lg p-4 space-y-2">
 <div className="flex items-start justify-between">
 <div className="flex items-center gap-2">
 <p className="font-medium text-sm">
 {comment.users_factory_review_comments_author_idTousers?.email || "Unknown"}
 </p>
 <StatusBadge status={comment.author_role.replace("_", " ")} />
 {comment.is_action_item && (
 <StatusBadge status="action_item" />
 )}
 </div>
 <span className="text-xs text-muted-foreground">
 {format(new Date(comment.created_at), "MMM d, yyyy h:mm a")}
 </span>
 </div>
 <p className="text-sm whitespace-pre-wrap">{comment.comment_text}</p>
 {comment.other_factory_review_comments && comment.other_factory_review_comments.length > 0 && (
 <div className="pl-4 border-l-2 space-y-2 mt-2">
 {comment.other_factory_review_comments.map((reply) => (
 <div key={reply.id} className="text-sm">
 <div className="flex items-center gap-2 mb-1">
 <p className="font-medium">{reply.users_factory_review_comments_author_idTousers?.email || "Unknown"}</p>
 <span className="text-xs text-muted-foreground">
 {format(new Date(reply.created_at), "MMM d, h:mm a")}
 </span>
 </div>
 <p className="text-muted-foreground">{reply.comment_text}</p>
 </div>
 ))}
 </div>
 )}
 </div>
 ))}
 </div>
 )}
 </CardContent>
 </Card>
 </TabsContent>

 {/* Action Items Tab */}
 <TabsContent value="actions" className="space-y-4">
 <Card>
 <CardHeader>
 <CardTitle>Unresolved Action Items</CardTitle>
 </CardHeader>
 <CardContent>
 {unresolvedActions.length === 0 ? (
 <EmptyState
 icon={CheckCircle}
 title="No Unresolved Action Items"
 description="No unresolved action items"
 />
 ) : (
 <div className="space-y-4">
 {unresolvedActions.map((action) => (
 <div key={action.id} className="border rounded-lg p-4 space-y-3">
 <div className="flex items-start justify-between">
 <div className="flex-1">
 <div className="flex items-center gap-2 mb-2">
 <AlertCircle className="w-4 h-4 text-warning" aria-hidden="true" />
 <p className="font-medium">Action Item</p>
 {action.due_date && (
 <StatusBadge
 status="due"
 className="text-xs"
 />
 )}
 </div>
 <p className="text-sm text-muted-foreground mb-2">
 {action.comment_text}
 </p>
 {action.factory_review_photos && (
 <p className="text-xs text-muted-foreground">
 Related to: {action.factory_review_photos.component_area || "Photo"}
 </p>
 )}
 </div>
 <Button
 size="sm"
 variant="outline"
 onClick={() => handleResolveAction(action.id)}
 disabled={resolveActionMutation.isPending}
 >
 <CheckCircle className="w-4 h-4 mr-2" aria-hidden="true" />
 Resolve
 </Button>
 </div>
 <div className="flex items-center gap-4 text-xs text-muted-foreground">
 <span>Created by: {action.users_factory_review_comments_author_idTousers?.email || "Unknown"}</span>
 <span>{format(new Date(action.created_at), "MMM d, yyyy")}</span>
 </div>
 </div>
 ))}
 </div>
 )}
 </CardContent>
 </Card>
 </TabsContent>

 {/* Documents Tab */}
 <TabsContent value="documents" className="space-y-4">
 <Card>
 <CardHeader>
 <div className="flex items-center justify-between">
 <CardTitle>Documents</CardTitle>
 <Button size="sm">
 <Upload className="w-4 h-4 mr-2" aria-hidden="true" />
 Upload Document
 </Button>
 </div>
 </CardHeader>
 <CardContent>
 {!session.factory_review_documents || session.factory_review_documents.length === 0 ? (
 <EmptyState
 icon={FileText}
 title="No Documents"
 description="No documents uploaded yet"
 />
 ) : (
 <div className="space-y-2">
 {session.factory_review_documents.map((doc) => (
 <div
 key={doc.id}
 className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
 >
 <div className="flex items-center gap-3">
 <FileText className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
 <div>
 <p className="font-medium text-sm">{doc.file_name}</p>
 <p className="text-xs text-muted-foreground">
 Uploaded by {doc.users?.email || "Unknown"} on{" "}
 {format(new Date(doc.created_at), "MMM d, yyyy")}
 </p>
 </div>
 </div>
 <Button variant="outline" size="sm" asChild>
 <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
 View
 </a>
 </Button>
 </div>
 ))}
 </div>
 )}
 </CardContent>
 </Card>
 </TabsContent>
 </Tabs>

 {/* Add Comment Dialog */}
 <Dialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen}>
 <DialogContent>
 <DialogHeader>
 <DialogTitle>Add Comment</DialogTitle>
 <DialogDescription>
 Add a comment or action item to this review session
 </DialogDescription>
 </DialogHeader>
 <div className="space-y-4">
 <div className="space-y-2">
 <Label htmlFor="comment-text">
 Comment<span className="text-destructive ml-1">*</span>
 </Label>
 <Textarea
 id="comment-text"
 placeholder="Enter your comment..."
 value={commentText}
 onChange={(e) => setCommentText(e.target.value)}
 rows={4}
 />
 </div>
 <div className="space-y-2">
 <Label htmlFor="comment-type">Comment Type</Label>
 <Select value={commentType} onValueChange={setCommentType}>
 <SelectTrigger id="comment-type">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="issue">Issue</SelectItem>
 <SelectItem value="observation">Observation</SelectItem>
 <SelectItem value="suggestion">Suggestion</SelectItem>
 <SelectItem value="approval">Approval</SelectItem>
 </SelectContent>
 </Select>
 </div>
 <div className="flex items-center gap-2">
 <input
 type="checkbox"
 id="is-action-item"
 checked={isActionItem}
 onChange={(e) => setIsActionItem(e.target.checked)}
 className="rounded"
 />
 <Label htmlFor="is-action-item" className="cursor-pointer">
 Mark as action item (requires follow-up)
 </Label>
 </div>
 </div>
 <DialogFooter>
 <Button
 variant="outline"
 onClick={() => {
 setCommentDialogOpen(false);
 setCommentText("");
 setSelectedPhotoId(null);
 setIsActionItem(false);
 }}
 >
 Cancel
 </Button>
 <Button
 onClick={handleAddComment}
 disabled={addCommentMutation.isPending}
 >
 {addCommentMutation.isPending ? (
 <>
 <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
 Adding...
 </>
 ) : (
 "Add Comment"
 )}
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>

 {/* Status Update Dialog */}
 <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
 <DialogContent>
 <DialogHeader>
 <DialogTitle>Update Session Status</DialogTitle>
 <DialogDescription>
 Change the status of this factory review session
 </DialogDescription>
 </DialogHeader>
 <div className="space-y-4">
 <div className="space-y-2">
 <Label htmlFor="status">New Status</Label>
 <Select value={newStatus || session.status} onValueChange={setNewStatus}>
 <SelectTrigger id="status">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="scheduled">Scheduled</SelectItem>
 <SelectItem value="in_progress">In Progress</SelectItem>
 <SelectItem value="completed">Completed</SelectItem>
 </SelectContent>
 </Select>
 </div>
 </div>
 <DialogFooter>
 <Button
 variant="outline"
 onClick={() => setStatusDialogOpen(false)}
 >
 Cancel
 </Button>
 <Button
 onClick={handleUpdateStatus}
 disabled={updateStatusMutation.isPending}
 >
 {updateStatusMutation.isPending ? (
 <>
 <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
 Updating...
 </>
 ) : (
 "Update Status"
 )}
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 </div>
 );
}
