"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CreateMoodBoardModalProps {
  open: boolean;
  onOpenChange: (_isOpen: boolean) => void;
  designProjectId?: string;
}

export function CreateMoodBoardModal({ open: _open, onOpenChange, designProjectId }: CreateMoodBoardModalProps) {
  // _open prop is used by Dialog component internally (prefixed with _ to satisfy ESLint)
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    board_type: "mood",
    design_project_id: designProjectId || "",
  });

  const createMutation = api.moodBoards.create.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Mood board created successfully!",
      });
      onOpenChange(false);
      router.push(`/design/boards/${data.id}`);
      router.refresh();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create mood board. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a board name.",
        variant: "destructive",
      });
      return;
    }

    await createMutation.mutateAsync(formData);
  };

  const handleCancel = () => {
    setFormData({
      name: "",
      description: "",
      board_type: "mood",
      design_project_id: designProjectId || "",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={_open} onOpenChange={onOpenChange}>
      <DialogContent className="modal-content sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Mood Board</DialogTitle>
            <DialogDescription>
              Create a new mood board to collect design inspiration and visual references.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Board Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter board name..."
                required
                className="input-field"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the purpose of this mood board..."
                rows={3}
                className="textarea-field"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="board_type">Board Type</Label>
              <Select
                value={formData.board_type}
                onValueChange={(value) => setFormData({ ...formData, board_type: value })}
              >
                <SelectTrigger id="board_type" className="select-trigger">
                  <SelectValue placeholder="Select board type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mood">Mood Board</SelectItem>
                  <SelectItem value="material">Material Board</SelectItem>
                  <SelectItem value="color">Color Palette</SelectItem>
                  <SelectItem value="concept">Concept Board</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={createMutation.isPending}
              className="btn-secondary"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="btn-primary"
            >
              {createMutation.isPending ? "Creating..." : "Create Board"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
