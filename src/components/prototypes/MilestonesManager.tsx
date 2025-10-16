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
import { Slider } from "@/components/ui/slider";
import { Plus, CheckCircle, Trash2, X, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import { EmptyState } from "@/components/common";

interface MilestonesManagerProps {
  prototypeId: string;
}

export function MilestonesManager({ prototypeId }: MilestonesManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingProgress, setEditingProgress] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    milestoneName: "",
    milestoneType: "production",
    description: "",
    sequenceOrder: 1,
    plannedStart: "",
    plannedEnd: "",
  });

  const utils = api.useUtils();

  // Query milestones
  const { data: milestones = [], isLoading } = api.prototypes.getMilestones.useQuery({
    prototypeId,
  });

  // Mutations
  const createMutation = api.prototypes.createMilestone.useMutation({
    onSuccess: () => {
      toast.success("Milestone created successfully");
      utils.prototypes.getMilestones.invalidate({ prototypeId });
      utils.prototypes.getById.invalidate({ id: prototypeId });
      setIsAdding(false);
      setFormData({
        milestoneName: "",
        milestoneType: "production",
        description: "",
        sequenceOrder: (milestones.length || 0) + 1,
        plannedStart: "",
        plannedEnd: "",
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create milestone");
    },
  });

  const updateStatusMutation = api.prototypes.updateMilestoneStatus.useMutation({
    onSuccess: () => {
      toast.success("Milestone status updated");
      utils.prototypes.getMilestones.invalidate({ prototypeId });
      utils.prototypes.getById.invalidate({ id: prototypeId });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update status");
    },
  });

  const updateProgressMutation = api.prototypes.updateMilestoneProgress.useMutation({
    onSuccess: () => {
      toast.success("Progress updated");
      utils.prototypes.getMilestones.invalidate({ prototypeId });
      setEditingProgress(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update progress");
    },
  });

  const deleteMutation = api.prototypes.deleteMilestone.useMutation({
    onSuccess: () => {
      toast.success("Milestone deleted");
      utils.prototypes.getMilestones.invalidate({ prototypeId });
      utils.prototypes.getById.invalidate({ id: prototypeId });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete milestone");
    },
  });

  const handleSubmit = () => {
    if (!formData.milestoneName.trim()) {
      toast.error("Please provide a milestone name");
      return;
    }

    createMutation.mutate({
      prototypeId,
      ...formData,
      plannedStart: formData.plannedStart ? new Date(formData.plannedStart) : undefined,
      plannedEnd: formData.plannedEnd ? new Date(formData.plannedEnd) : undefined,
    });
  };

  const handleUpdateProgress = (milestoneId: string, progress: number) => {
    updateProgressMutation.mutate({
      id: milestoneId,
      progress,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      case "in_progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
      case "blocked":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
      case "on_hold":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading milestones...</div>;
  }

  // Sort milestones by sequence order
  const sortedMilestones = [...milestones].sort((a: any, b: any) => a.sequence_order - b.sequence_order);

  return (
    <div className="space-y-4">
      {/* Add Milestone Button */}
      {!isAdding && (
        <div className="flex justify-end">
          <Button onClick={() => setIsAdding(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Milestone
          </Button>
        </div>
      )}

      {/* Add Milestone Form */}
      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Milestone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="milestone-name">Milestone Name *</Label>
                <Input
                  id="milestone-name"
                  value={formData.milestoneName}
                  onChange={(e) => setFormData({ ...formData, milestoneName: e.target.value })}
                  placeholder="e.g., Initial Prototype Build"
                />
              </div>
              <div>
                <Label htmlFor="milestone-type">Type</Label>
                <Select
                  value={formData.milestoneType}
                  onValueChange={(value) => setFormData({ ...formData, milestoneType: value })}
                >
                  <SelectTrigger id="milestone-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="production">Production</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="testing">Testing</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="quality">Quality Check</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what needs to be accomplished..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="planned-start">Planned Start Date</Label>
                <Input
                  id="planned-start"
                  type="date"
                  value={formData.plannedStart}
                  onChange={(e) => setFormData({ ...formData, plannedStart: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="planned-end">Planned End Date</Label>
                <Input
                  id="planned-end"
                  type="date"
                  value={formData.plannedEnd}
                  onChange={(e) => setFormData({ ...formData, plannedEnd: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsAdding(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Milestone"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Milestones List */}
      {sortedMilestones.length > 0 ? (
        <div className="space-y-3">
          {sortedMilestones.map((milestone: any) => (
            <Card key={milestone.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">
                      <GripVertical className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          #{milestone.sequence_order}
                        </span>
                        <Badge className={getStatusColor(milestone.status || "pending")}>
                          {milestone.status || "pending"}
                        </Badge>
                        <Badge variant="outline">{milestone.milestone_type}</Badge>
                        {milestone.quality_checkpoint && (
                          <Badge variant="secondary">Quality Checkpoint</Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg">{milestone.milestone_name}</CardTitle>
                      {milestone.description && (
                        <p className="text-sm text-muted-foreground mt-1">{milestone.description}</p>
                      )}
                      {(milestone.planned_start || milestone.planned_end) && (
                        <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                          {milestone.planned_start && (
                            <span>Start: {format(new Date(milestone.planned_start), "MMM d, yyyy")}</span>
                          )}
                          {milestone.planned_end && (
                            <span>End: {format(new Date(milestone.planned_end), "MMM d, yyyy")}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteMutation.mutate({ id: milestone.id })}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">Progress</Label>
                    <span className="text-sm font-medium">{milestone.completion_percentage || 0}%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[milestone.completion_percentage || 0]}
                      onValueChange={(value) => {
                        if (editingProgress === milestone.id) {
                          // Real-time update while dragging
                          setEditingProgress(milestone.id);
                        }
                      }}
                      onValueCommit={(value) => {
                        handleUpdateProgress(milestone.id, value[0]);
                      }}
                      max={100}
                      step={5}
                      className="flex-1"
                    />
                  </div>
                </div>

                {/* Status Change */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor={`status-${milestone.id}`} className="text-sm">
                      Update Status
                    </Label>
                    <Select
                      value={milestone.status || "pending"}
                      onValueChange={(value) =>
                        updateStatusMutation.mutate({
                          id: milestone.id,
                          status: value as "pending" | "completed" | "in_progress" | "skipped" | "blocked",
                        })
                      }
                    >
                      <SelectTrigger id={`status-${milestone.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                        <SelectItem value="on_hold">On Hold</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {milestone.actual_start && (
                    <div className="text-sm text-muted-foreground">
                      <p>Started: {formatDistanceToNow(new Date(milestone.actual_start), { addSuffix: true })}</p>
                      {milestone.actual_end && (
                        <p>Completed: {formatDistanceToNow(new Date(milestone.actual_end), { addSuffix: true })}</p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !isAdding ? (
        <EmptyState
          icon={CheckCircle}
          title="No milestones yet"
          description="Development milestones and progress will be tracked here."
          action={{
            label: "Add First Milestone",
            onClick: () => setIsAdding(true),
            icon: Plus,
          }}
        />
      ) : null}
    </div>
  );
}
