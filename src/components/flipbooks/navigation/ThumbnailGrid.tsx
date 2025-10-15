/**
 * Thumbnail Grid Component
 *
 * Displays flipbook page thumbnails in a responsive grid layout
 * Phase 1: TOC & Thumbnails Enhancement
 */

"use client";

import React, { useState, useMemo, useCallback } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, Grid3x3, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ThumbnailGridSettings } from "@/types/flipbook-navigation";

interface ThumbnailGridProps {
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

  /** Callback when user selects multiple pages */
  onPagesSelect?: (_pageNumbers: number[]) => void;

  /** Display settings */
  settings?: Partial<ThumbnailGridSettings>;

  /** CSS class name */
  className?: string;
}

/**
 * Default settings
 */
const DEFAULT_SETTINGS: ThumbnailGridSettings = {
  enabled: true,
  size: "medium",
  columns: "auto",
  showPageNumbers: true,
  showPageTitles: false,
  highlightCurrent: true,
  autoScroll: false,
  hoverPreview: false,
  gap: 16,
  multiSelect: false,
  filtering: true,
  sorting: false,
};

/**
 * Get thumbnail dimensions based on size
 */
function getThumbnailDimensions(size: "small" | "medium" | "large") {
  switch (size) {
    case "small":
      return { width: 100, height: 140 };
    case "large":
      return { width: 200, height: 280 };
    case "medium":
    default:
      return { width: 150, height: 210 };
  }
}

/**
 * Individual grid item
 */
