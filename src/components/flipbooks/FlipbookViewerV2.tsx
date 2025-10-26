"use client";

/**
 * Flipbook Viewer V2 - CSS3D Page Turning
 *
 * Realistic page-flipping viewer using react-pageflip library
 * Provides smooth 60fps CSS3D animations with touch gesture support
 *
 * This replaces the WebGL-based viewer for better performance and compatibility
 */

import { useRef, useState, useEffect, useCallback, forwardRef } from "react";
import HTMLFlipBook from "react-pageflip";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn,
  ZoomOut,
  Menu,
  Maximize,
  Minimize,
  Home as HomeIcon,
  SkipForward,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api/client";
import { TOCPanel } from "@/components/flipbooks/navigation/TOCPanel";
import { VideoPlayerModal } from "@/components/flipbooks/VideoPlayerModal";

interface FlipbookPage {
  id: string;
  page_number: number;
  image_url: string;
  thumbnail_url: string;
  hotspots?: Array<{
    id: string;
    hotspot_type: 'INTERNAL_LINK' | 'EXTERNAL_LINK' | 'PRODUCT_LINK' | 'DOWNLOAD' | 'VIDEO' | 'POPUP' | 'FORM' | 'ADD_TO_CART';
    x_position: number;  // Database column: Decimal(5,2) - matches database schema
    y_position: number;  // Database column: Decimal(5,2) - matches database schema
    width: number;
    height: number;
    label?: string;
    target_url?: string;
    target_page?: number;
    target_product_id?: string;
    popup_content?: any;
    products?: {  // Relation name from Prisma schema
      id: string;
      name: string;
      sku: string;
      // Note: thumbnail_url does not exist in products table
    } | null;
  }>;
}

type FlipbookHotspot = NonNullable<FlipbookPage["hotspots"]>[0];

interface FlipbookViewerV2Props {
  flipbookId?: string;
  pages: FlipbookPage[];
  initialPage?: number;
  onPageChange?: (_pageNumber: number) => void;
  onHotspotClick?: (_hotspot: FlipbookHotspot) => void;
  onClose?: () => void;
  className?: string;
  backgroundColor?: string; // Custom background color for pages
}

/**
 * Page component for react-pageflip
 * Must be forwardRef for react-pageflip to work correctly
 */
const Page = forwardRef<
  HTMLDivElement,
  {
    page: FlipbookPage;
    onHotspotClick?: (_hotspot: FlipbookHotspot) => void;
    onInternalLinkClick?: (_pageNumber: number) => void;
    onVideoClick?: (_url: string, _title?: string) => void;
    backgroundColor?: string;
  }
