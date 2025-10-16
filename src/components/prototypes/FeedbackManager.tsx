"use client";

import { useState } from "react";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, MessageSquare, CheckCircle, X } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { EmptyState } from "@/components/common";

interface FeedbackManagerProps {
  prototypeId: string;
}

export function FeedbackManager({ prototypeId }: FeedbackManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    feedbackType: "general",
    feedbackSource: "",
    title: "",
    feedbackText: "",
    sentiment: "neutral",
    priority: "medium",
    requiresAction: false,
  });

  const utils = api.useUtils();

  // Query feedback
  const { data: feedback = [], isLoading } = api.prototypes.getFeedback.useQuery({
    prototypeId,
  });

  // Mutations
  const submitMutation = api.prototypes.submitFeedback.useMutation({
    onSuccess: () => {
      toast.success("Feedback submitted successfully");
      utils.prototypes.getFeedback.invalidate({ prototypeId });
      utils.prototypes.getPrototypeById.invalidate({ id: prototypeId });
      setIsAdding(false);
      setFormData({
        feedbackType: "general",
        feedbackSource: "",
        title: "",
        feedbackText: "",
        sentiment: "neutral",
        priority: "medium",
        requiresAction: false,
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit feedback");
    },
  });

  const addressMutation = api.prototypes.addressFeedback.useMutation({
    onSuccess: () => {
      toast.success("Feedback marked as addressed");
      utils.prototypes.getFeedback.invalidate({ prototypeId });
      utils.prototypes.getPrototypeById.invalidate({ id: prototypeId });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to address feedback");
    },
  });

  const closeMutation = api.prototypes.closeFeedback.useMutation({
    onSuccess: () => {
      toast.success("Feedback closed");
      utils.prototypes.getFeedback.invalidate({ prototypeId });
      utils.prototypes.getPrototypeById.invalidate({ id: prototypeId });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to close feedback");
    },
  });

  const handleSubmit = () => {
    if (!formData.feedbackSource.trim() || !formData.feedbackText.trim()) {
      toast.error("Please provide feedback source and text");
      return;
    }

    submitMutation.mutate({
      prototypeId,
      ...formData,
    });
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      case "negative":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
      case "urgent":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "addressed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      case "closed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading feedback...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Add Feedback Button */}
      {!isAdding && (
        <div className="flex justify-end">
          <Button onClick={() => setIsAdding(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Feedback
          </Button>
        </div>
      )}

      {/* Add Feedback Form */}
      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle>Submit New Feedback</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="feedback-type">Feedback Type</Label>
                <Select
                  value={formData.feedbackType}
                  onValueChange={(value) => setFormData({ ...formData, feedbackType: value })}
                >
                  <SelectTrigger id="feedback-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="functionality">Functionality</SelectItem>
                    <SelectItem value="quality">Quality</SelectItem>
                    <SelectItem value="manufacturing">Manufacturing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="feedback-source">Source *</Label>
                <Input
                  id="feedback-source"
                  value={formData.feedbackSource}
                  onChange={(e) => setFormData({ ...formData, feedbackSource: e.target.value })}
                  placeholder="e.g., Client, Internal Team, Designer"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Brief summary of feedback"
              />
            </div>

            <div>
              <Label htmlFor="feedback-text">Feedback *</Label>
              <Textarea
                id="feedback-text"
                value={formData.feedbackText}
                onChange={(e) => setFormData({ ...formData, feedbackText: e.target.value })}
                placeholder="Enter detailed feedback..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="sentiment">Sentiment</Label>
                <Select
                  value={formData.sentiment}
                  onValueChange={(value) => setFormData({ ...formData, sentiment: value })}
                >
                  <SelectTrigger id="sentiment">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="positive">Positive</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                    <SelectItem value="negative">Negative</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="requires-action"
                    checked={formData.requiresAction}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, requiresAction: checked as boolean })
                    }
                  />
                  <Label htmlFor="requires-action" className="cursor-pointer">
                    Requires Action
                  </Label>
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsAdding(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={submitMutation.isPending}>
                {submitMutation.isPending ? "Submitting..." : "Submit Feedback"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feedback List */}
      {feedback.length > 0 ? (
        <div className="space-y-3">
          {feedback.map((item: any) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getSentimentColor(item.sentiment || "neutral")}>
                        {item.sentiment || "neutral"}
                      </Badge>
                      <Badge className={getPriorityColor(item.priority || "medium")}>
                        {item.priority || "medium"} priority
                      </Badge>
                      <Badge className={getStatusColor(item.status || "new")}>
                        {item.status || "new"}
                      </Badge>
                      {item.requires_action && (
                        <Badge variant="destructive">Requires Action</Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg">
                      {item.title || `Feedback from ${item.feedback_source}`}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.feedback_type} • {item.feedback_source} •{" "}
                      {formatDistanceToNow(new Date(item.submitted_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {item.status === "new" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addressMutation.mutate({ id: item.id, actionTaken: "" })}
                        disabled={addressMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Mark Addressed
                      </Button>
                    )}
                    {item.status === "addressed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => closeMutation.mutate({ id: item.id })}
                        disabled={closeMutation.isPending}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Close
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{item.feedback_text}</p>
                {item.action_taken && (
                  <div className="mt-3 p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium">Action Taken:</p>
                    <p className="text-sm mt-1">{item.action_taken}</p>
                  </div>
                )}
                {item.addressed_at && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Addressed {formatDistanceToNow(new Date(item.addressed_at), { addSuffix: true })}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !isAdding ? (
        <EmptyState
          icon={MessageSquare}
          title="No feedback yet"
          description="Client and team feedback will appear here once collected."
          action={{
            label: "Add First Feedback",
            onClick: () => setIsAdding(true),
            icon: Plus,
          }}
        />
      ) : null}
    </div>
  );
}
