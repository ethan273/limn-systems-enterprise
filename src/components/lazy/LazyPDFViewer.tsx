'use client';

/**
 * Lazy-loaded PDF Viewer
 * Phase 4: Bundle Optimization
 *
 * NOTE: This file is a placeholder for future PDF viewer components.
 * The application currently uses PDFViewer from @/components/shop-drawings
 * which is already dynamically imported in pages that use it.
 *
 * This export is kept for future compatibility when a centralized
 * PDF viewer component is created in @/components/documents/
 */

import { Skeleton } from '@/components/ui/skeleton';

const PDFSkeleton = () => (
  <div className="w-full h-96 flex items-center justify-center bg-muted/30">
    <div className="space-y-4 w-full p-4">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-12 w-full" />
      <div className="flex justify-center items-center h-32">
        <p className="text-sm text-muted-foreground">Loading PDF viewer...</p>
      </div>
    </div>
  </div>
);

// Placeholder component - will be implemented when PDF viewer component is created
export const LazyPDFViewer = PDFSkeleton;
