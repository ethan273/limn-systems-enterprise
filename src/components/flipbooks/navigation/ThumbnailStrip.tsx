/**
 * Thumbnail Strip Component
 *
 * Displays flipbook page thumbnails in a horizontal/vertical strip
 * Phase 1: TOC & Thumbnails Enhancement
 */

"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ThumbnailSettings } from "@/types/flipbook-navigation";

interface ThumbnailStripProps {
  /** Array of page thumbnails */
  pages: Array<{
    id: string;
    pageNumber: number;
    thumbnailUrl?: string | null;
    thumbnailSmallUrl?: string | null;
    title?: string;
  }>;

  /** Current page number */
  currentPage: number;

  /** Callback when user clicks a thumbnail */
  onPageClick: (_pageNumber: number) => void;

  /** Display settings */
  settings?: Partial<ThumbnailSettings>;

  /** CSS class name */
  className?: string;
}

/**
 * Default settings
 */
const DEFAULT_SETTINGS: ThumbnailSettings = {
  enabled: true,
  position: "bottom",
  size: "medium",
  showPageNumbers: true,
  showPageTitles: false,
  highlightCurrent: true,
  autoScroll: true,
  hoverPreview: false,
  gap: 8,
};

/**
 * Get thumbnail dimensions based on size
 */
function getThumbnailDimensions(size: "small" | "medium" | "large") {
  switch (size) {
    case "small":
      return { width: 60, height: 84 };
    case "large":
      return { width: 150, height: 210 };
    case "medium":
    default:
      return { width: 100, height: 140 };
  }
}

/**
 * Individual thumbnail item
 */
function ThumbnailItem({
  page,
  isActive,
  onClick,
  settings,
}: {
  page: ThumbnailStripProps["pages"][0];
  isActive: boolean;
  onClick: () => void;
  settings: ThumbnailSettings;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const dimensions = getThumbnailDimensions(settings.size);

  const thumbnailUrl =
    settings.size === "small"
      ? page.thumbnailSmallUrl || page.thumbnailUrl
      : page.thumbnailUrl;

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex-shrink-0 rounded-lg overflow-hidden transition-all",
        "hover:ring-2 hover:ring-primary/50 hover:scale-105",
        "focus:outline-none focus:ring-2 focus:ring-primary",
        isActive && [
          "ring-2 ring-primary scale-105",
          settings.highlightCurrent && "shadow-lg",
        ]
      )}
      style={{
        width: dimensions.width,
        height: dimensions.height + (settings.showPageNumbers ? 24 : 0),
      }}
      aria-label={`Go to page ${page.pageNumber}`}
    >
      {/* Thumbnail image */}
      <div
        className={cn(
          "relative bg-muted overflow-hidden",
          isActive && "ring-2 ring-primary"
        )}
        style={{ width: dimensions.width, height: dimensions.height }}
      >
        {thumbnailUrl && !hasError ? (
          <>
            {isLoading && (
              <Skeleton className="absolute inset-0" />
            )}
            <Image
              src={thumbnailUrl}
              alt={`Page ${page.pageNumber}`}
              fill
              sizes={`${dimensions.width}px`}
              className={cn(
                "object-contain transition-opacity duration-200",
                isLoading ? "opacity-0" : "opacity-100"
              )}
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setHasError(true);
              }}
            />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground text-xs">
            <span>Page {page.pageNumber}</span>
          </div>
        )}

        {/* Active indicator overlay */}
        {isActive && (
          <div className="absolute inset-0 border-2 border-primary pointer-events-none" />
        )}
      </div>

      {/* Page number */}
      {settings.showPageNumbers && (
        <div
          className={cn(
            "flex items-center justify-center text-xs h-6",
            isActive
              ? "font-semibold text-primary"
              : "text-muted-foreground"
          )}
        >
          {page.pageNumber}
        </div>
      )}

      {/* Page title (if enabled and available) */}
      {settings.showPageTitles && page.title && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs py-1 px-2 truncate">
          {page.title}
        </div>
      )}
    </button>
  );
}

/**
 * Main Thumbnail Strip component
 */
