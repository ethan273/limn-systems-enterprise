"use client";

import { features } from "@/lib/features";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Flipbooks Library Page
 *
 * Main landing page for the flipbooks feature.
 * Displays all flipbooks with filtering, search, and creation options.
 *
 * FEATURE FLAG: Only accessible when features.flipbooks is enabled
 */
export default function FlipbooksPage() {
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">Flipbooks</h1>
        <p className="text-muted-foreground">
          Create and manage interactive 3D flipbooks for your products
        </p>
      </div>

      {/* Placeholder content - will be implemented in Phase 2 */}
      <div className="bg-card rounded-lg border p-8 text-center">
        <div className="mb-4">
          <svg
            className="mx-auto h-24 w-24 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold mb-2">Coming Soon</h2>
        <p className="text-muted-foreground mb-6">
          The flipbooks feature is currently under development.
          <br />
          This page will display your flipbook library once implementation is complete.
        </p>
        <div className="text-sm text-muted-foreground">
          <p className="font-medium mb-2">Planned Features:</p>
          <ul className="space-y-1">
            <li>• 3D page-turning with WebGL rendering</li>
            <li>• Interactive hotspots for products</li>
            <li>• AI-powered catalog generation</li>
            <li>• Template builder</li>
            <li>• Analytics dashboard</li>
          </ul>
        </div>
      </div>

      {/* Development Info */}
      <div className="mt-6 p-4 bg-muted/50 rounded-lg text-sm">
        <p className="font-medium text-muted-foreground mb-1">
          Development Status:
        </p>
        <p className="text-muted-foreground">
          Phase 1 Complete: Database schema, routing, and feature flags implemented.
        </p>
      </div>
    </div>
  );
}
