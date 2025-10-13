/**
 * TOC Panel Component
 *
 * Displays table of contents in the flipbook viewer with navigation
 * Phase 1: TOC & Thumbnails Enhancement
 */

"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  ChevronRight,
  ChevronDown,
  Search,
  X,
  BookOpen,
  ChevronLeft,
  ChevronRightIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TOCItem, TOCData, TOCSettings } from "@/types/flipbook-navigation";

interface TOCPanelProps {
  /** TOC data to display */
  tocData: TOCData;

  /** Current page number (for highlighting) */
  currentPage: number;

  /** Callback when user navigates to a page */
  onNavigate: (pageNumber: number) => void;

  /** Display settings */
  settings?: Partial<TOCSettings>;

  /** CSS class name */
  className?: string;
}

interface TOCItemViewProps {
  item: TOCItem;
  currentPage: number;
  onNavigate: (pageNumber: number) => void;
  searchQuery: string;
  settings: TOCSettings;
  level?: number;
}

/**
 * Default settings
 */
const DEFAULT_SETTINGS: TOCSettings = {
  enabled: true,
  position: "left",
  defaultExpanded: false,
  showPageNumbers: true,
  showIcons: true,
  searchEnabled: true,
  highlightCurrent: true,
};

/**
 * Individual TOC item view
 */
function TOCItemView({
  item,
  currentPage,
  onNavigate,
  searchQuery,
  settings,
  level = 0,
}: TOCItemViewProps) {
  const hasChildren = item.children.length > 0;
  const [isExpanded, setIsExpanded] = useState(
    settings.defaultExpanded || level === 0
  );

  // Check if this item or any child matches search
  const matchesSearch = useMemo(() => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const titleMatches = item.title.toLowerCase().includes(query);
    const childMatches = item.children.some((child) =>
      child.title.toLowerCase().includes(query)
    );
    return titleMatches || childMatches;
  }, [item, searchQuery]);

  // Check if current page is in this section
  const isCurrentSection = useMemo(() => {
    const isCurrent = item.pageNumber === currentPage;
    const isInRange =
      currentPage >= item.pageNumber &&
      (item.metadata?.pageCount
        ? currentPage < item.pageNumber + item.metadata.pageCount
        : false);
    return isCurrent || isInRange;
  }, [item, currentPage]);

  // Auto-expand if search matches or is current section
  useEffect(() => {
    if (searchQuery && matchesSearch && hasChildren) {
      setIsExpanded(true);
    }
    if (isCurrentSection && hasChildren) {
      setIsExpanded(true);
    }
  }, [searchQuery, matchesSearch, isCurrentSection, hasChildren]);

  if (!matchesSearch) {
    return null;
  }

  return (
    <div>
      {/* Item button */}
      <button
        onClick={() => onNavigate(item.pageNumber)}
        className={cn(
          "w-full flex items-center gap-2 py-2 px-3 rounded-md transition-all",
          "hover:bg-accent hover:text-accent-foreground",
          "text-left text-sm group",
          settings.highlightCurrent && isCurrentSection && [
            "bg-accent/50 font-medium",
            "border-l-2 border-primary",
          ]
        )}
        style={{ paddingLeft: `${level * 1 + 0.75}rem` }}
      >
        {/* Expand/collapse button */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-0.5 hover:bg-muted rounded transition-colors flex-shrink-0"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <div className="w-5 flex-shrink-0" />
        )}

        {/* Icon */}
        {settings.showIcons && item.icon && (
          <span className="text-base flex-shrink-0">{item.icon}</span>
        )}

        {/* Title */}
        <span className="flex-1 truncate">{item.title}</span>

        {/* Page number */}
        {settings.showPageNumbers && (
          <span className="text-xs text-muted-foreground flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            p.{item.pageNumber}
          </span>
        )}
      </button>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="mt-0.5">
          {item.children.map((child) => (
            <TOCItemView
              key={child.id}
              item={child}
              currentPage={currentPage}
              onNavigate={onNavigate}
              searchQuery={searchQuery}
              settings={settings}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Main TOC Panel component
 */
export function TOCPanel({
  tocData,
  currentPage,
  onNavigate,
  settings: propSettings,
  className,
}: TOCPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);

  const settings: TOCSettings = useMemo(
    () => ({ ...DEFAULT_SETTINGS, ...propSettings }),
    [propSettings]
  );

  // Count total items
  const totalItems = useMemo(() => {
    const count = (items: TOCItem[]): number => {
      return items.reduce((sum, item) => sum + 1 + count(item.children), 0);
    };
    return count(tocData.items);
  }, [tocData.items]);

  // Filter items by search
  const filteredItems = useMemo(() => {
    if (!searchQuery) return tocData.items;

    const filterItems = (items: TOCItem[]): TOCItem[] => {
      return items.filter((item) => {
        const titleMatches = item.title
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
        const childMatches = item.children.length > 0;
        return titleMatches || childMatches;
      });
    };

    return filterItems(tocData.items);
  }, [tocData.items, searchQuery]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape" && searchQuery) {
        setSearchQuery("");
      }
    },
    [searchQuery]
  );

  if (!settings.enabled) {
    return null;
  }

  if (isCollapsed) {
    return (
      <div
        className={cn(
          "flex flex-col items-center gap-2 py-4 px-2 bg-background border-r",
          className
        )}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(false)}
          className="h-8 w-8 p-0"
        >
          {settings.position === "left" ? (
            <ChevronRightIcon className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
        <Separator />
        <div className="flex items-center justify-center -rotate-90 whitespace-nowrap text-xs text-muted-foreground">
          Table of Contents
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-background border-r",
        settings.width ? "" : "w-[280px]",
        className
      )}
      style={{ width: settings.width }}
      onKeyDown={handleKeyDown}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-sm">Contents</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(true)}
          className="h-7 w-7 p-0"
        >
          {settings.position === "left" ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRightIcon className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Search */}
      {settings.searchEnabled && (
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search contents..."
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
        </div>
      )}

      <Separator />

      {/* TOC tree */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {tocData.items.length === 0 ? (
            <div className="text-center py-8 px-4">
              <p className="text-sm text-muted-foreground">
                No table of contents available
              </p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-8 px-4">
              <p className="text-sm text-muted-foreground">
                No results for &quot;{searchQuery}&quot;
              </p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {filteredItems.map((item) => (
                <TOCItemView
                  key={item.id}
                  item={item}
                  currentPage={currentPage}
                  onNavigate={onNavigate}
                  searchQuery={searchQuery}
                  settings={settings}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <Separator />
      <div className="p-3 text-xs text-muted-foreground text-center">
        {totalItems} {totalItems === 1 ? "section" : "sections"}
      </div>
    </div>
  );
}

/**
 * Floating TOC Panel variant (for mobile or overlay)
 */
export function FloatingTOCPanel({
  tocData,
  currentPage,
  onNavigate,
  onClose,
  settings: propSettings,
}: TOCPanelProps & { onClose: () => void }) {
  const settings: TOCSettings = useMemo(
    () => ({ ...DEFAULT_SETTINGS, ...propSettings, position: "floating" }),
    [propSettings]
  );

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-y-0 left-0 w-[320px] bg-background shadow-lg border-r">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Table of Contents</h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <TOCPanel
          tocData={tocData}
          currentPage={currentPage}
          onNavigate={(page) => {
            onNavigate(page);
            onClose();
          }}
          settings={settings}
          className="border-0"
        />
      </div>
      <div className="absolute inset-0" onClick={onClose} />
    </div>
  );
}