function GridThumbnailItem({
  page,
  isActive,
  isSelected,
  onClick,
  onSelect,
  settings,
}: {
  page: ThumbnailGridProps["pages"][0];
  isActive: boolean;
  isSelected: boolean;
  onClick: () => void;
  onSelect?: () => void;
  settings: ThumbnailGridSettings;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const dimensions = getThumbnailDimensions(settings.size);

  const thumbnailUrl =
    settings.size === "small"
      ? page.thumbnailSmallUrl || page.thumbnailUrl
      : page.thumbnailUrl;

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (settings.multiSelect && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        onSelect?.();
      } else {
        onClick();
      }
    },
    [settings.multiSelect, onClick, onSelect]
  );

  return (
    <div
      className={cn(
        "group relative rounded-lg overflow-hidden transition-all cursor-pointer",
        "hover:ring-2 hover:ring-primary/50",
        isActive && "ring-2 ring-primary",
        isSelected && "ring-2 ring-info",
        settings.multiSelect && "select-none"
      )}
      onClick={handleClick}
    >
      {/* Thumbnail image */}
      <div
        className="relative bg-muted overflow-hidden"
        style={{ width: dimensions.width, height: dimensions.height }}
      >
        {thumbnailUrl && !hasError ? (
          <>
            {isLoading && <Skeleton className="absolute inset-0" />}
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
          <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground text-sm">
            <span>Page {page.pageNumber}</span>
          </div>
        )}

        {/* Selection checkbox (multi-select mode) */}
        {settings.multiSelect && (
          <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div
              className={cn(
                "w-5 h-5 rounded border-2 bg-background flex items-center justify-center",
                isSelected
                  ? "border-info bg-info"
                  : "border-muted-foreground"
              )}
            >
              {isSelected && (
                <svg
                  className="w-3 h-3 text-white"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>
        )}

        {/* Active indicator */}
        {isActive && settings.highlightCurrent && (
          <div className="absolute inset-0 border-4 border-primary pointer-events-none" />
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
      </div>

      {/* Page info footer */}
      <div className="bg-background p-2 border-t">
        {settings.showPageNumbers && (
          <div
            className={cn(
              "text-center text-sm font-medium",
              isActive ? "text-primary" : "text-foreground"
            )}
          >
            Page {page.pageNumber}
          </div>
        )}
        {settings.showPageTitles && page.title && (
          <div className="text-center text-xs text-muted-foreground truncate mt-1">
            {page.title}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Main Thumbnail Grid component
 */
export function ThumbnailGrid({
  pages,
  currentPage,
  onPageClick,
  onPagesSelect,
  settings: propSettings,
  className,
}: ThumbnailGridProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [sortBy, setSortBy] = useState<"page" | "title">("page");

  const settings: ThumbnailGridSettings = {
    ...DEFAULT_SETTINGS,
    ...propSettings,
  };

  // Filter and sort pages
  const displayPages = useMemo(() => {
    let filtered = pages;

    // Filter by search query
    if (searchQuery && settings.filtering) {
      const query = searchQuery.toLowerCase();
      filtered = pages.filter(
        (page) =>
          page.pageNumber.toString().includes(query) ||
          page.title?.toLowerCase().includes(query)
      );
    }

    // Sort
    if (settings.sorting) {
      filtered = [...filtered].sort((a, b) => {
        if (sortBy === "page") {
          return a.pageNumber - b.pageNumber;
        } else {
          return (a.title || "").localeCompare(b.title || "");
        }
      });
    }

    return filtered;
  }, [pages, searchQuery, sortBy, settings.filtering, settings.sorting]);

  // Handle page selection
  const handleToggleSelect = useCallback(
    (pageNumber: number) => {
      setSelectedPages((prev) => {
        const next = new Set(prev);
        if (next.has(pageNumber)) {
          next.delete(pageNumber);
        } else {
          next.add(pageNumber);
        }
        onPagesSelect?.(Array.from(next));
        return next;
      });
    },
    [onPagesSelect]
  );

  // Clear selection
  const handleClearSelection = useCallback(() => {
    setSelectedPages(new Set());
    onPagesSelect?.([]);
  }, [onPagesSelect]);

  // Select all visible
  const handleSelectAll = useCallback(() => {
    const allPageNumbers = new Set(displayPages.map((p) => p.pageNumber));
    setSelectedPages(allPageNumbers);
    onPagesSelect?.(Array.from(allPageNumbers));
  }, [displayPages, onPagesSelect]);

  // Get grid columns
  const gridColumns = useMemo(() => {
    if (typeof settings.columns === "number") {
      return settings.columns;
    }
    // Auto-calculate based on size
    return settings.size === "small" ? 4 : settings.size === "large" ? 2 : 3;
  }, [settings.columns, settings.size]);

  if (!settings.enabled || pages.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* Header with controls */}
      <div className="flex-shrink-0 p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-sm">Pages</h3>
            <span className="text-xs text-muted-foreground">
              ({displayPages.length} of {pages.length})
            </span>
          </div>

          {settings.multiSelect && selectedPages.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {selectedPages.size} selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSelection}
                className="h-7 px-2"
              >
                Clear
              </Button>
            </div>
          )}
        </div>

        {/* Search and filters */}
        {(settings.filtering || settings.sorting) && (
          <div className="flex gap-2">
            {settings.filtering && (
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search pages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-8 h-9"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-0 top-0 h-9 w-9 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}

            {settings.sorting && (
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as "page" | "title")}>
                <SelectTrigger className="w-32 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="page">Page Order</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        {/* Multi-select actions */}
        {settings.multiSelect && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="h-7 text-xs"
            >
              Select All Visible
            </Button>
          </div>
        )}
      </div>

      {/* Grid */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {displayPages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">
                {searchQuery ? `No pages found for "${searchQuery}"` : "No pages available"}
              </p>
            </div>
          ) : (
            <div
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
                gap: settings.gap,
              }}
            >
              {displayPages.map((page) => (
                <GridThumbnailItem
                  key={page.id}
                  page={page}
                  isActive={page.pageNumber === currentPage}
                  isSelected={selectedPages.has(page.pageNumber)}
                  onClick={() => onPageClick(page.pageNumber)}
                  onSelect={
                    settings.multiSelect
                      ? () => handleToggleSelect(page.pageNumber)
                      : undefined
                  }
                  settings={settings}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

/**
 * Fullscreen Grid View (for dedicated grid navigation)
 */
export function FullscreenThumbnailGrid({
  pages,
  currentPage,
  onPageClick,
  onClose,
  settings,
}: ThumbnailGridProps & { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header */}
      <div className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Grid3x3 className="h-5 w-5" />
          <h2 className="font-semibold">All Pages</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4 mr-2" />
          Close
        </Button>
      </div>

      {/* Grid */}
      <ThumbnailGrid
        pages={pages}
        currentPage={currentPage}
        onPageClick={(page) => {
          onPageClick(page);
          onClose();
        }}
        settings={settings}
        className="h-[calc(100vh-73px)]"
      />
    </div>
  );
}
