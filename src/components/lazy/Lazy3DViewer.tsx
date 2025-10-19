'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Lazy-loaded 3D Model Viewer
 * Phase 4: Bundle Optimization
 *
 * Only loads Three.js when component is rendered
 * Reduces initial bundle by ~600KB
 */
export const Lazy3DViewer = dynamic(
  () => import('@/components/models/ThreeJSViewer').catch(() => ({
    default: () => <div>3D Viewer not available</div>
  })),
  {
    loading: () => (
      <div className="w-full h-96 flex items-center justify-center bg-muted/30 rounded-lg">
        <div className="space-y-4 w-full p-4">
          <Skeleton className="h-96 w-full rounded-lg" />
          <div className="flex justify-center items-center">
            <p className="text-sm text-muted-foreground">Loading 3D viewer...</p>
          </div>
        </div>
      </div>
    ),
    ssr: false, // Three.js uses WebGL - don't render on server
  }
);
