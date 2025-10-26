"use client";

/**
 * Page Canvas Component
 *
 * Visual editor for flipbook pages with drag-to-draw hotspot rectangles
 * ENHANCED: Supports drag-to-draw rectangle selection for hotspots
 */

import { useState, useRef } from "react";
import { Trash2, Square } from "lucide-react";
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
  onHotspotCreate?: (_hotspot: Omit<Hotspot, "id">) => void;
  onHotspotUpdate?: (_id: string, _updates: Partial<Hotspot>) => void;
  onHotspotDelete?: (_id: string) => void;
  editable?: boolean;
  className?: string;
}

interface DrawingRect {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export function PageCanvas({
  page,
  onHotspotCreate,
  onHotspotUpdate,
  onHotspotDelete,
  editable = true,
  className,
}: PageCanvasProps) {
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawingRect, setDrawingRect] = useState<DrawingRect | null>(null);
  const [selectedHotspot, setSelectedHotspot] = useState<string | null>(null);
  const [draggedHotspot, setDraggedHotspot] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // ENHANCED: Handle drag-to-draw rectangle
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawingMode || !canvasRef.current) return;

    // Prevent interaction with existing hotspots
    const target = e.target as HTMLElement;
    if (target.closest('[data-hotspot]')) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100;

    setDrawingRect({
      startX: xPercent,
      startY: yPercent,
      currentX: xPercent,
      currentY: yPercent,
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    // Handle hotspot dragging
    if (draggedHotspot && !drawingRect) {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
      const yPercent = ((e.clientY - rect.top) / rect.height) * 100;

      onHotspotUpdate?.(draggedHotspot, {
        xPercent: Math.max(0, Math.min(100, xPercent)),
        yPercent: Math.max(0, Math.min(100, yPercent)),
      });
      return;
    }

    // Handle rectangle drawing
    if (drawingRect && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
      const yPercent = ((e.clientY - rect.top) / rect.height) * 100;

      setDrawingRect({
        ...drawingRect,
        currentX: xPercent,
        currentY: yPercent,
      });
    }
  };

  const handleMouseUp = () => {
    // Finish rectangle drawing
    if (drawingRect) {
      const minX = Math.min(drawingRect.startX, drawingRect.currentX);
      const maxX = Math.max(drawingRect.startX, drawingRect.currentX);
      const minY = Math.min(drawingRect.startY, drawingRect.currentY);
      const maxY = Math.max(drawingRect.startY, drawingRect.currentY);

      const width = maxX - minX;
      const height = maxY - minY;

      // Only create if rectangle is large enough (at least 2% x 2%)
      if (width >= 2 && height >= 2) {
        onHotspotCreate?.({
          xPercent: minX + width / 2, // Center X
          yPercent: minY + height / 2, // Center Y
          width,
          height,
        });
        setIsDrawingMode(false);
      }

      setDrawingRect(null);
    }

    // Finish hotspot dragging
    if (draggedHotspot) {
      setDraggedHotspot(null);
    }
  };

  // Handle hotspot drag
  const handleHotspotDragStart = (e: React.MouseEvent, hotspotId: string) => {
    if (!editable || isDrawingMode) return;
    e.stopPropagation();
    setDraggedHotspot(hotspotId);
    setSelectedHotspot(hotspotId);
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

  // Calculate drawing rectangle display values
  const drawingRectStyle = drawingRect ? {
    left: `${Math.min(drawingRect.startX, drawingRect.currentX)}%`,
    top: `${Math.min(drawingRect.startY, drawingRect.currentY)}%`,
    width: `${Math.abs(drawingRect.currentX - drawingRect.startX)}%`,
    height: `${Math.abs(drawingRect.currentY - drawingRect.startY)}%`,
  } : undefined;

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Toolbar */}
      {editable && (
        <div className="flex items-center justify-between mb-4 p-3 bg-card border rounded-lg">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={isDrawingMode ? "default" : "outline"}
              onClick={() => setIsDrawingMode(!isDrawingMode)}
            >
              <Square className="h-4 w-4 mr-2" />
              {isDrawingMode ? "Drawing... (drag on page)" : "Draw Hotspot"}
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
          "relative flex-1 bg-background rounded-lg overflow-hidden",
          isDrawingMode && "cursor-crosshair",
          editable && "border-2 border-primary/20"
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Page image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={page.image_url}
          alt={`Page ${page.page_number}`}
          className="w-full h-full object-contain pointer-events-none select-none"
          draggable={false}
        />

        {/* Drawing rectangle preview */}
        {drawingRect && drawingRectStyle && (
          <div
            className="absolute border-2 border-primary bg-primary/20 pointer-events-none"
            style={drawingRectStyle}
          />
        )}

        {/* Hotspots */}
        {page.hotspots?.map((hotspot) => (
          <div
            key={hotspot.id}
            data-hotspot
            className={cn(
              "absolute border-2 transition-all",
              selectedHotspot === hotspot.id
                ? "border-primary bg-primary/30 cursor-move"
                : "border-accent bg-accent/20 hover:bg-accent/30 cursor-pointer"
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
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none">
              <div className="bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-lg border">
                {hotspot.label || hotspot.product?.name || "Hotspot"}
              </div>
            </div>

            {/* Resize handles */}
            {selectedHotspot === hotspot.id && editable && (
              <>
                <div className="absolute -top-1 -left-1 w-2 h-2 bg-primary rounded-full pointer-events-none" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full pointer-events-none" />
                <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-primary rounded-full pointer-events-none" />
                <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-primary rounded-full pointer-events-none" />
              </>
            )}
          </div>
        ))}

        {/* Drawing guide */}
        {isDrawingMode && !drawingRect && (
          <div className="absolute inset-0 bg-primary/10 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="bg-primary text-primary-foreground text-sm px-3 py-1 rounded shadow-lg">
                Click and drag to draw hotspot area
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
