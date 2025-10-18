"use client";

import { useState } from "react";
import Image from "next/image";
import { FileImage, Download, Trash2, ExternalLink, Package, Tag, Star, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { api } from "@/lib/api/client";

interface MediaItem {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  media_type?: string;
  use_for_packaging?: boolean;
  use_for_labeling?: boolean;
  use_for_marketing?: boolean;
  is_primary_image?: boolean;
  display_order?: number;
  file_source?: "supabase" | "google_drive";
  google_drive_file_id?: string;
  uploaded_at?: string;
  uploaded_by_name?: string;
}

interface MediaGalleryProps {
  entityType: "collection" | "concept" | "prototype" | "catalog_item" | "production_order";
  entityId: string;
  media: MediaItem[];
  onDelete?: (_mediaId: string) => void;
  onRefresh?: () => void;
}

const MEDIA_TYPE_LABELS: Record<string, string> = {
  isometric: "Isometric View",
  line_drawing: "Line Drawing",
  rendering: "3D Rendering",
  photo: "Photograph",
  "3d_model": "3D Model",
  technical_drawing: "Technical Drawing",
  other: "Other",
};

export function MediaGallery({
  media,
  onDelete,
  onRefresh,
}: MediaGalleryProps) {
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState<string | null>(null);

  // Delete mutation
  const deleteMutation = api.documents.delete.useMutation({
    onSuccess: () => {
      toast.success("Media deleted successfully");
      setDeleteDialogOpen(false);
      setMediaToDelete(null);
      onRefresh?.();
    },
    onError: (error) => {
      console.error("Delete error:", error);
      toast.error("Failed to delete media");
    },
  });

  const handleDelete = async () => {
    if (!mediaToDelete) return;

    // Call tRPC delete mutation
    deleteMutation.mutate({ id: mediaToDelete });

    // Also call the onDelete callback if provided
    onDelete?.(mediaToDelete);
  };

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return mb.toFixed(2) + " MB";
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const openMediaViewer = (item: MediaItem) => {
    setSelectedMedia(item);
  };

  const downloadMedia = (item: MediaItem) => {
    window.open(item.file_url, "_blank");
  };

  if (!media || media.length === 0) {
    return (
      <div className="empty-state">
        <FileImage className="empty-state-icon" />
        <p className="empty-state-title">No media files yet</p>
        <p className="empty-state-description">
          Upload images, documents, or 3D models to get started
        </p>
      </div>
    );
  }

  return (
    <div className="media-gallery">
      <div className="media-grid">
        {media.map((item) => {
          const isImage = item.file_type?.startsWith("image/");
          const isPrimary = item.is_primary_image;

          return (
            <div key={item.id} className={`media-card ${isPrimary ? "media-card-primary" : ""}`}>
              {/* Media Preview */}
              <div className="media-preview" onClick={() => openMediaViewer(item)}>
                {isImage ? (
                  <Image
                    src={item.file_url}
                    alt={item.file_name}
                    width={300}
                    height={300}
                    className="media-preview-image"
                  />
                ) : (
                  <div className="media-preview-icon">
                    <FileImage className="file-icon-large" />
                  </div>
                )}
                {isPrimary && (
                  <div className="media-primary-badge">
                    <Star className="icon-xs" />
                    <span>Primary</span>
                  </div>
                )}
              </div>

              {/* Media Info */}
              <div className="media-info">
                <div className="media-name" title={item.file_name}>
                  {item.file_name}
                </div>

                {/* Metadata Badges */}
                <div className="media-badges">
                  {item.media_type && (
                    <Badge variant="outline" className="media-type-badge">
                      {MEDIA_TYPE_LABELS[item.media_type] || item.media_type}
                    </Badge>
                  )}
                  {item.file_source === "google_drive" && (
                    <Badge variant="secondary" className="storage-badge">
                      Google Drive
                    </Badge>
                  )}
                </div>

                {/* Usage Flags */}
                {(item.use_for_packaging || item.use_for_labeling || item.use_for_marketing) && (
                  <div className="media-usage-flags">
                    {item.use_for_packaging && (
                      <Badge variant="outline" className="usage-badge">
                        <Package className="icon-xs" />
                        Packaging
                      </Badge>
                    )}
                    {item.use_for_labeling && (
                      <Badge variant="outline" className="usage-badge">
                        <Tag className="icon-xs" />
                        Labeling
                      </Badge>
                    )}
                    {item.use_for_marketing && (
                      <Badge variant="outline" className="usage-badge">
                        <Star className="icon-xs" />
                        Marketing
                      </Badge>
                    )}
                  </div>
                )}

                {/* File Details */}
                <div className="media-meta">
                  <span className="media-meta-item">{formatFileSize(item.file_size)}</span>
                  <span className="media-meta-separator">•</span>
                  <span className="media-meta-item">{formatDate(item.uploaded_at)}</span>
                </div>

                {/* Actions */}
                <div className="media-actions">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openMediaViewer(item)}
                    className="media-action-btn"
                  >
                    <Eye className="icon-sm" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => downloadMedia(item)}
                    className="media-action-btn"
                  >
                    <Download className="icon-sm" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setMediaToDelete(item.id);
                      setDeleteDialogOpen(true);
                    }}
                    className="media-action-btn media-action-delete"
                  >
                    <Trash2 className="icon-sm" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Media Viewer Dialog */}
      {selectedMedia && (
        <Dialog open={!!selectedMedia} onOpenChange={() => setSelectedMedia(null)}>
          <DialogContent className="media-viewer-dialog">
            <DialogHeader>
              <DialogTitle>{selectedMedia.file_name}</DialogTitle>
            </DialogHeader>
            <div className="media-viewer-content">
              {selectedMedia.file_type?.startsWith("image/") ? (
                <Image
                  src={selectedMedia.file_url}
                  alt={selectedMedia.file_name}
                  width={1200}
                  height={800}
                  className="media-viewer-image"
                />
              ) : (
                <div className="media-viewer-placeholder">
                  <FileImage className="media-viewer-icon" />
                  <p>Preview not available</p>
                  <Button onClick={() => downloadMedia(selectedMedia)} className="mt-4">
                    <Download className="icon-sm" />
                    Download File
                  </Button>
                </div>
              )}
            </div>
            <DialogFooter className="media-viewer-footer">
              <div className="media-viewer-meta">
                <div className="media-viewer-meta-row">
                  <span className="media-viewer-meta-label">Type:</span>
                  <span className="media-viewer-meta-value">
                    {selectedMedia.media_type
                      ? MEDIA_TYPE_LABELS[selectedMedia.media_type]
                      : "Unknown"}
                  </span>
                </div>
                <div className="media-viewer-meta-row">
                  <span className="media-viewer-meta-label">Size:</span>
                  <span className="media-viewer-meta-value">
                    {formatFileSize(selectedMedia.file_size)}
                  </span>
                </div>
                <div className="media-viewer-meta-row">
                  <span className="media-viewer-meta-label">Storage:</span>
                  <span className="media-viewer-meta-value">
                    {selectedMedia.file_source === "google_drive" ? "Google Drive" : "Supabase"}
                  </span>
                </div>
                {selectedMedia.uploaded_by_name && (
                  <div className="media-viewer-meta-row">
                    <span className="media-viewer-meta-label">Uploaded by:</span>
                    <span className="media-viewer-meta-value">{selectedMedia.uploaded_by_name}</span>
                  </div>
                )}
              </div>
              <div className="media-viewer-actions">
                <Button variant="outline" onClick={() => downloadMedia(selectedMedia)}>
                  <Download className="icon-sm" />
                  Download
                </Button>
                {selectedMedia.file_source === "google_drive" && selectedMedia.google_drive_file_id && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      window.open(
                        `https://drive.google.com/file/d/${selectedMedia.google_drive_file_id}/view`,
                        "_blank"
                      )
                    }
                  >
                    <ExternalLink className="icon-sm" />
                    Open in Drive
                  </Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Media</DialogTitle>
          </DialogHeader>
          <p className="dialog-description">
            Are you sure you want to delete this media file? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