>(({ page, onHotspotClick, onInternalLinkClick, onVideoClick, backgroundColor = 'white' }, ref) => {
  /**
   * Handle hotspot click based on type
   */
  const handleHotspotClick = (e: React.MouseEvent, hotspot: FlipbookHotspot) => {
    e.stopPropagation();

    switch (hotspot.hotspot_type) {
      case 'INTERNAL_LINK':
        // Navigate to target page
        if (hotspot.target_page && onInternalLinkClick) {
          onInternalLinkClick(hotspot.target_page);
        }
        break;

      case 'EXTERNAL_LINK':
        // Open external URL in new tab
        if (hotspot.target_url) {
          window.open(hotspot.target_url, '_blank', 'noopener,noreferrer');
        }
        break;

      case 'PRODUCT_LINK':
        // Open product modal
        onHotspotClick?.(hotspot);
        break;

      case 'DOWNLOAD':
        // Download file from target_url
        if (hotspot.target_url) {
          const link = document.createElement('a');
          link.href = hotspot.target_url;
          link.download = hotspot.label || 'download';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        break;

      case 'VIDEO':
        // Open video player modal
        if (hotspot.target_url && onVideoClick) {
          onVideoClick(hotspot.target_url, hotspot.label);
        }
        break;

      case 'POPUP':
      case 'FORM':
      case 'ADD_TO_CART':
        // Delegate to parent handler for these types
        onHotspotClick?.(hotspot);
        break;

      default:
        console.warn(`Unknown hotspot type: ${hotspot.hotspot_type}`);
    }
  };

  /**
   * Get hotspot visual style based on type
   */
  const getHotspotStyle = (type: FlipbookHotspot['hotspot_type']) => {
    switch (type) {
      case 'INTERNAL_LINK':
        return 'bg-purple-500/20 border-purple-500 group-hover:bg-purple-500/40';
      case 'EXTERNAL_LINK':
        return 'bg-green-500/20 border-green-500 group-hover:bg-green-500/40';
      case 'PRODUCT_LINK':
        return 'bg-blue-500/20 border-blue-500 group-hover:bg-blue-500/40';
      case 'DOWNLOAD':
        return 'bg-orange-500/20 border-orange-500 group-hover:bg-orange-500/40';
      case 'VIDEO':
        return 'bg-red-500/20 border-red-500 group-hover:bg-red-500/40';
      case 'POPUP':
        return 'bg-yellow-500/20 border-yellow-500 group-hover:bg-yellow-500/40';
      case 'FORM':
        return 'bg-teal-500/20 border-teal-500 group-hover:bg-teal-500/40';
      case 'ADD_TO_CART':
        return 'bg-indigo-500/20 border-indigo-500 group-hover:bg-indigo-500/40';
      default:
        return 'bg-gray-500/20 border-gray-500 group-hover:bg-gray-500/40';
    }
  };

  /**
   * Get hotspot label
   */
  const getHotspotLabel = (hotspot: FlipbookHotspot) => {
    if (hotspot.label) return hotspot.label;

    switch (hotspot.hotspot_type) {
      case 'INTERNAL_LINK':
        return `Go to page ${hotspot.target_page}`;
      case 'EXTERNAL_LINK':
        return hotspot.target_url || 'External link';
      case 'PRODUCT_LINK':
        return hotspot.products?.name || 'View product';
      case 'DOWNLOAD':
        return 'Download file';
      case 'VIDEO':
        return 'Play video';
      case 'POPUP':
        return 'Show info';
      case 'FORM':
        return 'Open form';
      case 'ADD_TO_CART':
        return 'Add to cart';
      default:
        return 'Click here';
    }
  };

  return (
    <div
      ref={ref}
      className="relative h-full w-full shadow-lg overflow-hidden"
      style={{ backgroundColor }}
    >
      {/* Page Image - Fill the entire page area */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={page.image_url}
        alt={`Page ${page.page_number}`}
        className="h-full w-full object-cover"
        draggable={false}
      />

      {/* Hotspots overlay */}
      {page.hotspots && page.hotspots.length > 0 && (
        <div className="absolute inset-0">
          {page.hotspots.map((hotspot) => (
            <button
              key={hotspot.id}
              className="absolute group transition-all hover:scale-105 cursor-pointer"
              style={{
                left: `${hotspot.x_position}%`,
                top: `${hotspot.y_position}%`,
                width: `${hotspot.width}%`,
                height: `${hotspot.height}%`,
              }}
              onClick={(e) => handleHotspotClick(e, hotspot)}
              title={getHotspotLabel(hotspot)}
            >
              {/* Hotspot indicator with type-specific color */}
              <div className={cn(
                "h-full w-full border-2 rounded transition-all",
                getHotspotStyle(hotspot.hotspot_type)
              )} />

              {/* Hotspot label (shows on hover) */}
              <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-10">
                <div className="bg-popover text-popover-foreground px-3 py-2 rounded-lg text-sm whitespace-nowrap shadow-lg border">
                  {getHotspotLabel(hotspot)}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Page number indicator */}
      <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded text-sm">
        {page.page_number}
      </div>
    </div>
  );
});

Page.displayName = "Page";

/**
 * Main Flipbook Viewer V2 Component
 */
export function FlipbookViewerV2({
  flipbookId,
  pages,
  initialPage = 1,
  onPageChange,
  onHotspotClick,
  onClose,
  className,
  backgroundColor = 'white',
}: FlipbookViewerV2Props) {
  const flipBookRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [currentPage, setCurrentPage] = useState(initialPage - 1); // 0-indexed
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTOC, setShowTOC] = useState(false);
  const [bookSize, setBookSize] = useState({ width: 800, height: 1000 });
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<{
    url: string;
    title?: string;
    description?: string;
  } | null>(null);

  const totalPages = pages.length;

  // Fetch TOC data if flipbookId is provided
  const { data: tocData } = api.flipbooks.getTOC.useQuery(
    { flipbookId: flipbookId! },
    { enabled: !!flipbookId }
  );

  // Calculate book size based on container - MAXIMIZE screen usage
  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;

      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;

      // Minimal space for controls - maximize page display area
      const availableHeight = containerHeight - 140; // Reduced from 200px
      const availableWidth = containerWidth - 40; // Reduced from 100px - minimal padding

      // Use actual page dimensions if available, otherwise use full available space
      // Two pages shown at once in spread view
      let width = availableWidth / 2;
      let height = availableHeight;

      // Ensure minimum readable size
      if (width < 400) {
        width = 400;
      }
      if (height < 500) {
        height = 500;
      }

      setBookSize({ width: Math.floor(width), height: Math.floor(height) });
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [showTOC]); // Re-calculate when TOC toggles

  // Navigation handlers
  const goToNextPage = useCallback(() => {
    flipBookRef.current?.pageFlip()?.flipNext();
  }, []);

  const goToPreviousPage = useCallback(() => {
    flipBookRef.current?.pageFlip()?.flipPrev();
  }, []);

  const goToPage = useCallback((pageNumber: number) => {
    // Convert 1-indexed to 0-indexed
    flipBookRef.current?.pageFlip()?.turnToPage(pageNumber - 1);
  }, []);

  const goToFirstPage = useCallback(() => {
    flipBookRef.current?.pageFlip()?.turnToPage(0);
  }, []);

  const goToLastPage = useCallback(() => {
    flipBookRef.current?.pageFlip()?.turnToPage(totalPages - 1);
  }, [totalPages]);

  // Handle page flip event
  const handleFlip = useCallback(
    (e: any) => {
      const newPage = e.data + 1; // Convert to 1-indexed
      setCurrentPage(e.data);
      onPageChange?.(newPage);
    },
    [onPageChange]
  );

  // Fullscreen handlers
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current
        .requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch((err) => console.error("Fullscreen request failed:", err));
    } else {
      document
        .exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch((err) => console.error("Exit fullscreen failed:", err));
    }
  }, []);

  // Monitor fullscreen changes (e.g., ESC key)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        goToNextPage();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToPreviousPage();
      } else if (e.key === "Home") {
        e.preventDefault();
        goToFirstPage();
      } else if (e.key === "End") {
        e.preventDefault();
        goToLastPage();
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === "Escape") {
        e.preventDefault();
        // ESC exits fullscreen first, then closes viewer
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          onClose?.();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,
    toggleFullscreen,
    onClose,
  ]);

  // Handle video hotspot click
  const handleVideoClick = useCallback((url: string, title?: string) => {
    setCurrentVideo({
      url,
      title,
    });
    setVideoModalOpen(true);
  }, []);

  // Handle video modal close
  const handleVideoModalClose = useCallback(() => {
    setVideoModalOpen(false);
    setCurrentVideo(null);
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative h-full w-full bg-background flex",
        className
      )}
    >
      {/* TOC Panel (collapsible sidebar) */}
      {showTOC && tocData?.tocData && (
        <div className="w-80 border-r bg-background flex-shrink-0 z-20 overflow-y-auto">
          <TOCPanel
            tocData={tocData.tocData}
            currentPage={currentPage + 1} // Convert to 1-indexed
            onNavigate={goToPage}
            settings={{
              enabled: true,
              position: "left",
              defaultExpanded: false,
              showPageNumbers: true,
              searchEnabled: true,
            }}
          />
        </div>
      )}

      {/* Main viewer area */}
      <div className="flex-1 relative flex flex-col">
        {/* Top controls */}
        <div className="bg-background border-b px-4 py-3 flex items-center justify-between z-10 flex-shrink-0">
          <div className="flex gap-2">
            {/* TOC Toggle Button */}
            {tocData?.tocData && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowTOC(!showTOC)}
                title={
                  showTOC ? "Hide table of contents" : "Show table of contents"
                }
              >
                <Menu className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={goToFirstPage}
              title="First page (Home)"
            >
              <HomeIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={goToLastPage}
              title="Last page (End)"
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">
              Page {currentPage + 1} of {totalPages}
            </span>
          </div>

          <div className="flex gap-2">
            {/* Zoom buttons - trigger hidden controls */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => document.getElementById("zoom-in-btn")?.click()}
              title="Zoom in (scroll wheel or pinch)"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => document.getElementById("zoom-out-btn")?.click()}
              title="Zoom out (scroll wheel or pinch)"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => document.getElementById("zoom-reset-btn")?.click()}
              title="Reset zoom (double-click page)"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>

            {/* Fullscreen Toggle Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={toggleFullscreen}
              title={
                isFullscreen ? "Exit fullscreen (F)" : "Enter fullscreen (F)"
              }
            >
              {isFullscreen ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )}
            </Button>

            {onClose && (
              <Button variant="outline" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Flipbook Canvas with Zoom */}
        <div className="flex-1 flex items-center justify-center p-8 overflow-hidden">
          <TransformWrapper
            initialScale={1}
            minScale={0.5}
            maxScale={5}
            centerOnInit={true}
            wheel={{ step: 0.1 }}
            pinch={{ step: 5 }}
            doubleClick={{ disabled: false, step: 0.7 }}
          >
            {({ zoomIn, zoomOut, resetTransform }) => (
              <>
                {/* Zoom controls - hidden but accessible via ref */}
                <div className="hidden" id="zoom-controls">
                  <button onClick={() => zoomIn()} id="zoom-in-btn">Zoom In</button>
                  <button onClick={() => zoomOut()} id="zoom-out-btn">Zoom Out</button>
                  <button onClick={() => resetTransform()} id="zoom-reset-btn">Reset</button>
                </div>

                <TransformComponent
                  wrapperStyle={{ width: "100%", height: "100%" }}
                  contentStyle={{ display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <HTMLFlipBook
                    ref={flipBookRef}
                    width={bookSize.width}
                    height={bookSize.height}
                    size="stretch"
                    minWidth={300}
                    maxWidth={2000} // Increased from 1200 to allow larger displays
                    minHeight={400}
                    maxHeight={2400} // Increased from 1680 to fill larger screens
                    drawShadow={true}
                    flippingTime={1000} // 1 second page turn
                    usePortrait={false}
                    startPage={initialPage - 1} // 0-indexed
                    autoSize={true}
                    style={{}}
                    startZIndex={0}
                    maxShadowOpacity={0.5}
                    showCover={true}
                    mobileScrollSupport={true}
                    clickEventForward={true}
                    useMouseEvents={true}
                    swipeDistance={50}
                    showPageCorners={true}
                    disableFlipByClick={false}
                    onFlip={handleFlip}
                    className="shadow-2xl"
                  >
                    {pages.map((page) => (
                      <Page
                        key={page.id}
                        page={page}
                        onHotspotClick={onHotspotClick}
                        onInternalLinkClick={goToPage}
                        onVideoClick={handleVideoClick}
                        backgroundColor={backgroundColor}
                      />
                    ))}
                  </HTMLFlipBook>
                </TransformComponent>
              </>
            )}
          </TransformWrapper>
        </div>

        {/* Bottom controls */}
        <div className="bg-background border-t px-4 py-4 flex items-center justify-between z-10 flex-shrink-0">
          {/* Previous button */}
          <Button
            variant="outline"
            size="lg"
            onClick={goToPreviousPage}
            disabled={currentPage === 0}
          >
            <ChevronLeft className="h-5 w-5 mr-2" />
            Previous
          </Button>

          {/* Page thumbnails strip */}
          <div className="flex gap-2 overflow-x-auto max-w-2xl px-4">
            {pages.map((page, index) => (
              <button
                key={page.id}
                onClick={() => goToPage(page.page_number)}
                className={cn(
                  "h-20 w-14 rounded border-2 transition-all flex-shrink-0",
                  currentPage === index
                    ? "border-primary ring-2 ring-primary/50"
                    : "border-muted-foreground/30 hover:border-primary/50"
                )}
                style={{
                  backgroundImage: `url(${page.thumbnail_url || page.image_url})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
                title={`Go to page ${page.page_number}`}
              />
            ))}
          </div>

          {/* Next button */}
          <Button
            variant="outline"
            size="lg"
            onClick={goToNextPage}
            disabled={currentPage === totalPages - 1}
          >
            Next
            <ChevronRight className="h-5 w-5 ml-2" />
          </Button>
        </div>

        {/* Keyboard shortcuts hint */}
        <div className="absolute bottom-28 right-6 rounded-lg bg-background border shadow-lg p-3 text-xs z-10">
          <div className="font-semibold mb-2">Keyboard Shortcuts:</div>
          <div className="space-y-1 text-muted-foreground">
            <div>← → Arrow keys to navigate</div>
            <div>Space for next page</div>
            <div>Home/End for first/last</div>
            <div>F for fullscreen</div>
            <div>ESC to close</div>
            {tocData?.tocData && <div>Click menu icon for TOC</div>}
          </div>
        </div>
      </div>

      {/* Video Player Modal */}
      {currentVideo && (
        <VideoPlayerModal
          open={videoModalOpen}
          onClose={handleVideoModalClose}
          videoUrl={currentVideo.url}
          title={currentVideo.title}
        />
      )}
    </div>
  );
}
