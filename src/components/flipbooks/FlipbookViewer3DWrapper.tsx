"use client";

/**
 * 3D Flipbook Viewer Wrapper
 *
 * Uses CSS 3D transforms for page-turn effects (compatible with React 19)
 */

import { FlipbookViewerCSS3D } from "./FlipbookViewerCSS3D";
import { FlipbookViewer2D } from "./FlipbookViewer2D";

interface FlipbookViewer3DWrapperProps {
  pages: any[];
  initialPage?: number;
  onPageChange?: (pageNumber: number) => void;
  onHotspotClick?: (hotspot: any) => void;
  onClose?: () => void;
  use3D?: boolean;
}

export function FlipbookViewer3DWrapper({
  pages,
  initialPage,
  onPageChange,
  onHotspotClick,
  onClose,
  use3D = true,
}: FlipbookViewer3DWrapperProps) {
  // Use CSS 3D viewer by default (compatible with React 19)
  if (use3D) {
    return (
      <FlipbookViewerCSS3D
        pages={pages}
        initialPage={initialPage}
        onPageChange={onPageChange}
        onHotspotClick={onHotspotClick}
        onClose={onClose}
      />
    );
  }

  // Fallback to 2D viewer
  return (
    <FlipbookViewer2D
      pages={pages}
      initialPage={initialPage}
      onPageChange={onPageChange}
      onHotspotClick={onHotspotClick}
      onClose={onClose}
    />
  );
}
