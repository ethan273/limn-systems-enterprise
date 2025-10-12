"use client";

/**
 * 3D Flipbook Viewer Wrapper
 *
 * Dynamically loads the 3D viewer to isolate React Three Fiber compatibility issues
 */

import { useState, useEffect, Suspense, lazy } from "react";
import { LoadingState } from "@/components/common";
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
  use3D = false,
}: FlipbookViewer3DWrapperProps) {
  const [hasError, setHasError] = useState(false);
  const [FlipbookViewer3D, setFlipbookViewer3D] = useState<any>(null);

  useEffect(() => {
    if (use3D && !hasError) {
      // Try to dynamically import the 3D viewer
      import("./FlipbookViewer")
        .then((module) => {
          setFlipbookViewer3D(() => module.FlipbookViewer);
        })
        .catch((error) => {
          console.warn("Failed to load 3D viewer, falling back to 2D:", error);
          setHasError(true);
        });
    }
  }, [use3D, hasError]);

  // Use 2D viewer if 3D is not requested, has error, or not loaded yet
  if (!use3D || hasError || !FlipbookViewer3D) {
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

  // Render 3D viewer
  return (
    <Suspense fallback={<LoadingState message="Loading 3D viewer..." />}>
      <FlipbookViewer3D
        pages={pages}
        initialPage={initialPage}
        onPageChange={onPageChange}
        onHotspotClick={onHotspotClick}
        onClose={onClose}
      />
    </Suspense>
  );
}
