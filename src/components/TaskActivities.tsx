"use client";

import { useState } from "react";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Mock user data - in production this would come from a users API
  const mockUsers: Record<string, { name: string; initials: string; avatar: string | null }> = {
    "550e8400-e29b-41d4-a716-446655440000": {
      name: "John Doe",
      initials: "JD",
      avatar: null
    },
    "660e8400-e29b-41d4-a716-446655440001": {
      name: "Jane Smith",
      initials: "JS",
      avatar: null
    },
    "770e8400-e29b-41d4-a716-446655440002": {
      name: "Mike Johnson",
      initials: "MJ",
      avatar: null
    }
  };

  // Mock user ID - in production this would come from session
  const mockUserId = "550e8400-e29b-41d4-a716-446655440000";

  const handleAddComment = async () => {
    if (!commentText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    addActivityMutation.mutate({
      task_id: taskId,
      user_id: mockUserId,
      activity_type: 'comment',
      content: commentText.trim(),
      mentioned_users: [],
    });
  };

  const getActivityIcon = (activityType: ActivityType) => {
    switch (activityType) {
      case 'comment':
        return <MessageSquare className="h-4 w-4 text-blue-400" />;
      case 'status_change':
        return <CheckCircle2 className="h-4 w-4 text-green-400" />;
      case 'assignment':
        return <User className="h-4 w-4 text-purple-400" />;
      case 'attachment':
        return <Paperclip className="h-4 w-4 text-yellow-400" />;
      case 'entity_linked':
        return <Link className="h-4 w-4 text-cyan-400" />;
      case 'task_created':
        return <Plus className="h-4 w-4 text-gray-400" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getActivityColor = (activityType: ActivityType) => {
    switch (activityType) {
      case 'comment':
        return 'text-blue-400';
      case 'status_change':
        return 'text-green-400';
      case 'assignment':
        return 'text-purple-400';
      case 'attachment':
        return 'text-yellow-400';
      case 'entity_linked':
        return 'text-cyan-400';
      case 'task_created':
        return 'text-gray-400';
      default:
        return 'text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
          <MessageSquare className="h-4 w-4" />
          Activity
        </div>
        <div className="text-sm text-gray-500">Loading activity...</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
          <MessageSquare className="h-4 w-4" />
          Activity ({activities?.length || 0})
        </div>
        <Dialog open={isCommentDialogOpen} onOpenChange={setIsCommentDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-xs">
              <Plus className="h-3 w-3 mr-1" />
              Add Comment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Comment</DialogTitle>
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
            const user = mockUsers[activity.user_id] || { name: "Unknown User", initials: "?", avatar: null };

            return (
              <div
                key={activity.id}
                className="flex gap-3 p-3 bg-gray-700/20 rounded-lg border border-gray-600/30"
              >
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={user.avatar || undefined} />
                  <AvatarFallback className="text-xs bg-gray-600">
                    {user.initials}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-200">
                      {user.name}
                    </span>
                    <div className={`flex items-center gap-1 ${getActivityColor(activity.activity_type as ActivityType)}`}>
                      {getActivityIcon(activity.activity_type as ActivityType)}
                      <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                        {activity.activity_type.replace('_', ' ')}
                      </Badge>
                    </div>
                    <span className="text-xs text-gray-500">
                      {activity.created_at
                        ? formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })
                        : 'Unknown time'
                      }
                    </span>
                  </div>

                  {activity.content && (
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">
                      {activity.content}
                    </p>
                  )}

                  {(activity.old_value || activity.new_value) && (
                    <div className="text-xs text-gray-400 space-y-1">
                      {activity.old_value && (
                        <div>
                          <span className="text-red-400">From:</span> {JSON.stringify(activity.old_value)}
                        </div>
                      )}
                      {activity.new_value && (
                        <div>
                          <span className="text-green-400">To:</span> {JSON.stringify(activity.new_value)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-sm text-gray-500 py-2">
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