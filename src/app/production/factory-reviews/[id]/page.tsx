"use client";

import React, { use, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
 DialogTrigger,
} from "@/components/ui/dialog";
import {
 Factory,
 Calendar,
 MapPin,
 Users,
 Image as ImageIcon,
 MessageSquare,
 FileText,
 ChevronLeft,
 AlertCircle,
 CheckCircle,
 Clock,
 Edit,
 Trash2,
 Upload,
 Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

// Dynamic route configuration
export const dynamic = 'force-dynamic';

const statusConfig: Record<string, { label: string; className: string }> = {
 scheduled: {
 label: "Scheduled",
 className: "bg-warning-muted text-warning border-warning",
 },
 in_progress: {
 label: "In Progress",
 className: "bg-info-muted text-info border-info",
 },
 completed: {
 label: "Completed",
 className: "bg-success-muted text-success border-success",
 },
};

const severityConfig: Record<string, { label: string; className: string }> = {
 critical: {
 label: "Critical",
 className: "bg-destructive-muted text-destructive border-destructive",
 },
 major: {
 label: "Major",
 className: "bg-warning-muted text-warning border-warning",
 },
 minor: {
 label: "Minor",
 className: "bg-warning-muted text-warning border-warning",
 },
 observation: {
 label: "Observation",
 className: "bg-info-muted text-info border-info",
 },
};

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
 const { data: session, isLoading, refetch } = api.factoryReviews.getSessionById.useQuery({
 id: id,
 });

 // Fetch action items
 const { data: actionItems } = api.factoryReviews.getActionItems.useQuery({
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
 refetch();
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
 refetch();
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
 refetch();
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
 refetch();
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

 if (isLoading) {
 return (
 <div className="container mx-auto p-6">
 <div className="text-center py-12">
 <Loader2 className="w-8 h-8 mx-auto animate-spin text-muted-foreground" aria-hidden="true" />
 <p className="text-muted-foreground mt-4">Loading session details...</p>
 </div>
 </div>
 );
 }

 if (!session) {
 return (
 <div className="container mx-auto p-6">
 <div className="text-center py-12">
 <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-4" aria-hidden="true" />
 <h2 className="text-2xl font-bold mb-2">Session Not Found</h2>
 <p className="text-muted-foreground mb-4">The factory review session you&apos;re looking for doesn&apos;t exist.</p>
 <Button onClick={() => router.push("/factory-reviews")}>
 Back to Sessions
 </Button>
 </div>
 </div>
 );
 }

 const config = statusConfig[session.status] || statusConfig.scheduled;

 // Filter photos by severity
 const filteredPhotos =
 severityFilter === "all"
 ? session.factory_review_photos || []
 : session.factory_review_photos?.filter((p) => p.issue_severity === severityFilter) || [];

 // Group comments by photo
 const sessionComments = session.factory_review_comments?.filter((c) => !c.photo_id) || [];
 const unresolvedActions = actionItems || [];

 return (
 <div className="container mx-auto p-6 space-y-6">
 {/* Header */}
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-4">
 <Button variant="ghost" size="sm" onClick={() => router.push("/factory-reviews")}>
 <ChevronLeft className="w-4 h-4 mr-1" aria-hidden="true" />
 Back
 </Button>
 <div>
 <h1 className="text-3xl font-bold">{session.session_name}</h1>
 <p className="text-muted-foreground">Review #{session.session_number}</p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <Badge variant="outline" className={cn(config.className, "text-sm px-3 py-1")}>
 {config.label}
 </Badge>
 <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
 <DialogTrigger asChild>
 <Button variant="outline" size="sm">
 <Edit className="w-4 h-4 mr-2" aria-hidden="true" />
 Update Status
 </Button>
 </DialogTrigger>
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
 </div>

 {/* Overview Cards */}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
 <Card>
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
 <CardTitle className="text-sm font-medium">Photos</CardTitle>
 <ImageIcon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold">{session.factory_review_photos?.length || 0}</div>
 </CardContent>
 </Card>

 <Card>
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
 <CardTitle className="text-sm font-medium">Comments</CardTitle>
 <MessageSquare className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold">{session.factory_review_comments?.length || 0}</div>
 </CardContent>
 </Card>

 <Card>
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
 <CardTitle className="text-sm font-medium">Action Items</CardTitle>
 <AlertCircle className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold text-warning">
 {unresolvedActions.length}
 </div>
 </CardContent>
 </Card>

 <Card>
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
 <CardTitle className="text-sm font-medium">Documents</CardTitle>
 <FileText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold">{session.factory_review_documents?.length || 0}</div>
 </CardContent>
 </Card>
 </div>

 {/* Tabbed Content */}
 <Tabs value={activeTab} onValueChange={setActiveTab}>
 <TabsList className="grid w-full grid-cols-5">
 <TabsTrigger value="overview">Overview</TabsTrigger>
 <TabsTrigger value="photos">Photos</TabsTrigger>
 <TabsTrigger value="comments">Comments</TabsTrigger>
 <TabsTrigger value="actions">Action Items</TabsTrigger>
 <TabsTrigger value="documents">Documents</TabsTrigger>
 </TabsList>

 {/* Overview Tab */}
 <TabsContent value="overview" className="space-y-4">
 <Card>
 <CardHeader>
 <CardTitle>Session Details</CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="grid grid-cols-2 gap-4">
 <div>
 <Label className="text-muted-foreground">Prototype</Label>
 <p className="font-medium mt-1">
 {session.prototype_production?.prototypes?.name || "—"}
 </p>
 <p className="text-sm text-muted-foreground">
 {session.prototype_production?.prototypes?.prototype_number || ""}
 </p>
 </div>
 <div>
 <Label className="text-muted-foreground">Factory</Label>
 <p className="font-medium mt-1">
 {session.prototype_production?.partners?.company_name || "—"}
 </p>
 </div>
 <div>
 <Label className="text-muted-foreground flex items-center gap-2">
 <Calendar className="w-4 h-4" aria-hidden="true" />
 Review Date
 </Label>
 <p className="font-medium mt-1">
 {format(new Date(session.review_date), "MMMM d, yyyy")}
 </p>
 </div>
 <div>
 <Label className="text-muted-foreground flex items-center gap-2">
 <MapPin className="w-4 h-4" aria-hidden="true" />
 Location
 </Label>
 <p className="font-medium mt-1">{session.location || "—"}</p>
 </div>
 </div>

 {session.limn_team_members && session.limn_team_members.length > 0 && (
 <div className="pt-4 border-t">
 <Label className="text-muted-foreground flex items-center gap-2">
 <Users className="w-4 h-4" aria-hidden="true" />
 Limn Team Members
 </Label>
 <p className="text-sm mt-2">{session.limn_team_members.length} team members</p>
 </div>
 )}

 {session.factory_representatives && session.factory_representatives.length > 0 && (
 <div>
 <Label className="text-muted-foreground flex items-center gap-2">
 <Factory className="w-4 h-4" aria-hidden="true" />
 Factory Representatives
 </Label>
 <ul className="list-disc list-inside mt-2 text-sm">
 {session.factory_representatives.map((rep, idx) => (
 <li key={idx}>{rep}</li>
 ))}
 </ul>
 </div>
 )}

 {session.completion_notes && (
 <div className="pt-4 border-t">
 <Label className="text-muted-foreground">Completion Notes</Label>
 <p className="text-sm mt-2 whitespace-pre-wrap">{session.completion_notes}</p>
 </div>
 )}
 </CardContent>
 </Card>
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
 <div className="text-center py-12 text-muted-foreground">
 <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" aria-hidden="true" />
 <p>No photos uploaded yet</p>
 </div>
 ) : (
 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
 {filteredPhotos.map((photo) => {
 const severityConf =
 severityConfig[photo.issue_severity] || severityConfig.observation;
 return (
 <Card key={photo.id} className="overflow-hidden group">
 <CardContent className="p-0">
 <div className="relative aspect-square bg-muted">
 <Image
 src={photo.file_url}
 alt={photo.component_area || "Review photo"}
 fill
 className="object-cover"
 />
 <Badge
 variant="outline"
 className={cn(
 "absolute top-2 right-2",
 severityConf.className
 )}
 >
 {severityConf.label}
 </Badge>
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
 );
 })}
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
 <div className="text-center py-12 text-muted-foreground">
 <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" aria-hidden="true" />
 <p>No comments yet</p>
 </div>
 ) : (
 <div className="space-y-4">
 {sessionComments.map((comment) => (
 <div key={comment.id} className="border rounded-lg p-4 space-y-2">
 <div className="flex items-start justify-between">
 <div className="flex items-center gap-2">
 <p className="font-medium text-sm">
 {comment.users_factory_review_comments_author_idTousers?.email || "Unknown"}
 </p>
 <Badge variant="outline" className="text-xs capitalize">
 {comment.author_role.replace("_", " ")}
 </Badge>
 {comment.is_action_item && (
 <Badge variant="outline" className="text-xs bg-warning-muted text-warning border-warning">
 Action Item
 </Badge>
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
 <div className="text-center py-12 text-muted-foreground">
 <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" aria-hidden="true" />
 <p>No unresolved action items</p>
 </div>
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
 <Badge variant="outline" className="text-xs">
 <Clock className="w-3 h-3 mr-1" aria-hidden="true" />
 Due {format(new Date(action.due_date), "MMM d, yyyy")}
 </Badge>
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
 <div className="text-center py-12 text-muted-foreground">
 <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" aria-hidden="true" />
 <p>No documents uploaded yet</p>
 </div>
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
 </div>
 );
}
