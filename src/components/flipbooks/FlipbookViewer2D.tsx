"use client";

/**
 * Simple 2D Flipbook Viewer
 *
 * A fallback viewer that doesn't use React Three Fiber
 * Shows pages in a simple slideshow format with navigation
 * Enhanced with TOC panel and improved thumbnail navigation
 */

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, X, Menu } from "lucide-react";
import Image from "next/image";
import { api } from "@/lib/api/client";
import { TOCPanel } from "@/components/flipbooks/navigation/TOCPanel";

interface FlipbookPage {
  id: string;
  page_number: number;
  image_url: string;
  thumbnail_url: string;
  hotspots?: any[];
}

interface FlipbookViewer2DProps {
  flipbookId?: string;
  pages: FlipbookPage[];
  initialPage?: number;
  onPageChange?: (pageNumber: number) => void;
  onHotspotClick?: (hotspot: any) => void;
  onClose?: () => void;
}

export function FlipbookViewer2D({
  flipbookId,
  pages,
  initialPage = 1,
  onPageChange,
  onHotspotClick,
  onClose,
}: FlipbookViewer2DProps) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [zoom, setZoom] = useState(1);
  const [showTOC, setShowTOC] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch TOC data if flipbookId is provided
  const { data: tocData } = api.flipbooks.getTOC.useQuery(
    { flipbookId: flipbookId! },
    { enabled: !!flipbookId }
  );

  // Sort pages by page number
  const sortedPages = [...pages].sort((a, b) => a.page_number - b.page_number);
  const currentPageData = sortedPages[currentPage - 1];

  useEffect(() => {
    if (onPageChange) {
      onPageChange(currentPage);
    }
  }, [currentPage, onPageChange]);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < sortedPages.length) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleZoomIn = () => {
    setZoom(Math.min(zoom + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(zoom - 0.25, 0.5));
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        handlePrevPage();
      } else if (e.key === "ArrowRight") {
        handleNextPage();
      } else if (e.key === "+" || e.key === "=") {
        handleZoomIn();
      } else if (e.key === "-") {
        handleZoomOut();
      } else if (e.key === "Escape" && onClose) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPage, zoom, onClose]);

  if (!currentPageData) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No pages available</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full bg-muted/20 flex">
      {/* TOC Panel (collapsible sidebar) */}
      {showTOC && tocData?.tocData && (
        <div className="w-80 border-r bg-background flex-shrink-0">
          <TOCPanel
            tocData={tocData.tocData}
            currentPage={currentPage}
            onNavigate={(page) => setCurrentPage(page)}
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
      <div className="flex-1 flex flex-col relative">
        {/* Controls Bar */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-background/95 backdrop-blur border-b p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* TOC Toggle Button */}
            {tocData?.tocData && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTOC(!showTOC)}
                title={showTOC ? "Hide table of contents" : "Show table of contents"}
              >
                <Menu className="h-4 w-4" />
              </Button>
            )}
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm font-medium px-3">
            Page {currentPage} of {sortedPages.length}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage === sortedPages.length}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleZoomOut} disabled={zoom <= 0.5}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <div className="text-sm font-medium px-2 min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </div>
          <Button variant="outline" size="sm" onClick={handleZoomIn} disabled={zoom >= 3}>
            <ZoomIn className="h-4 w-4" />
          </Button>

          {onClose && (
            <Button variant="outline" size="sm" onClick={onClose} className="ml-4">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Page Display */}
      <div className="flex-1 overflow-auto pt-16">
        <div className="flex items-center justify-center min-h-full p-8">
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "center center",
              transition: "transform 0.2s ease-out",
            }}
            className="relative max-w-full"
          >
            <img
              src={currentPageData.image_url}
              alt={`Page ${currentPage}`}
              className="max-w-full h-auto shadow-2xl rounded-lg"
              style={{ maxHeight: "80vh" }}
            />

            {/* Hotspots */}
            {currentPageData.hotspots?.map((hotspot: any) => (
              <button
                key={hotspot.id}
                onClick={() => onHotspotClick?.(hotspot)}
                className="absolute border-2 border-primary bg-primary/20 hover:bg-primary/40 transition-colors cursor-pointer rounded"
                style={{
                  left: `${hotspot.x_percent}%`,
                  top: `${hotspot.y_percent}%`,
                  width: `${hotspot.width}%`,
                  height: `${hotspot.height}%`,
                }}
                title={hotspot.label || "Click to view"}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Thumbnail Strip */}
      <div className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t p-3">
        <div className="flex gap-2 overflow-x-auto">
          {sortedPages.map((page) => (
            <button
              key={page.id}
              onClick={() => setCurrentPage(page.page_number)}
              className={`flex-shrink-0 relative rounded overflow-hidden border-2 transition-all ${
                page.page_number === currentPage
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-transparent hover:border-primary/50"
              }`}
            >
              <img
                src={page.thumbnail_url}
                alt={`Page ${page.page_number}`}
                className="w-16 h-20 object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs text-center py-0.5">
                {page.page_number}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Keyboard Hints */}
      <div className="absolute bottom-20 right-4 text-xs text-muted-foreground bg-background/90 backdrop-blur px-3 py-2 rounded border">
        <div>← → Navigate</div>
        <div>+ - Zoom</div>
        {onClose && <div>ESC Close</div>}
        {tocData?.tocData && <div>Click menu icon for TOC</div>}
      </div>
      </div>
    </div>
  );
}
