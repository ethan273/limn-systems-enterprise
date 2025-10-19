'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Lazy-loaded PDF Viewer
 * Phase 4: Bundle Optimization
 *
 * Only loads PDF.js when component is rendered
 * Reduces initial bundle by ~500KB
 */
export const LazyPDFViewer = dynamic(
  () => import('@/components/documents/PDFViewer').catch(() => ({
    default: () => <div>PDF Viewer not available</div>
  })),
  {
    loading: () => (
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
    ),
    ssr: false, // PDF.js uses Canvas API - don't render on server
  }
);
