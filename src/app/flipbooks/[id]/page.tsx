"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import { ArrowLeft, Edit, Eye, BookOpen, Maximize2, AlertTriangle, RefreshCw, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LoadingState, PageHeader, EmptyState } from "@/components/common";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { EmbedCodeGenerator } from "@/components/flipbooks/EmbedCodeGenerator";
import { ShareLinkManager } from "@/components/flipbooks/ShareLinkManager";
import { FlipbookAnalytics } from "@/components/flipbooks/FlipbookAnalytics";
import { HotspotHeatMap } from "@/components/flipbooks/HotspotHeatMap";

// Dynamically import 3D flipbook viewer to reduce initial bundle size
const FlipbookViewer3DWrapper = dynamic(
  () => import("@/components/flipbooks/FlipbookViewer3DWrapper").then((mod) => mod.FlipbookViewer3DWrapper),
  {
    ssr: false, // Disable server-side rendering for 3D viewer
    loading: () => <LoadingState message="Loading 3D viewer..." size="lg" />,
  }
);

/**
 * Flipbook Viewer Page
 *
 * Displays an individual flipbook with 3D page-turning effects.
 * Includes WebGL rendering, hotspots, and interactive elements.
 */
export default function FlipbookViewerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [use3D, _setUse3D] = useState(true); // Try 3D by default
  const [flipbookId, setFlipbookId] = useState<string | null>(null);

  // Unwrap params promise
  useEffect(() => {
    params.then((p) => setFlipbookId(p.id));
  }, [params]);

  // Query flipbook data - must be called unconditionally
  const { data: flipbook, isLoading, error } = api.flipbooks.get.useQuery(
    { id: flipbookId! },
    { enabled: !!flipbookId } // Only run query when ID is available
  );

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  // Don't render if ID not loaded
  if (!flipbookId) {
    return null;
  }

  // Handle query error
  if (error) {
    return (
      <div className="page-container">
        <PageHeader
          title="Flipbook Viewer"
          subtitle="Interactive flipbook"
        />
        <EmptyState
          icon={AlertTriangle}
          title="Failed to load flipbook"
          description={error.message || "An unexpected error occurred. Please try again."}
          action={{
            label: 'Try Again',
            onClick: () => utils.flipbooks.get.invalidate(),
            icon: RefreshCw,
          }}
        />
      </div>
    );
  }

  if (isLoading) {
    return <LoadingState message="Loading flipbook..." size="lg" />;
  }

  if (!flipbook) {
    return (
      <div className="page-container">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-2">Flipbook Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The flipbook you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.
          </p>
          <Button onClick={() => router.push("/flipbooks")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Library
          </Button>
        </div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    DRAFT: 'status-warning',
    PUBLISHED: 'status-success',
    ARCHIVED: 'status-muted',
  };

  // Handle hotspot clicks
  const handleHotspotClick = (hotspot: any) => {
    toast.info(`Product: ${hotspot.product.name}`, {
      description: `SKU: ${hotspot.product.sku}`,
      action: {
        label: "View Product",
        onClick: () => router.push(`/products/catalog/${hotspot.product.id}`),
      },
    });
  };

  // Handle page changes
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Check if we have pages to show
  const hasPages = flipbook.flipbook_pages && flipbook.flipbook_pages.length > 0;

  return (
    <>
      <div className="page-container">
        {/* Page Header */}
        <PageHeader
          title={flipbook.title}
          subtitle={flipbook.description || 'Interactive flipbook'}
          actions={[
            {
              label: 'Back to Library',
              icon: ArrowLeft,
              variant: 'outline',
              onClick: () => router.push("/flipbooks"),
            },
            {
              label: 'Edit',
              icon: Edit,
              onClick: () => router.push(`/flipbooks/builder?id=${flipbookId}`),
            },
            ...(hasPages ? [{
              label: 'Fullscreen',
              icon: Maximize2,
              onClick: () => setIsFullscreen(true),
            }] : []),
          ]}
        />

        {/* Flipbook Info Bar */}
        <div className="bg-card rounded-lg border p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {/* FIXME: status badge disabled - status field is Unsupported type in Prisma */}
              {/* <div className="flex items-center gap-2">
                <Badge variant="outline" className={statusColors[flipbook.status]}>
                  {flipbook.status}
                </Badge>
              </div> */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BookOpen className="h-4 w-4" />
                <span>{flipbook.page_count || 0} pages</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Eye className="h-4 w-4" />
                <span>{flipbook.view_count || 0} views</span>
              </div>
              {hasPages && (
                <div className="text-sm text-muted-foreground">
                  Currently viewing page {currentPage} of {flipbook.flipbook_pages.length}
                </div>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              Created {formatDistanceToNow(new Date(flipbook.created_at), { addSuffix: true })}
            </div>
          </div>
        </div>

        {/* Flipbook Viewer with 3D/2D Toggle */}
        {hasPages ? (
          <div className="bg-card rounded-lg border overflow-hidden h-[700px]">
            <FlipbookViewer3DWrapper
              pages={flipbook.flipbook_pages}
              initialPage={1}
              onPageChange={handlePageChange}
              onHotspotClick={handleHotspotClick}
              use3D={use3D}
            />
          </div>
        ) : (
        <div className="bg-card rounded-lg border p-12 min-h-[600px] flex flex-col items-center justify-center">
          <div className="text-center">
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
            <h2 className="text-xl font-semibold mb-2">No Pages Yet</h2>
            <p className="text-muted-foreground max-w-md mb-6">
              Upload a PDF or images to get started with your flipbook.
            </p>
            <Button onClick={() => router.push(`/flipbooks/builder?id=${flipbookId}`)}>
              <Edit className="h-4 w-4 mr-2" />
              Go to Builder
            </Button>
          </div>
        </div>
      )}

      {/* Embed Code Section */}
      {hasPages && (
        <div className="bg-card rounded-lg border p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Embed Code</h3>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Code className="h-4 w-4 mr-2" />
                  Get Embed Code
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Embed {flipbook.title}</DialogTitle>
                </DialogHeader>
                <EmbedCodeGenerator
                  flipbookId={flipbookId}
                  title={flipbook.title}
                />
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-sm text-muted-foreground">
            Generate embed code to add this flipbook to your website, blog, or any other platform.
          </p>
        </div>
      )}

      {/* Share Links Section */}
      {hasPages && (
        <div className="bg-card rounded-lg border p-6 mt-6">
          <ShareLinkManager
            flipbookId={flipbookId}
            flipbookTitle={flipbook.title}
          />
        </div>
      )}

      {/* Analytics Section */}
      {hasPages && (
        <div className="mt-6">
          <FlipbookAnalytics flipbookId={flipbookId} />
        </div>
      )}

      {/* Heat Map Section */}
      {hasPages && (
        <div className="mt-6">
          <HotspotHeatMap flipbookId={flipbookId} />
        </div>
      )}

      {/* Flipbook Details */}
      <div className="grid grid-cols-2 gap-6 mt-6">
        <div className="bg-card rounded-lg border p-6">
          <h3 className="font-semibold mb-4">Details</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Created by</dt>
              <dd className="font-medium">{flipbook.user_profiles?.full_name || 'Unknown'}</dd>
            </div>
            {/* FIXME: status display disabled - status field is Unsupported type in Prisma */}
            {/* <div className="flex justify-between">
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                <Badge variant="outline" className={statusColors[flipbook.status]}>
                  {flipbook.status}
                </Badge>
              </dd>
            </div> */}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Total Views</dt>
              <dd className="font-medium">{flipbook.view_count || 0}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Page Count</dt>
              <dd className="font-medium">{flipbook.page_count || 0}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <h3 className="font-semibold mb-4">Recent Versions</h3>
          {flipbook.flipbook_versions && flipbook.flipbook_versions.length > 0 ? (
            <div className="space-y-2">
              {flipbook.flipbook_versions.map((version: any) => (
                <div key={version.id} className="text-sm p-2 bg-muted/50 rounded">
                  <div className="flex justify-between">
                    <span className="font-medium">v{version.version_number}</span>
                    <span className="text-muted-foreground text-xs">
                      {formatDistanceToNow(new Date(version.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No version history yet</p>
          )}
        </div>
      </div>
    </div>

    {/* Fullscreen Overlay */}
    {isFullscreen && hasPages && (
      <div className="fixed inset-0 z-50 bg-background">
        <FlipbookViewer3DWrapper
          pages={flipbook.flipbook_pages}
          initialPage={currentPage}
          onPageChange={handlePageChange}
          onHotspotClick={handleHotspotClick}
          onClose={() => setIsFullscreen(false)}
          use3D={use3D}
        />
      </div>
    )}
    </>
  );
}
