"use client";

import React, { useState } from "react";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, XCircle, Clock, Plus, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface QCCheckpointsListProps {
  inspectionId: string;
  onUpdate: () => void;
}

const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  pending: {
    label: "Pending",
    className: "bg-gray-100 text-gray-800 border-gray-300",
    icon: <Clock className="w-3 h-3" aria-hidden="true" />,
  },
  passed: {
    label: "Passed",
    className: "bg-green-100 text-green-800 border-green-300",
    icon: <CheckCircle2 className="w-3 h-3" aria-hidden="true" />,
  },
  failed: {
    label: "Failed",
    className: "bg-red-100 text-red-800 border-red-300",
    icon: <XCircle className="w-3 h-3" aria-hidden="true" />,
  },
};

export function QCCheckpointsList({ inspectionId, onUpdate }: QCCheckpointsListProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    checkpointName: "",
    status: "pending" as "pending" | "passed" | "failed",
    notes: "",
  });

  // Fetch checkpoints
  const { data: checkpoints, isLoading } = api.qc.getCheckpoints.useQuery(
    { inspectionId },
    { enabled: !!inspectionId }
  );

  // Add checkpoint mutation
  const addCheckpointMutation = api.qc.addCheckpoint.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Checkpoint added successfully",
      });
      setIsAddDialogOpen(false);
      setFormData({
        checkpointName: "",
        status: "pending",
        notes: "",
      });
      onUpdate();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add checkpoint",
        variant: "destructive",
      });
    },
  });

  // Update checkpoint mutation
  const updateCheckpointMutation = api.qc.updateCheckpoint.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Checkpoint updated successfully",
      });
      onUpdate();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update checkpoint",
        variant: "destructive",
      });
    },
  });

  const handleAddCheckpoint = () => {
    addCheckpointMutation.mutate({
      inspectionId,
      checkpointName: formData.checkpointName,
      status: formData.status,
      notes: formData.notes || undefined,
    });
  };

  const handleStatusChange = (checkpointId: string, newStatus: "pending" | "passed" | "failed") => {
    updateCheckpointMutation.mutate({
      id: checkpointId,
      status: newStatus,
    });
  };

  const stats = {
    total: checkpoints?.length || 0,
    pending: checkpoints?.filter((c) => c.status === "pending").length || 0,
    passed: checkpoints?.filter((c) => c.status === "passed").length || 0,
    failed: checkpoints?.filter((c) => c.status === "failed").length || 0,
  };

  return (
    <div className="space-y-4">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">QC Checkpoints</h3>
          <p className="text-sm text-muted-foreground">
            {stats.passed}/{stats.total} completed
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
          Add Checkpoint
        </Button>
      </div>

      {/* Progress Summary */}
      {stats.total > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-gray-600">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.passed}</p>
                <p className="text-sm text-muted-foreground">Passed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                <p className="text-sm text-muted-foreground">Failed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Checkpoints List */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading checkpoints...</div>
      ) : !checkpoints || checkpoints.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center text-muted-foreground">
              <ClipboardCheck className="w-12 h-12 mx-auto mb-2 opacity-50" aria-hidden="true" />
              <p className="text-sm mb-4">No checkpoints defined</p>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                Add First Checkpoint
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {checkpoints.map((checkpoint) => {
            const config = statusConfig[checkpoint.status] || statusConfig.pending;
            return (
              <Card key={checkpoint.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{checkpoint.checkpoint_name}</h4>
                      {checkpoint.notes && (
                        <p className="text-sm text-muted-foreground mt-1">{checkpoint.notes}</p>
                      )}
                      {checkpoint.completed_at && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Completed {format(new Date(checkpoint.completed_at), "MMM d, yyyy h:mm a")}
                        </p>
                      )}
                    </div>
                    <div className="ml-4 flex items-center gap-2">
                      <Select
                        value={checkpoint.status}
                        onValueChange={(value: any) => handleStatusChange(checkpoint.id, value)}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="passed">Passed</SelectItem>
                          <SelectItem value="failed">Failed</SelectItem>
                        </SelectContent>
                      </Select>
                      <Badge variant="outline" className={cn(config.className, "flex items-center gap-1")}>
                        {config.icon}
                        {config.label}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Checkpoint Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Checkpoint</DialogTitle>
            <DialogDescription>
              Create a new checkpoint for this QC inspection
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="checkpointName">Checkpoint Name *</Label>
              <Input
                id="checkpointName"
                placeholder="e.g., Verify dimensions, Check finish quality, etc."
                value={formData.checkpointName}
                onChange={(e) => setFormData({ ...formData, checkpointName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="passed">Passed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes or instructions..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddCheckpoint}
              disabled={!formData.checkpointName || addCheckpointMutation.isPending}
            >
              Add Checkpoint
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
