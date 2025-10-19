'use client';

/**
 * Lazy-loaded 3D Model Viewer
 * Phase 4: Bundle Optimization
 *
 * NOTE: This file is a placeholder for future 3D viewer components.
 * The application doesn't currently have a Three.js viewer, but this
 * infrastructure is ready when it's needed.
 *
 * This export is kept for future compatibility when a 3D viewer
 * component is created in @/components/models/
 */

import { Skeleton } from '@/components/ui/skeleton';

const Viewer3DSkeleton = () => (
  <div className="w-full h-96 flex items-center justify-center bg-muted/30 rounded-lg relative">
    <Skeleton className="h-full w-full rounded-lg" />
    <div className="absolute flex items-center justify-center">
      <p className="text-sm text-muted-foreground">Loading 3D viewer...</p>
    </div>
  </div>
);

// Placeholder component - will be implemented when 3D viewer component is created
export const Lazy3DViewer = Viewer3DSkeleton;
