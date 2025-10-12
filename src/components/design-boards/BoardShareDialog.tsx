"use client";

import { useState } from "react";
import { Users, Mail, Link as LinkIcon, X, Check, ChevronDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api/client";
import { useAuthContext } from "@/lib/auth/AuthProvider";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BoardShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: string;
  boardName: string;
}

type CollaboratorRole = 'owner' | 'editor' | 'commenter' | 'viewer';

const roleDescriptions: Record<CollaboratorRole, string> = {
  owner: 'Full control',
  editor: 'Can edit and comment',
  commenter: 'Can only comment',
  viewer: 'Can only view',
};

export function BoardShareDialog({ open, onOpenChange, boardId, boardName }: BoardShareDialogProps) {
  const { user } = useAuthContext();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<CollaboratorRole>("editor");
  const [linkCopied, setLinkCopied] = useState(false);

  // Fetch collaborators
  const { data: collaborators, refetch: refetchCollaborators } = api.designBoards.collaborators.getByBoardId.useQuery(
    { board_id: boardId },
    { enabled: open }
  );

  // Search users by email
  const [searchEmail, setSearchEmail] = useState("");
  const { data: searchResults, refetch: searchUsers } = api.users.findByEmail.useQuery(
    { email: searchEmail },
    { enabled: false }
  );

  // Add collaborator mutation
  const addCollaboratorMutation = api.designBoards.collaborators.create.useMutation({
    onSuccess: () => {
      toast.success("Collaborator added successfully");
      setEmail("");
      setSearchEmail("");
      refetchCollaborators();
    },
    onError: (error) => {
      toast.error(`Failed to add collaborator: ${error.message}`);
    },
  });

  // Update role mutation
  const updateRoleMutation = api.designBoards.collaborators.updateRole.useMutation({
    onSuccess: () => {
      toast.success("Role updated successfully");
      refetchCollaborators();
    },
    onError: (error) => {
      toast.error(`Failed to update role: ${error.message}`);
    },
  });

  // Remove collaborator mutation
  const removeCollaboratorMutation = api.designBoards.collaborators.delete.useMutation({
    onSuccess: () => {
      toast.success("Collaborator removed");
      refetchCollaborators();
    },
    onError: (error) => {
      toast.error(`Failed to remove collaborator: ${error.message}`);
    },
  });

  // Update board to mark as shared
  const updateBoardMutation = api.designBoards.boards.update.useMutation();

  const handleAddCollaborator = async () => {
    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    // Search for user first
    setSearchEmail(email.trim());
    const result = await searchUsers();

    if (!result.data || result.data.length === 0) {
      toast.error("User not found. They need to create an account first.");
      return;
    }

    const targetUser = result.data[0];

    // Check if already a collaborator
    const existing = collaborators?.find((c) => c.user_id === targetUser?.id);
    if (existing) {
      toast.error("This user is already a collaborator");
      return;
    }

    // Add collaborator
    addCollaboratorMutation.mutate({
      board_id: boardId,
      user_id: targetUser.id,
      role: role,
      invited_by: user?.id,
    });

    // Mark board as shared
    updateBoardMutation.mutate({
      id: boardId,
      data: { is_shared: true },
    });
  };

  const handleUpdateRole = (collaboratorId: string, newRole: CollaboratorRole) => {
    updateRoleMutation.mutate({
      id: collaboratorId,
      role: newRole,
    });
  };

  const handleRemoveCollaborator = (collaboratorId: string) => {
    if (confirm("Are you sure you want to remove this collaborator?")) {
      removeCollaboratorMutation.mutate({ id: collaboratorId });
    }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/design/boards/${boardId}`;
    navigator.clipboard.writeText(link);
    setLinkCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Share "{boardName}"
          </DialogTitle>
          <DialogDescription>
            Invite people to collaborate on this board
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Add People Section */}
          <div className="space-y-3">
            <Label>Add people</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCollaborator();
                    }
                  }}
                />
              </div>
              <Select value={role} onValueChange={(v) => setRole(v as CollaboratorRole)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="commenter">Commenter</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleAddCollaborator}
                disabled={addCollaboratorMutation.isPending}
              >
                <Mail className="h-4 w-4 mr-2" />
                Invite
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Invite team members by their registered email address
            </p>
          </div>

          {/* Current Collaborators */}
          <div className="space-y-3">
            <Label>People with access</Label>
            <div className="border rounded-lg divide-y max-h-[300px] overflow-y-auto">
              {collaborators && collaborators.length > 0 ? (
                collaborators.map((collaborator) => (
                  <div key={collaborator.id} className="p-3 flex items-center justify-between hover:bg-muted/50">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">
                          {collaborator.user_profiles?.first_name?.[0]?.toUpperCase() ||
                           collaborator.user_profiles?.email?.[0]?.toUpperCase() ||
                           '?'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {collaborator.user_profiles?.first_name && collaborator.user_profiles?.last_name
                            ? `${collaborator.user_profiles.first_name} ${collaborator.user_profiles.last_name}`
                            : collaborator.user_profiles?.email || 'Unknown User'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {collaborator.user_profiles?.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {collaborator.role === 'owner' ? (
                        <span className="text-xs text-muted-foreground px-3 py-1 bg-muted rounded">
                          Owner
                        </span>
                      ) : (
                        <>
                          <Select
                            value={collaborator.role}
                            onValueChange={(newRole) => handleUpdateRole(collaborator.id, newRole as CollaboratorRole)}
                          >
                            <SelectTrigger className="w-[120px] h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="editor">Editor</SelectItem>
                              <SelectItem value="commenter">Commenter</SelectItem>
                              <SelectItem value="viewer">Viewer</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleRemoveCollaborator(collaborator.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No collaborators yet. Invite people to start collaborating!
                </div>
              )}
            </div>
          </div>

          {/* Share Link */}
          <div className="space-y-3 border-t pt-4">
            <Label>Share link</Label>
            <div className="flex gap-2">
              <Input
                value={`${window.location.origin}/design/boards/${boardId}`}
                readOnly
                className="flex-1 font-mono text-xs"
              />
              <Button
                variant="outline"
                onClick={handleCopyLink}
                className={cn(
                  "gap-2",
                  linkCopied && "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                )}
              >
                {linkCopied ? (
                  <>
                    <Check className="h-4 w-4 text-green-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <LinkIcon className="h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Anyone with this link will be able to view the board
            </p>
          </div>

          {/* Role Descriptions */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-xs font-medium">Permission levels:</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div><span className="font-medium">Editor:</span> Can edit and comment</div>
              <div><span className="font-medium">Commenter:</span> Can only comment</div>
              <div><span className="font-medium">Viewer:</span> Can only view</div>
              <div><span className="font-medium">Owner:</span> Full control</div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
