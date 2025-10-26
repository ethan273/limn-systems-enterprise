"use client";

import React, { useState, useCallback } from "react";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Share2,
  Plus,
  Copy,
  ExternalLink,
  MoreVertical,
  Edit,
  Trash2,
  QrCode,
  Calendar,
  Eye,
  Clock,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { format } from "date-fns";

interface ShareLinkManagerProps {
  flipbookId: string;
  flipbookTitle?: string;
  baseUrl?: string;
}

interface ShareLinkFormData {
  label: string;
  vanitySlug: string;
  expiresAt: string;
  theme: "light" | "dark" | "auto";
  startPage: number;
  showControls: boolean;
  password: string; // Password protection
  requirePassword: boolean; // Toggle password requirement
}

export function ShareLinkManager({
  flipbookId,
  flipbookTitle = "Flipbook",
  baseUrl = typeof window !== "undefined" ? window.location.origin : "",
}: ShareLinkManagerProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState<ShareLinkFormData>({
    label: "",
    vanitySlug: "",
    expiresAt: "",
    theme: "auto",
    startPage: 1,
    showControls: true,
    password: "",
    requirePassword: false,
  });

  const utils = api.useUtils();

  // Query share links
  const { data: shareLinks, isLoading } = api.flipbooks.getShareLinks.useQuery({
    flipbookId,
  });

  // Mutations
  const createMutation = api.flipbooks.createShareLink.useMutation({
    onSuccess: () => {
      toast.success("Share link created successfully");
      setCreateDialogOpen(false);
      resetForm();
      void utils.flipbooks.getShareLinks.invalidate({ flipbookId });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create share link");
    },
  });

  const updateMutation = api.flipbooks.updateShareLink.useMutation({
    onSuccess: () => {
      toast.success("Share link updated successfully");
      setEditingLinkId(null);
      resetForm();
      void utils.flipbooks.getShareLinks.invalidate({ flipbookId });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update share link");
    },
  });

  const deleteMutation = api.flipbooks.deleteShareLink.useMutation({
    onSuccess: () => {
      toast.success("Share link deleted successfully");
      void utils.flipbooks.getShareLinks.invalidate({ flipbookId });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete share link");
    },
  });

  // Reset form
  const resetForm = useCallback(() => {
    setFormData({
      label: "",
      vanitySlug: "",
      expiresAt: "",
      theme: "auto",
      startPage: 1,
      showControls: true,
      password: "",
      requirePassword: false,
    });
  }, []);

  // Handle create share link
  const handleCreate = useCallback(() => {
    const settings = {
      theme: formData.theme,
      startPage: formData.startPage,
      showControls: formData.showControls,
      // Include password if requirePassword is enabled
      ...(formData.requirePassword && formData.password ? { password: formData.password } : {}),
    };

    createMutation.mutate({
      flipbookId,
      label: formData.label || undefined,
      vanitySlug: formData.vanitySlug || undefined,
      expiresAt: formData.expiresAt ? new Date(formData.expiresAt) : undefined,
      settings,
    });
  }, [flipbookId, formData, createMutation]);

  // Handle update share link
  const handleUpdate = useCallback(
    (id: string) => {
      updateMutation.mutate({
        id,
        label: formData.label || undefined,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt) : null,
        isActive: true,
      });
    },
    [formData, updateMutation]
  );

  // Handle delete share link
  const handleDelete = useCallback(
    (id: string, label?: string | null) => {
      if (
        window.confirm(
          `Are you sure you want to delete the share link${label ? ` "${label}"` : ""}? This action cannot be undone.`
        )
      ) {
        deleteMutation.mutate({ id });
      }
    },
    [deleteMutation]
  );

  // Handle toggle active status
  const handleToggleActive = useCallback(
    (id: string, currentStatus: boolean) => {
      updateMutation.mutate({
        id,
        isActive: !currentStatus,
      });
    },
    [updateMutation]
  );

  // Build share URL
  const buildShareUrl = useCallback(
    (token: string, vanitySlug?: string | null) => {
      if (vanitySlug) {
        return `${baseUrl}/s/${vanitySlug}`;
      }
      return `${baseUrl}/s/${token}`;
    },
    [baseUrl]
  );

  // Copy URL to clipboard
  const copyUrl = useCallback((url: string, label?: string | null) => {
    navigator.clipboard.writeText(url);
    toast.success(
      `${label ? `"${label}" link` : "Share link"} copied to clipboard`
    );
  }, []);

  // Open QR code dialog
  const showQrCode = useCallback((url: string) => {
    setQrCodeUrl(url);
  }, []);

  // Start editing
  const startEditing = useCallback(
    (link: any) => {
      setEditingLinkId(link.id);
      setFormData({
        label: link.label || "",
        vanitySlug: link.vanity_slug || "",
        expiresAt: link.expires_at
          ? format(new Date(link.expires_at), "yyyy-MM-dd")
          : "",
        theme: (link.settings as any)?.theme || "auto",
        startPage: (link.settings as any)?.startPage || 1,
        showControls: (link.settings as any)?.showControls ?? true,
      });
    },
    []
  );

  // Check if link is expired
  const isExpired = useCallback((expiresAt?: Date | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  }, []);

  // Format date
  const formatDate = useCallback((date?: Date | null) => {
    if (!date) return "Never";
    return format(new Date(date), "MMM d, yyyy");
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          <h3 className="font-semibold text-lg">Share Links</h3>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Share Link
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Share Link</DialogTitle>
              <DialogDescription>
                Generate a shareable link for {flipbookTitle}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Label */}
              <div className="space-y-2">
                <Label htmlFor="label">Label (optional)</Label>
                <Input
                  id="label"
                  placeholder="e.g., Client Presentation, Marketing Campaign"
                  value={formData.label}
                  onChange={(e) =>
                    setFormData({ ...formData, label: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  A friendly name to help you identify this link
                </p>
              </div>

              {/* Vanity Slug */}
              <div className="space-y-2">
                <Label htmlFor="vanitySlug">Custom URL (optional)</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {baseUrl}/s/
                  </span>
                  <Input
                    id="vanitySlug"
                    placeholder="my-custom-url"
                    value={formData.vanitySlug}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        vanitySlug: e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]/g, ""),
                      })
                    }
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Use lowercase letters, numbers, and hyphens only
                </p>
              </div>

              {/* Expiration Date */}
              <div className="space-y-2">
                <Label htmlFor="expiresAt">Expiration Date (optional)</Label>
                <Input
                  id="expiresAt"
                  type="date"
                  value={formData.expiresAt}
                  min={format(new Date(), "yyyy-MM-dd")}
                  onChange={(e) =>
                    setFormData({ ...formData, expiresAt: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Link will become inaccessible after this date
                </p>
              </div>

              {/* Theme */}
              <div className="space-y-2">
                <Label htmlFor="theme">Default Theme</Label>
                <Select
                  value={formData.theme}
                  onValueChange={(value: "light" | "dark" | "auto") =>
                    setFormData({ ...formData, theme: value })
                  }
                >
                  <SelectTrigger id="theme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto (System)</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Start Page */}
              <div className="space-y-2">
                <Label htmlFor="startPage">Start Page</Label>
                <Input
                  id="startPage"
                  type="number"
                  min="1"
                  value={formData.startPage}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      startPage: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>

              {/* Show Controls */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="showControls">Show Navigation Controls</Label>
                  <p className="text-xs text-muted-foreground">
                    Display navigation buttons and page controls
                  </p>
                </div>
                <Switch
                  id="showControls"
                  checked={formData.showControls}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, showControls: checked })
                  }
                />
              </div>

              {/* Password Protection */}
              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="requirePassword">Password Protection</Label>
                    <p className="text-xs text-muted-foreground">
                      Require a password to view this flipbook
                    </p>
                  </div>
                  <Switch
                    id="requirePassword"
                    checked={formData.requirePassword}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, requirePassword: checked })
                    }
                  />
                </div>

                {formData.requirePassword && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Users will need to enter this password to view the flipbook
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setCreateDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Creating..." : "Create Link"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Share Links Table */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading share links...
        </div>
      ) : !shareLinks || shareLinks.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
          <Share2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="mb-2">No share links yet</p>
          <p className="text-sm">
            Create a share link to allow others to view this flipbook
          </p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shareLinks.map((link) => {
                const shareUrl = buildShareUrl(link.token, link.vanity_slug);
                const expired = isExpired(link.expires_at);

                return (
                  <TableRow key={link.id}>
                    {/* Label */}
                    <TableCell>
                      {link.label || (
                        <span className="text-muted-foreground italic">
                          Unnamed Link
                        </span>
                      )}
                    </TableCell>

                    {/* URL */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {link.vanity_slug || link.token.substring(0, 12)}...
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyUrl(shareUrl, link.label)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(shareUrl, "_blank")}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>

                    {/* Views */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <span>{link.view_count}</span>
                        <span className="text-xs text-muted-foreground">
                          ({link.unique_view_count} unique)
                        </span>
                      </div>
                    </TableCell>

                    {/* Expires */}
                    <TableCell>
                      {expired ? (
                        <Badge variant="destructive">Expired</Badge>
                      ) : link.expires_at ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {formatDate(link.expires_at)}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          Never
                        </span>
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Switch
                        checked={link.is_active && !expired}
                        disabled={expired}
                        onCheckedChange={() =>
                          handleToggleActive(link.id, link.is_active)
                        }
                      />
                    </TableCell>

                    {/* Created */}
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(link.created_at)}
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => copyUrl(shareUrl, link.label)}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy URL
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => showQrCode(shareUrl)}>
                            <QrCode className="h-4 w-4 mr-2" />
                            Show QR Code
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => startEditing(link)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(link.id, link.label)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* QR Code Dialog */}
      <Dialog open={!!qrCodeUrl} onOpenChange={() => setQrCodeUrl(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>QR Code</DialogTitle>
            <DialogDescription>
              Scan this QR code to open the share link
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-6">
            {qrCodeUrl && (
              <QRCodeSVG value={qrCodeUrl} size={256} level="H" includeMargin />
            )}
            <p className="text-sm text-muted-foreground text-center">
              {qrCodeUrl}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingLinkId}
        onOpenChange={() => {
          setEditingLinkId(null);
          resetForm();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Share Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-label">Label</Label>
              <Input
                id="edit-label"
                value={formData.label}
                onChange={(e) =>
                  setFormData({ ...formData, label: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-expiresAt">Expiration Date</Label>
              <Input
                id="edit-expiresAt"
                type="date"
                value={formData.expiresAt}
                min={format(new Date(), "yyyy-MM-dd")}
                onChange={(e) =>
                  setFormData({ ...formData, expiresAt: e.target.value })
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setEditingLinkId(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => editingLinkId && handleUpdate(editingLinkId)}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
