"use client";

import { features } from "@/lib/features";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Flipbook Viewer Page
 *
 * Displays an individual flipbook with 3D page-turning effects.
 * Will include WebGL rendering, hotspots, and interactive elements.
 *
 * FEATURE FLAG: Only accessible when features.flipbooks is enabled
 */
export default function FlipbookViewerPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();

  // Redirect if feature is disabled
  useEffect(() => {
    if (!features.flipbooks) {
      router.push("/");
    }
  }, [router]);

  // Don't render if feature is disabled
  if (!features.flipbooks) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-primary hover:underline mb-4"
        >
          ← Back to Flipbooks
        </button>
        <h1 className="text-2xl font-bold text-primary">Flipbook Viewer</h1>
        <p className="text-sm text-muted-foreground">ID: {params.id}</p>
      </div>

      {/* Placeholder - WebGL viewer will be implemented here */}
      <div className="bg-card rounded-lg border p-12 text-center min-h-[600px] flex flex-col items-center justify-center">
        <div className="mb-4">
          <svg
            className="mx-auto h-32 w-32 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold mb-2">3D Viewer Coming Soon</h2>
        <p className="text-muted-foreground max-w-md">
          The WebGL/Three.js flipbook viewer will be implemented in Phase 2.
          This will feature realistic page-turning physics, interactive hotspots,
          and smooth 60fps animations.
        </p>
      </div>
    </div>
  );
}