export function ThumbnailStrip({
  pages,
  currentPage,
  onPageClick,
  settings: propSettings,
  className,
}: ThumbnailStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLButtonElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const settings: ThumbnailSettings = {
    ...DEFAULT_SETTINGS,
    ...propSettings,
  };

  const isHorizontal = settings.position === "top" || settings.position === "bottom";

  // Update scroll button states
  const updateScrollButtons = useCallback(() => {
    if (!scrollRef.current) return;

    const { scrollLeft, scrollTop, scrollWidth, scrollHeight, clientWidth, clientHeight } =
      scrollRef.current;

    if (isHorizontal) {
      setCanScrollPrev(scrollLeft > 0);
      setCanScrollNext(scrollLeft < scrollWidth - clientWidth - 1);
    } else {
      setCanScrollPrev(scrollTop > 0);
      setCanScrollNext(scrollTop < scrollHeight - clientHeight - 1);
    }
  }, [isHorizontal]);

  // Auto-scroll to current page
  useEffect(() => {
    if (settings.autoScroll && activeItemRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const item = activeItemRef.current;

      if (isHorizontal) {
        const itemLeft = item.offsetLeft;
        const itemWidth = item.offsetWidth;
        const containerWidth = container.offsetWidth;
        const scrollLeft = container.scrollLeft;

        // Check if item is not fully visible
        if (
          itemLeft < scrollLeft ||
          itemLeft + itemWidth > scrollLeft + containerWidth
        ) {
          // Center the item
          container.scrollTo({
            left: itemLeft - containerWidth / 2 + itemWidth / 2,
            behavior: "smooth",
          });
        }
      } else {
        const itemTop = item.offsetTop;
        const itemHeight = item.offsetHeight;
        const containerHeight = container.offsetHeight;
        const scrollTop = container.scrollTop;

        // Check if item is not fully visible
        if (
          itemTop < scrollTop ||
          itemTop + itemHeight > scrollTop + containerHeight
        ) {
          // Center the item
          container.scrollTo({
            top: itemTop - containerHeight / 2 + itemHeight / 2,
            behavior: "smooth",
          });
        }
      }
    }

    updateScrollButtons();
  }, [currentPage, settings.autoScroll, isHorizontal, updateScrollButtons]);

  // Scroll navigation
  const handleScroll = useCallback(
    (direction: "prev" | "next") => {
      if (!scrollRef.current) return;

      const container = scrollRef.current;
      const scrollAmount = isHorizontal
        ? container.clientWidth * 0.8
        : container.clientHeight * 0.8;

      if (isHorizontal) {
        container.scrollBy({
          left: direction === "next" ? scrollAmount : -scrollAmount,
          behavior: "smooth",
        });
      } else {
        container.scrollBy({
          top: direction === "next" ? scrollAmount : -scrollAmount,
          behavior: "smooth",
        });
      }
    },
    [isHorizontal]
  );

  if (!settings.enabled || pages.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "relative bg-background border",
        isHorizontal ? "border-t" : "border-l",
        className
      )}
    >
      {/* Previous button */}
      {canScrollPrev && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleScroll("prev")}
          className={cn(
            "absolute z-10 bg-background/80 backdrop-blur-sm shadow-md",
            isHorizontal
              ? "left-2 top-1/2 -translate-y-1/2"
              : "top-2 left-1/2 -translate-x-1/2"
          )}
        >
          {isHorizontal ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </Button>
      )}

      {/* Thumbnail scroll area */}
      <ScrollArea
        ref={scrollRef}
        className={cn(
          "w-full",
          isHorizontal ? "h-auto" : "h-full"
        )}
        onScroll={updateScrollButtons}
      >
        <div
          className={cn(
            "flex p-4",
            isHorizontal ? "flex-row" : "flex-col"
          )}
          style={{ gap: settings.gap }}
        >
          {pages.map((page) => {
            const isActive = page.pageNumber === currentPage;
            return (
              <div
                key={page.id}
                ref={isActive ? (activeItemRef as any) : undefined}
              >
                <ThumbnailItem
                  page={page}
                  isActive={isActive}
                  onClick={() => onPageClick(page.pageNumber)}
                  settings={settings}
                />
              </div>
            );
          })}
        </div>
        {isHorizontal && <ScrollBar orientation="horizontal" />}
        {!isHorizontal && <ScrollBar orientation="vertical" />}
      </ScrollArea>

      {/* Next button */}
      {canScrollNext && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleScroll("next")}
          className={cn(
            "absolute z-10 bg-background/80 backdrop-blur-sm shadow-md",
            isHorizontal
              ? "right-2 top-1/2 -translate-y-1/2"
              : "bottom-2 left-1/2 -translate-x-1/2"
          )}
        >
          {isHorizontal ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      )}
    </div>
  );
}
