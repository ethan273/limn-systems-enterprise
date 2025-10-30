"use client";
import { log } from '@/lib/logger';

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
  RotateCcw,
  Grid3x3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api/client";
import { TOCPanel } from "@/components/flipbooks/navigation/TOCPanel";
import { VideoPlayerModal } from "@/components/flipbooks/VideoPlayerModal";
import { useFlipbookAnalytics } from "@/hooks/useFlipbookAnalytics";

interface FlipbookPage {
  id: string;
  page_number: number;
  image_url: string;
  thumbnail_url: string;
  width?: number | null;   // Original page width from PDF
  height?: number | null;  // Original page height from PDF
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
    onAnalyticsHotspotClick?: (_hotspotId: string, _pageNumber: number) => void;
    backgroundColor?: string;
  }
>(({ page, onHotspotClick, onInternalLinkClick, onVideoClick, onAnalyticsHotspotClick, backgroundColor = 'white' }, ref) => {
  /**
   * Handle hotspot click based on type
   */
  const handleHotspotClick = (e: React.MouseEvent, hotspot: FlipbookHotspot) => {
    e.stopPropagation();

    // Track hotspot click analytics
    onAnalyticsHotspotClick?.(hotspot.id, page.page_number);

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
        log.warn(`Unknown hotspot type: ${hotspot.hotspot_type}`);
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
      {/* Page Image - Contain to show full image without cropping */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={page.image_url}
        alt={`Page ${page.page_number}`}
        className="h-full w-full object-contain"
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
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(true);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [showControls, setShowControls] = useState(true); // Auto-hide controls
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);

  const totalPages = pages.length;

  // Determine if pages are portrait or landscape
  const firstPageWithDimensions = pages.find(p => p.width && p.height);
  const isPortraitOrientation = firstPageWithDimensions?.width && firstPageWithDimensions?.height
    ? firstPageWithDimensions.height > firstPageWithDimensions.width
    : true; // Default to portrait

  // Fetch TOC data if flipbookId is provided
  const { data: tocData } = api.flipbooks.getTOC.useQuery(
    { flipbookId: flipbookId! },
    { enabled: !!flipbookId }
  );

  // Initialize analytics tracking
  const analytics = useFlipbookAnalytics({
    flipbookId,
    enabled: !!flipbookId,
  });

  // Calculate book size based on container - MAXIMIZE screen usage
  // DYNAMIC ASPECT RATIO: Use actual page dimensions if available
  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;

      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;

      // Account for ALL space used by controls and padding
      // p-8 = 32px padding on each side = 64px total
      // Top controls: ~60px, Bottom controls: ~80px
      const paddingTotal = 64; // p-8 padding (32px each side)
      const topControlsHeight = 60;
      const bottomControlsHeight = 80;

      const availableHeight = containerHeight - topControlsHeight - bottomControlsHeight - paddingTotal;
      const availableWidth = containerWidth - paddingTotal;

      // Calculate aspect ratio from first page with dimensions
      const firstPageWithDimensions = pages.find(p => p.width && p.height);
      const pageWidth = firstPageWithDimensions?.width;
      const pageHeight = firstPageWithDimensions?.height;
      const hasActualDimensions = !!(pageWidth && pageHeight);
      const aspectRatio = hasActualDimensions
        ? pageWidth / pageHeight
        : 2 / 2.8; // Default portrait ratio

      log.info('[FlipbookViewerV2] Container and page info:', {
        containerWidth,
        containerHeight,
        availableWidth,
        availableHeight,
        hasActualDimensions,
        pageWidth,
        pageHeight,
        aspectRatio,
      });

      // Calculate dimensions that respect aspect ratio
      // For portrait mode (usePortrait=true): shows single page, use full width
      // For landscape mode (usePortrait=false): shows two pages, use half width
      const isPortrait = hasActualDimensions
        ? pageHeight > pageWidth
        : true;

      let width = isPortrait ? availableWidth : availableWidth / 2;
      let height = width / aspectRatio; // Calculate height from width

      // If calculated height exceeds available space, scale down
      if (height > availableHeight) {
        height = availableHeight;
        width = height * aspectRatio;
      }

      // CRITICAL: Ensure we NEVER exceed available space (prevents overflow/cutoff)
      // Apply minimums only if they fit, otherwise use what's available
      const minWidth = Math.min(400, availableWidth);
      const minHeight = Math.min(500, availableHeight);

      if (width < minWidth && availableWidth >= minWidth) {
        width = minWidth;
        height = width / aspectRatio;
        // Re-check height constraint
        if (height > availableHeight) {
          height = availableHeight;
          width = height * aspectRatio;
        }
      }
      if (height < minHeight && availableHeight >= minHeight) {
        height = minHeight;
        width = height * aspectRatio;
        // Re-check width constraint
        if (width > availableWidth) {
          width = availableWidth;
          height = width / aspectRatio;
        }
      }

      // CRITICAL: HTMLFlipBook with usePortrait=false shows TWO pages side-by-side
      // So the actual rendered width is width × 2. We need to account for this.
      let finalWidth = Math.floor(width);
      let finalHeight = Math.floor(height);

      // If showing 2-page spread (landscape), ensure total width fits
      if (!isPortrait) {
        const totalSpreadWidth = finalWidth * 2;
        if (totalSpreadWidth > availableWidth) {
          // Scale down to fit
          finalWidth = Math.floor(availableWidth / 2);
          finalHeight = Math.floor(finalWidth / aspectRatio);
        }
      }

      const actualRenderedWidth = isPortrait ? finalWidth : finalWidth * 2;

      log.info('[FlipbookViewerV2] Final book size:', {
        width: finalWidth,
        height: finalHeight,
        isPortrait,
        actualRenderedWidth,
        fitsInWidth: actualRenderedWidth <= availableWidth,
        fitsInHeight: finalHeight <= availableHeight,
      });

      setBookSize({ width: finalWidth, height: finalHeight });
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [showTOC, pages]); // Re-calculate when TOC toggles or pages change

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

      // Track page turn analytics
      analytics.trackPageTurn(newPage);
    },
    [onPageChange, analytics]
  );

  // Fullscreen handlers
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current
        .requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch((err) => log.error("Fullscreen request failed:", err));
    } else {
      document
        .exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch((err) => log.error("Exit fullscreen failed:", err));
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

  // Auto-hide keyboard shortcuts after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowKeyboardShortcuts(false);
    }, 5000); // 5 seconds

    return () => clearTimeout(timer);
  }, []); // Run once on mount

  // Auto-hide controls after 3 seconds of inactivity (FlipSnack-style)
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);

      // Clear existing timeout
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }

      // Set new timeout to hide controls after 3 seconds
      const timeout = setTimeout(() => {
        setShowControls(false);
      }, 3000);

      setControlsTimeout(timeout);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchstart', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchstart', handleMouseMove);
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
    };
  }, [controlsTimeout]);

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
        {/* Flipbook Canvas with Zoom - Full screen, no padding */}
        <div className="flex-1 flex items-center justify-center overflow-hidden">
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
                    size="fixed"
                    minWidth={300}
                    maxWidth={2000} // Increased from 1200 to allow larger displays
                    minHeight={400}
                    maxHeight={2400} // Increased from 1680 to fill larger screens
                    drawShadow={true}
                    flippingTime={1000} // 1 second page turn
                    usePortrait={isPortraitOrientation} // Dynamic: portrait pages show single, landscape shows spread
                    startPage={initialPage - 1} // 0-indexed
                    autoSize={false}
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
                        onAnalyticsHotspotClick={analytics.trackHotspotClick}
                        backgroundColor={backgroundColor}
                      />
                    ))}
                  </HTMLFlipBook>
                </TransformComponent>
              </>
            )}
          </TransformWrapper>
        </div>

        {/* FlipSnack-style minimal bottom controls - Auto-hide after 3s of inactivity */}
        {showControls && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm px-6 py-3 flex items-center justify-center gap-4 z-20 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Previous Page */}
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPreviousPage}
              disabled={currentPage === 0}
              className="text-white hover:bg-white/20"
              title="Previous page (← or ←)"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            {/* TOC Toggle */}
            {tocData?.tocData && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowTOC(!showTOC)}
                className="text-white hover:bg-white/20"
                title={showTOC ? "Hide table of contents" : "Show table of contents"}
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}

            {/* Thumbnail Grid Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowThumbnails(!showThumbnails)}
              className="text-white hover:bg-white/20"
              title={showThumbnails ? "Hide thumbnails" : "Show all pages"}
            >
              <Grid3x3 className="h-5 w-5" />
            </Button>

            {/* Page Counter */}
            <div className="text-white text-sm font-medium px-3 py-1 bg-white/10 rounded-md">
              {currentPage + 1} / {totalPages}
            </div>

            {/* Zoom In */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => document.getElementById("zoom-in-btn")?.click()}
              className="text-white hover:bg-white/20"
              title="Zoom in (scroll wheel or pinch)"
            >
              <ZoomIn className="h-5 w-5" />
            </Button>

            {/* Zoom Out */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => document.getElementById("zoom-out-btn")?.click()}
              className="text-white hover:bg-white/20"
              title="Zoom out (scroll wheel or pinch)"
            >
              <ZoomOut className="h-5 w-5" />
            </Button>

            {/* Reset Zoom */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => document.getElementById("zoom-reset-btn")?.click()}
              className="text-white hover:bg-white/20"
              title="Reset zoom (double-click page)"
            >
              <RotateCcw className="h-5 w-5" />
            </Button>

            {/* Fullscreen Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white/20"
              title={isFullscreen ? "Exit fullscreen (F)" : "Enter fullscreen (F)"}
            >
              {isFullscreen ? (
                <Minimize className="h-5 w-5" />
              ) : (
                <Maximize className="h-5 w-5" />
              )}
            </Button>

            {/* Next Page */}
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNextPage}
              disabled={currentPage === totalPages - 1}
              className="text-white hover:bg-white/20"
              title="Next page (→ or Space)"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>

            {/* Close button (if onClose provided) */}
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white hover:bg-white/20 ml-2"
                title="Close viewer (ESC)"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
        )}

        {/* Keyboard shortcuts hint - Auto-hides after 5 seconds, dismissible */}
        {showKeyboardShortcuts && (
          <div className="absolute bottom-20 right-6 rounded-lg bg-black/80 backdrop-blur-sm border border-white/20 shadow-lg p-3 text-xs z-30 animate-in fade-in slide-in-from-right-2 duration-300 text-white">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="font-semibold">Keyboard Shortcuts:</div>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 text-white hover:bg-white/20"
                onClick={() => setShowKeyboardShortcuts(false)}
                title="Dismiss shortcuts"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-1 text-white/80">
              <div>← → Arrow keys to navigate</div>
              <div>Space for next page</div>
              <div>Home/End for first/last</div>
              <div>F for fullscreen</div>
              <div>ESC to close</div>
              {tocData?.tocData && <div>Click menu icon for TOC</div>}
            </div>
          </div>
        )}
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

      {/* Thumbnail Grid Overlay */}
      {showThumbnails && (
        <div className="absolute inset-0 bg-background z-50 overflow-y-auto p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">All Pages</h2>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowThumbnails(false)}
              title="Close thumbnails"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {pages.map((page) => (
              <button
                key={page.id}
                onClick={() => {
                  goToPage(page.page_number);
                  setShowThumbnails(false);
                }}
                className={cn(
                  "relative rounded-lg overflow-hidden border-2 transition-all hover:scale-105 hover:shadow-lg group",
                  currentPage === page.page_number - 1
                    ? "border-primary ring-2 ring-primary"
                    : "border-border hover:border-primary"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={page.thumbnail_url || page.image_url}
                  alt={`Page ${page.page_number}`}
                  className="w-full h-auto object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white px-2 py-1 text-sm font-medium text-center">
                  {page.page_number}
                </div>
                {currentPage === page.page_number - 1 && (
                  <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-bold">
                    Current
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
