"use client";

/**
 * Page Canvas Component
 *
 * Visual editor for flipbook pages with click-to-place hotspots
 */

import { useState, useRef } from "react";
import { Plus, Trash2, Move } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Hotspot {
  id: string;
  xPercent: number;
  yPercent: number;
  width: number;
  height: number;
  label?: string;
  product?: {
    id: string;
    name: string;
  };
}

interface PageCanvasProps {
  page?: {
    id: string;
    page_number: number;
    image_url: string;
    hotspots?: Hotspot[];
  };
  onHotspotCreate?: (hotspot: Omit<Hotspot, "id">) => void;
  onHotspotUpdate?: (id: string, updates: Partial<Hotspot>) => void;
  onHotspotDelete?: (id: string) => void;
  editable?: boolean;
  className?: string;
}

export function PageCanvas({
  page,
  onHotspotCreate,
  onHotspotUpdate,
  onHotspotDelete,
  editable = true,
  className,
}: PageCanvasProps) {
  const [isPlacingHotspot, setIsPlacingHotspot] = useState(false);
  const [selectedHotspot, setSelectedHotspot] = useState<string | null>(null);
  const [draggedHotspot, setDraggedHotspot] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Handle click on canvas to place hotspot
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPlacingHotspot || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100;

    onHotspotCreate?.({
      xPercent: Math.max(5, Math.min(95, xPercent)), // Keep within bounds
      yPercent: Math.max(5, Math.min(95, yPercent)),
      width: 15,
      height: 15,
    });

    setIsPlacingHotspot(false);
  };

  // Handle hotspot drag
  const handleHotspotDragStart = (e: React.MouseEvent, hotspotId: string) => {
    if (!editable) return;
    e.stopPropagation();
    setDraggedHotspot(hotspotId);
    setSelectedHotspot(hotspotId);
  };

  const handleHotspotDrag = (e: React.MouseEvent) => {
    if (!draggedHotspot || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100;

    onHotspotUpdate?.(draggedHotspot, {
      xPercent: Math.max(0, Math.min(100, xPercent)),
      yPercent: Math.max(0, Math.min(100, yPercent)),
    });
  };

  const handleHotspotDragEnd = () => {
    setDraggedHotspot(null);
  };

  if (!page) {
    return (
      <div className={cn("flex items-center justify-center bg-muted rounded-lg h-full", className)}>
        <div className="text-center text-muted-foreground">
          <p>No page selected</p>
          <p className="text-sm mt-1">Upload pages to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Toolbar */}
      {editable && (
        <div className="flex items-center justify-between mb-4 p-3 bg-card border rounded-lg">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={isPlacingHotspot ? "default" : "outline"}
              onClick={() => setIsPlacingHotspot(!isPlacingHotspot)}
            >
              <Plus className="h-4 w-4 mr-2" />
              {isPlacingHotspot ? "Click on page to place" : "Add Hotspot"}
            </Button>
            {selectedHotspot && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  onHotspotDelete?.(selectedHotspot);
                  setSelectedHotspot(null);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </Button>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            Page {page.page_number}
            {page.hotspots && ` · ${page.hotspots.length} hotspot${page.hotspots.length !== 1 ? 's' : ''}`}
          </div>
        </div>
      )}

      {/* Canvas */}
      <div
        ref={canvasRef}
        className={cn(
          "relative flex-1 bg-slate-900 rounded-lg overflow-hidden",
          isPlacingHotspot && "cursor-crosshair",
          editable && "border-2 border-blue-500/20"
        )}
        onClick={handleCanvasClick}
        onMouseMove={draggedHotspot ? handleHotspotDrag : undefined}
        onMouseUp={handleHotspotDragEnd}
        onMouseLeave={handleHotspotDragEnd}
      >
        {/* Page image */}
        <img
          src={page.image_url}
          alt={`Page ${page.page_number}`}
          className="w-full h-full object-contain"
          draggable={false}
        />

        {/* Hotspots */}
        {page.hotspots?.map((hotspot) => (
          <div
            key={hotspot.id}
            className={cn(
              "absolute border-2 transition-all cursor-move",
              selectedHotspot === hotspot.id
                ? "border-blue-500 bg-blue-500/30"
                : "border-blue-400 bg-blue-400/20 hover:bg-blue-400/30"
            )}
            style={{
              left: `${hotspot.xPercent}%`,
              top: `${hotspot.yPercent}%`,
              width: `${hotspot.width}%`,
              height: `${hotspot.height}%`,
              transform: "translate(-50%, -50%)",
            }}
            onMouseDown={(e) => handleHotspotDragStart(e, hotspot.id)}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedHotspot(hotspot.id);
            }}
          >
            {/* Hotspot label */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <div className="bg-slate-900 text-white text-xs px-2 py-1 rounded shadow-lg">
                {hotspot.label || hotspot.product?.name || "Hotspot"}
              </div>
            </div>

            {/* Resize handles */}
            {selectedHotspot === hotspot.id && editable && (
              <>
                <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 rounded-full" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />
                <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500 rounded-full" />
                <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />
              </>
            )}
          </div>
        ))}

        {/* Placement guide */}
        {isPlacingHotspot && (
          <div className="absolute inset-0 bg-blue-500/10 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="text-white text-sm bg-blue-600 px-3 py-1 rounded">
                Click to place hotspot
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
