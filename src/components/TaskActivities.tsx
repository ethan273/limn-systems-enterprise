"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
 DialogDescription,
 DialogTrigger,
} from "@/components/ui/dialog";
import {
 MessageSquare,
 Plus,
 User,
 CheckCircle2,
 AlertCircle,
 Paperclip,
 Link,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface TaskActivitiesProps {
 taskId: string;
 onUpdate?: () => void;
}

type ActivityType = 'comment' | 'status_change' | 'assignment' | 'attachment' | 'entity_linked' | 'task_created';

export default function TaskActivities({ taskId, onUpdate }: TaskActivitiesProps) {
 const { user } = useAuth();
 const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);
 const [commentText, setCommentText] = useState("");
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [users, setUsers] = useState<Record<string, { name: string; initials: string; avatar: string | null }>>({});
 const [_loadingUsers, setLoadingUsers] = useState(true);

 const { data: activities, isLoading, refetch } = api.tasks.getActivities.useQuery({
 task_id: taskId,
 limit: 10,
 offset: 0,
 });

 const addActivityMutation = api.tasks.addActivity.useMutation({
 onSuccess: () => {
 refetch();
 setCommentText("");
 setIsCommentDialogOpen(false);
 setIsSubmitting(false);
 onUpdate?.();
 },
 onError: () => {
 setIsSubmitting(false);
 },
 });

 // Get current user ID from auth
 const currentUserId = user?.id;

 // Load users data
 useEffect(() => {
 const fetchUsers = async () => {
 try {
 // TODO: Implement proper tRPC client call
 // const result = await api.users.getAllUsers.fetch({ limit: 100 });
 console.log('TODO: Load users data via tRPC');
 // TODO: Process user data when API is properly implemented
 setUsers({});
 } catch (error) {
 console.error('Failed to fetch users:', error);
 } finally {
 setLoadingUsers(false);
 }
 };

 fetchUsers();
 }, []);

 const handleAddComment = async () => {
 if (!commentText.trim() || isSubmitting || !currentUserId) return;

 setIsSubmitting(true);
 addActivityMutation.mutate({
 task_id: taskId,
 user_id: currentUserId,
 activity_type: 'comment',
 content: commentText.trim(),
 mentioned_users: [],
 });
 };

 const getActivityIcon = (activityType: ActivityType) => {
 switch (activityType) {
 case 'comment':
 return <MessageSquare className="h-4 w-4 text-info" />;
 case 'status_change':
 return <CheckCircle2 className="h-4 w-4 text-success" />;
 case 'assignment':
 return <User className="h-4 w-4 text-primary" />;
 case 'attachment':
 return <Paperclip className="h-4 w-4 text-warning" />;
 case 'entity_linked':
 return <Link className="h-4 w-4 text-info" />;
 case 'task_created':
 return <Plus className="h-4 w-4 text-tertiary" />;
 default:
 return <AlertCircle className="h-4 w-4 text-tertiary" />;
 }
 };

 const getActivityColor = (activityType: ActivityType) => {
 switch (activityType) {
 case 'comment':
 return 'text-info';
 case 'status_change':
 return 'text-success';
 case 'assignment':
 return 'text-primary';
 case 'attachment':
 return 'text-warning';
 case 'entity_linked':
 return 'text-info';
 case 'task_created':
 return 'text-tertiary';
 default:
 return 'text-tertiary';
 }
 };

 if (isLoading) {
 return (
 <div className="space-y-3">
 <div className="flex items-center gap-2 text-sm font-medium text-tertiary">
 <MessageSquare className="h-4 w-4" />
 Activity
 </div>
 <div className="text-sm text-secondary">Loading activity...</div>
 </div>
 );
 }

 return (
 <div className="space-y-3">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2 text-sm font-medium text-tertiary">
 <MessageSquare className="h-4 w-4" />
 Activity ({activities?.length || 0})
 </div>
 <Dialog open={isCommentDialogOpen} onOpenChange={setIsCommentDialogOpen}>
 <DialogTrigger asChild>
 <Button variant="outline" size="sm" className="text-xs" disabled={!currentUserId}>
 <Plus className="h-3 w-3 mr-1" />
 Add Comment
 </Button>
 </DialogTrigger>
 <DialogContent className="max-w-md">
 <DialogHeader>
 <DialogTitle>Add Comment</DialogTitle>
 <DialogDescription>
 Add a comment to this task to provide updates or feedback.
 </DialogDescription>
 </DialogHeader>
 <div className="space-y-4">
 <Textarea
 value={commentText}
 onChange={(e) => setCommentText(e.target.value)}
 placeholder="Write your comment..."
 rows={4}
 className="resize-none"
 />
 <div className="flex justify-end gap-2">
 <Button
 variant="outline"
 size="sm"
 onClick={() => {
 setIsCommentDialogOpen(false);
 setCommentText("");
 }}
 disabled={isSubmitting}
 >
 Cancel
 </Button>
 <Button
 size="sm"
 onClick={handleAddComment}
 disabled={!commentText.trim() || isSubmitting}
 >
 {isSubmitting ? "Adding..." : "Add Comment"}
 </Button>
 </div>
 </div>
 </DialogContent>
 </Dialog>
 </div>

 <div className="space-y-3">
 {activities && activities.length > 0 ? (
 activities.map((activity) => {
 const activityUser = users[activity.user_id] || { name: "Unknown User", initials: "?", avatar: null };

 return (
 <div
 key={activity.id}
 className="flex gap-3 p-3 card/20 rounded-lg border border/30"
 >
 <Avatar className="h-8 w-8 flex-shrink-0">
 <AvatarImage src={activityUser.avatar || undefined} />
 <AvatarFallback className="text-xs card">
 {activityUser.initials}
 </AvatarFallback>
 </Avatar>

 <div className="flex-1 min-w-0 space-y-1">
 <div className="flex items-center gap-2">
 <span className="text-sm font-medium ">
 {activityUser.name}
 </span>
 <div className={`flex items-center gap-1 ${getActivityColor(activity.activity_type as ActivityType)}`}>
 {getActivityIcon(activity.activity_type as ActivityType)}
 <Badge variant="outline" className="text-xs border text-tertiary">
 {activity.activity_type.replace('_', ' ')}
 </Badge>
 </div>
 <span className="text-xs text-secondary">
 {activity.created_at
 ? formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })
 : 'Unknown time'
 }
 </span>
 </div>

 {activity.content && (
 <p className="text-sm text-tertiary whitespace-pre-wrap">
 {activity.content}
 </p>
 )}

 {(activity.old_value || activity.new_value) && (
 <div className="text-xs text-tertiary space-y-1">
 {activity.old_value && (
 <div>
 <span className="text-destructive">From:</span> {JSON.stringify(activity.old_value)}
 </div>
 )}
 {activity.new_value && (
 <div>
 <span className="text-success">To:</span> {JSON.stringify(activity.new_value)}
 </div>
 )}
 </div>
 )}
 </div>
 </div>
 );
 })
 ) : (
 <div className="text-sm text-secondary py-2">
 No recent activity
 </div>
 )}

 {activities && activities.length >= 10 && (
 <Button variant="outline" size="sm" className="w-full text-xs">
 Load More Activity
 </Button>
 )}
 </div>
 </div>
 );
}