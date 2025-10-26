"use client";

/**
 * Link Type Selector Component
 *
 * Allows users to choose hotspot target type and enter details
 * Supports: Product links, External URLs, Page links, Video embeds
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Link2, ShoppingBag, FileText, Video } from "lucide-react";

interface LinkTypeSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelectProduct: () => void;
  onSelectUrl: (_url: string, _label?: string) => void;
  onSelectPage: (_pageNumber: number) => void;
  totalPages?: number;
}

export function LinkTypeSelector({
  open,
  onClose,
  onSelectProduct,
  onSelectUrl,
  onSelectPage,
  totalPages = 1,
}: LinkTypeSelectorProps) {
  const [linkType, setLinkType] = useState<'product' | 'url' | 'page' | 'video'>('product');
  const [externalUrl, setExternalUrl] = useState('');
  const [urlLabel, setUrlLabel] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const [videoUrl, setVideoUrl] = useState('');

  const handleSubmit = () => {
    if (linkType === 'product') {
      onSelectProduct();
    } else if (linkType === 'url' && externalUrl) {
      onSelectUrl(externalUrl, urlLabel || undefined);
    } else if (linkType === 'page') {
      onSelectPage(pageNumber);
    } else if (linkType === 'video' && videoUrl) {
      onSelectUrl(videoUrl, urlLabel || 'Video');
    }
  };

  const isValid = () => {
    if (linkType === 'product') return true;
    if (linkType === 'url') return externalUrl.trim().length > 0;
    if (linkType === 'page') return pageNumber >= 1 && pageNumber <= totalPages;
    if (linkType === 'video') return videoUrl.trim().length > 0;
    return false;
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configure Hotspot Link</DialogTitle>
          <DialogDescription>
            Choose what this hotspot should link to when clicked
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Link Type Selector */}
          <RadioGroup value={linkType} onValueChange={(value: any) => setLinkType(value)}>
            <div className="space-y-3">
              {/* Product Link */}
              <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                <RadioGroupItem value="product" id="type-product" />
                <Label htmlFor="type-product" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2 font-medium">
                    <ShoppingBag className="h-4 w-4" />
                    Product from Catalog
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Link to a product in your catalog
                  </p>
                </Label>
              </div>

              {/* External URL */}
              <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                <RadioGroupItem value="url" id="type-url" />
                <Label htmlFor="type-url" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2 font-medium">
                    <Link2 className="h-4 w-4" />
                    External Website
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Link to any external URL
                  </p>
                </Label>
              </div>

              {/* Page Link */}
              <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                <RadioGroupItem value="page" id="type-page" />
                <Label htmlFor="type-page" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2 font-medium">
                    <FileText className="h-4 w-4" />
                    Jump to Page
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Navigate to another page in this flipbook
                  </p>
                </Label>
              </div>

              {/* Video Embed */}
              <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                <RadioGroupItem value="video" id="type-video" />
                <Label htmlFor="type-video" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2 font-medium">
                    <Video className="h-4 w-4" />
                    Video (YouTube, Vimeo)
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Embed a video player
                  </p>
                </Label>
              </div>
            </div>
          </RadioGroup>

          {/* Conditional inputs based on link type */}
          {linkType === 'url' && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="external-url">URL *</Label>
                <Input
                  id="external-url"
                  type="url"
                  placeholder="https://example.com"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="url-label">Label (optional)</Label>
                <Input
                  id="url-label"
                  placeholder="Visit our website"
                  value={urlLabel}
                  onChange={(e) => setUrlLabel(e.target.value)}
                />
              </div>
            </div>
          )}

          {linkType === 'page' && (
            <div>
              <Label htmlFor="page-number">Page Number (1-{totalPages})</Label>
              <Input
                id="page-number"
                type="number"
                min={1}
                max={totalPages}
                value={pageNumber}
                onChange={(e) => setPageNumber(parseInt(e.target.value) || 1)}
              />
            </div>
          )}

          {linkType === 'video' && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="video-url">Video URL *</Label>
                <Input
                  id="video-url"
                  type="url"
                  placeholder="https://youtube.com/watch?v=..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Supports YouTube, Vimeo, and other video platforms
                </p>
              </div>
              <div>
                <Label htmlFor="video-label">Label (optional)</Label>
                <Input
                  id="video-label"
                  placeholder="Watch video"
                  value={urlLabel}
                  onChange={(e) => setUrlLabel(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={!isValid()}
            >
              {linkType === 'product' ? 'Select Product' : 'Create Hotspot'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
