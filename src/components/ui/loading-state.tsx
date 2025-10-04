"use client";

/**
 * Loading State Components
 *
 * Provides consistent loading skeletons and spinners
 * for better perceived performance during data fetching
 *
 * @module LoadingState
 */

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Full page loading spinner
 */
export function PageLoading() {
 return (
 <div className="flex items-center justify-center min-h-[400px]">
 <div className="flex flex-col items-center gap-3">
 <Loader2 className="h-8 w-8 animate-spin text-info" aria-hidden="true" />
 <p className="text-sm text-tertiary">Loading...</p>
 </div>
 </div>
 );
}

/**
 * Table skeleton loader
 */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
 return (
 <div className="space-y-3">
 {Array.from({ length: rows }).map((_, i) => (
 <div
 key={i}
 className="h-16 card rounded-lg animate-pulse"
 aria-hidden="true"
 />
 ))}
 </div>
 );
}

/**
 * Card skeleton loader
 */
export function CardSkeleton({ count = 3 }: { count?: number }) {
 return (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {Array.from({ length: count }).map((_, i) => (
 <div
 key={i}
 className="h-48 card rounded-lg animate-pulse"
 aria-hidden="true"
 />
 ))}
 </div>
 );
}

/**
 * Inline spinner
 */
export function Spinner({ className }: { className?: string }) {
 return (
 <Loader2
 className={cn("h-4 w-4 animate-spin", className)}
 aria-label="Loading"
 />
 );
}

/**
 * Page skeleton with header and content
 */
export function PageSkeleton() {
 return (
 <div className="p-6 space-y-6">
 {/* Header skeleton */}
 <div className="space-y-3">
 <div className="h-8 w-48 card rounded animate-pulse" aria-hidden="true" />
 <div className="h-4 w-96 card rounded animate-pulse" aria-hidden="true" />
 </div>

 {/* Stats cards skeleton */}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
 {Array.from({ length: 4 }).map((_, i) => (
 <div
 key={i}
 className="h-24 card rounded-lg animate-pulse"
 aria-hidden="true"
 />
 ))}
 </div>

 {/* Content skeleton */}
 <div className="space-y-3">
 {Array.from({ length: 6 }).map((_, i) => (
 <div
 key={i}
 className="h-20 card rounded-lg animate-pulse"
 aria-hidden="true"
 />
 ))}
 </div>
 </div>
 );
}
