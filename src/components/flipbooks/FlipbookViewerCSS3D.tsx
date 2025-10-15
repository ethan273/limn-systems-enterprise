"use client";

/**
 * CSS 3D Flipbook Viewer
 *
 * Uses CSS 3D transforms for page-turn effects without WebGL
 * Compatible with React 19 and Next.js 15
 */

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, X } from "lucide-react";

interface FlipbookPage {
  id: string;
  page_number: number;
  image_url: string;
  thumbnail_url: string;
  hotspots?: any[];
}

interface FlipbookViewerCSS3DProps {
  pages: FlipbookPage[];
  initialPage?: number;
  onPageChange?: (_pageNumber: number) => void;
  onHotspotClick?: (_hotspot: any) => void;
  onClose?: () => void;
}

export function FlipbookViewerCSS3D({
  pages,
  initialPage = 1,
  onPageChange,
  onHotspotClick,
  onClose,
}: FlipbookViewerCSS3DProps) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<"forward" | "backward" | null>(null);
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sort pages by page number
  const sortedPages = [...pages].sort((a, b) => a.page_number - b.page_number);
  // eslint-disable-next-line security/detect-object-injection
  const currentPageData = sortedPages[currentPage - 1]; // Safe: currentPage is controlled state variable
  // eslint-disable-next-line security/detect-object-injection
  const nextPageData = sortedPages[currentPage]; // Safe: currentPage is controlled state variable

  useEffect(() => {
    if (onPageChange) {
      onPageChange(currentPage);
    }
  }, [currentPage, onPageChange]);

  const handlePrevPage = () => {
    if (currentPage > 1 && !isFlipping) {
      setFlipDirection("backward");
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentPage(currentPage - 1);
        setIsFlipping(false);
        setFlipDirection(null);
      }, 600);
    }
  };

  const handleNextPage = () => {
    if (currentPage < sortedPages.length && !isFlipping) {
      setFlipDirection("forward");
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentPage(currentPage + 1);
        setIsFlipping(false);
        setFlipDirection(null);
      }, 600);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, zoom, onClose, isFlipping]); // handler functions are stable and don't need to be in deps

  if (!currentPageData) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No pages available</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full bg-muted/20 flex flex-col">
      {/* Controls Bar */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-background/95 backdrop-blur border-b p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevPage}
            disabled={currentPage === 1 || isFlipping}
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
            disabled={currentPage === sortedPages.length || isFlipping}
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

      {/* 3D Page Display */}
      <div className="flex-1 overflow-hidden pt-16">
        <div className="flex items-center justify-center min-h-full p-8" style={{ perspective: "2000px" }}>
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "center center",
              transition: "transform 0.2s ease-out",
              position: "relative",
              width: "800px",
              height: "600px",
            }}
          >
            {/* Book Container */}
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "100%",
                transformStyle: "preserve-3d",
              }}
            >
              {/* Current Page (Left side of book) */}
              <div
                style={{
                  position: "absolute",
                  left: "0",
                  top: "0",
                  width: "50%",
                  height: "100%",
                  transformOrigin: "right center",
                  transformStyle: "preserve-3d",
                  zIndex: 1,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentPageData.image_url}
                  alt={`Page ${currentPage}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    boxShadow: "-2px 0 10px rgba(0,0,0,0.3)",
                    borderRadius: "4px 0 0 4px",
                  }}
                />

                {/* Hotspots on current page */}
                {currentPageData.hotspots?.map((hotspot: any) => (
                  <button
                    key={hotspot.id}
                    onClick={() => onHotspotClick?.(hotspot)}
                    className="absolute border-2 border-primary bg-primary/20 hover:bg-primary/40 transition-colors cursor-pointer rounded"
                    style={{
                      left: `${hotspot.x_position}%`,
                      top: `${hotspot.y_position}%`,
                      width: `${hotspot.width}%`,
                      height: `${hotspot.height}%`,
                    }}
                    title="Click to view product"
                  />
                ))}
              </div>

              {/* Next Page (Right side of book) */}
              {nextPageData && (
                <div
                  style={{
                    position: "absolute",
                    right: "0",
                    top: "0",
                    width: "50%",
                    height: "100%",
                    transformOrigin: "left center",
                    transformStyle: "preserve-3d",
                    zIndex: 1,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={nextPageData.image_url}
                    alt={`Page ${currentPage + 1}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      boxShadow: "2px 0 10px rgba(0,0,0,0.3)",
                      borderRadius: "0 4px 4px 0",
                    }}
                  />

                  {/* Hotspots on next page */}
                  {nextPageData.hotspots?.map((hotspot: any) => (
                    <button
                      key={hotspot.id}
                      onClick={() => onHotspotClick?.(hotspot)}
                      className="absolute border-2 border-primary bg-primary/20 hover:bg-primary/40 transition-colors cursor-pointer rounded"
                      style={{
                        left: `${hotspot.x_position}%`,
                        top: `${hotspot.y_position}%`,
                        width: `${hotspot.width}%`,
                        height: `${hotspot.height}%`,
                      }}
                      title="Click to view product"
                    />
                  ))}
                </div>
              )}

              {/* Flipping Page Animation */}
              {isFlipping && flipDirection === "forward" && nextPageData && (
                <div
                  style={{
                    position: "absolute",
                    right: "0",
                    top: "0",
                    width: "50%",
                    height: "100%",
                    transformOrigin: "left center",
                    transformStyle: "preserve-3d",
                    animation: "flipForward 0.6s ease-in-out",
                    zIndex: 10,
                  }}
                >
                  {/* Front of flipping page */}
                  <div
                    style={{
                      position: "absolute",
                      width: "100%",
                      height: "100%",
                      backfaceVisibility: "hidden",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={nextPageData.image_url}
                      alt={`Page ${currentPage + 1}`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        boxShadow: "2px 0 20px rgba(0,0,0,0.5)",
                      }}
                    />
                  </div>
                  {/* Back of flipping page */}
                  <div
                    style={{
                      position: "absolute",
                      width: "100%",
                      height: "100%",
                      backfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                      background: "#f5f5f5",
                    }}
                  />
                </div>
              )}

              {isFlipping && flipDirection === "backward" && currentPageData && (
                <div
                  style={{
                    position: "absolute",
                    left: "0",
                    top: "0",
                    width: "50%",
                    height: "100%",
                    transformOrigin: "right center",
                    transformStyle: "preserve-3d",
                    animation: "flipBackward 0.6s ease-in-out",
                    zIndex: 10,
                  }}
                >
                  {/* Front of flipping page */}
                  <div
                    style={{
                      position: "absolute",
                      width: "100%",
                      height: "100%",
                      backfaceVisibility: "hidden",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentPageData.image_url}
                      alt={`Page ${currentPage}`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        boxShadow: "-2px 0 20px rgba(0,0,0,0.5)",
                      }}
                    />
                  </div>
                  {/* Back of flipping page */}
                  <div
                    style={{
                      position: "absolute",
                      width: "100%",
                      height: "100%",
                      backfaceVisibility: "hidden",
                      transform: "rotateY(-180deg)",
                      background: "#f5f5f5",
                    }}
                  />
                </div>
              )}

              {/* Book Spine Shadow */}
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "0",
                  width: "20px",
                  height: "100%",
                  transform: "translateX(-50%)",
                  background: "linear-gradient(to right, rgba(0,0,0,0.2), transparent, rgba(0,0,0,0.2))",
                  pointerEvents: "none",
                  zIndex: 2,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Thumbnail Strip */}
      <div className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t p-3">
        <div className="flex gap-2 overflow-x-auto">
          {sortedPages.map((page) => (
            <button
              key={page.id}
              onClick={() => !isFlipping && setCurrentPage(page.page_number)}
              disabled={isFlipping}
              className={`flex-shrink-0 relative rounded overflow-hidden border-2 transition-all ${
                page.page_number === currentPage
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-transparent hover:border-primary/50"
              } ${isFlipping ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
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
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes flipForward {
          0% {
            transform: rotateY(0deg);
          }
          100% {
            transform: rotateY(-180deg);
          }
        }

        @keyframes flipBackward {
          0% {
            transform: rotateY(0deg);
          }
          100% {
            transform: rotateY(180deg);
          }
        }
      `}</style>
    </div>
  );
}
