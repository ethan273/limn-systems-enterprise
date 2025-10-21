"use client";

/**
 * 3D Flipbook Viewer Wrapper
 *
 * Uses react-pageflip for realistic CSS3D page-turning effects
 */

import { FlipbookViewerV2 } from "./FlipbookViewerV2";
import { FlipbookViewer2D } from "./FlipbookViewer2D";

interface FlipbookViewer3DWrapperProps {
  pages: any[];
  initialPage?: number;
  onPageChange?: (_pageNumber: number) => void;
  onHotspotClick?: (_hotspot: any) => void;
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
  // Use react-pageflip viewer by default for realistic page turning
  if (use3D) {
    return (
      <FlipbookViewerV2
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
