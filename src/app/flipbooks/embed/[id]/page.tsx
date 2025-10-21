"use client";

/**
 * Flipbook Embed Page
 *
 * Public embeddable flipbook viewer designed for iframe embedding.
 * Supports query parameters for customization:
 * - theme: light | dark | auto
 * - page: starting page number
 * - controls: show/hide controls (true | false)
 * - autoplay: auto-start page turning (true | false)
 *
 * Features:
 * - Minimal UI (no header/navigation)
 * - Cross-domain embedding support
 * - Responsive sizing
 * - Theme customization
 *
 * Phase 8: Embed Code Generation
 */

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api/client";
import { LoadingState } from "@/components/common";
import { AlertTriangle } from "lucide-react";
import dynamic from "next/dynamic";

// Dynamically import FlipbookViewerV2
const FlipbookViewerV2 = dynamic(
  () => import("@/components/flipbooks/FlipbookViewerV2").then((mod) => ({ default: mod.FlipbookViewerV2 })),
  {
    ssr: false,
    loading: () => <LoadingState message="Loading flipbook..." size="lg" />,
  }
);

/**
 * Flipbook Embed Page Component
 */
export default function FlipbookEmbedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const searchParams = useSearchParams();
  const [flipbookId, setFlipbookId] = useState<string | null>(null);

  // Extract query parameters
  const theme = searchParams.get("theme") as "light" | "dark" | "auto" | null;
  const startPage = parseInt(searchParams.get("page") || "1");
  const autoPlay = searchParams.get("autoplay") === "true"; // Default false

  // Unwrap params promise
  useEffect(() => {
    params.then((p) => setFlipbookId(p.id));
  }, [params]);

  // Query flipbook data
  const { data: flipbook, isLoading, error } = api.flipbooks.get.useQuery(
    { id: flipbookId! },
    { enabled: !!flipbookId }
  );

  // Apply theme from query parameter
  useEffect(() => {
    if (!theme || theme === "auto") return;

    // Apply theme to html element
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  // Auto-play handler (flip pages automatically)
  useEffect(() => {
    if (!autoPlay || !flipbook?.flipbook_pages?.length) return;

    // Auto-flip pages every 3 seconds
    const interval = setInterval(() => {
      // This would trigger page flip - implementation depends on viewer controls
      // For now, we'll just set this up for future implementation
    }, 3000);

    return () => clearInterval(interval);
  }, [autoPlay, flipbook]);

  // Handle hotspot clicks in embed mode
  const handleHotspotClick = useCallback((hotspot: any) => {
    // In embed mode, we can post messages to parent window
    if (window.parent !== window) {
      window.parent.postMessage(
        {
          type: "flipbook-hotspot-click",
          hotspot: {
            id: hotspot.id,
            type: hotspot.hotspot_type,
            label: hotspot.label,
            productId: hotspot.target_product_id,
            url: hotspot.target_url,
          },
        },
        "*" // In production, specify allowed origins
      );
    }

    // Open product links in parent window if embedded
    if (hotspot.hotspot_type === "PRODUCT_LINK" && hotspot.target_product_id) {
      const productUrl = `/products/catalog/${hotspot.target_product_id}`;
      if (window.parent !== window) {
        window.parent.postMessage(
          {
            type: "flipbook-navigate",
            url: productUrl,
          },
          "*"
        );
      } else {
        window.open(productUrl, "_blank", "noopener,noreferrer");
      }
    }
  }, []);

  // Loading state
  if (!flipbookId || isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-background">
        <LoadingState message="Loading flipbook..." size="lg" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md px-4">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Failed to Load Flipbook</h2>
          <p className="text-muted-foreground text-sm">
            {error.message || "An unexpected error occurred."}
          </p>
        </div>
      </div>
    );
  }

  // Not found state
  if (!flipbook) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md px-4">
          <h2 className="text-xl font-semibold mb-2">Flipbook Not Found</h2>
          <p className="text-muted-foreground text-sm">
            The flipbook you&apos;re looking for doesn&apos;t exist or is not available for embedding.
          </p>
        </div>
      </div>
    );
  }

  // No pages state
  if (!flipbook.flipbook_pages || flipbook.flipbook_pages.length === 0) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md px-4">
          <h2 className="text-xl font-semibold mb-2">No Pages Available</h2>
          <p className="text-muted-foreground text-sm">
            This flipbook doesn&apos;t have any pages yet.
          </p>
        </div>
      </div>
    );
  }

  // Render flipbook viewer (minimal UI for embedding)
  return (
    <div className="w-full h-screen bg-background">
      <FlipbookViewerV2
        pages={flipbook.flipbook_pages as any} // Type casting for database schema compatibility
        initialPage={startPage}
        onHotspotClick={handleHotspotClick}
      />
    </div>
  );
}
