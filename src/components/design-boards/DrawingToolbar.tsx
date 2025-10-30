"use client";
import { log } from '@/lib/logger';

import { MousePointer2, Pencil, Square, Circle, Type, StickyNote, Minus, Eraser, ZoomIn, ZoomOut, Image, ArrowRight, Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, Triangle, Star, Hexagon, Diamond, Columns } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBoardStore } from "@/lib/design-boards/board-store";
import { cn } from "@/lib/utils";
// Unused: import { useRef } from "react";
import * as fabric from "fabric";

interface DrawingToolbarProps {
  canvas?: fabric.Canvas | null;
}

export function DrawingToolbar({ canvas }: DrawingToolbarProps) {
  const {
    activeTool,
    setActiveTool,
    zoom,
    setZoom,
    fillColor,
    setFillColor,
    strokeColor,
    setStrokeColor,
    strokeWidth,
    setStrokeWidth,
    // Unused: shapeSize,
    // Unused: setShapeSize,
    fontSize,
    setFontSize,
    fontFamily,
    setFontFamily,
    fontWeight,
    setFontWeight,
    fontStyle,
    setFontStyle,
    textDecoration,
    setTextDecoration,
    textAlign,
    setTextAlign,
    textColor,
    setTextColor,
  } = useBoardStore();

  // Update selected objects when colors change
  const handleFillColorChange = (color: string) => {
    setFillColor(color);
    if (canvas) {
      const activeObjects = canvas.getActiveObjects();
      activeObjects.forEach(obj => {
        // For text objects, also update the fill property
        if (obj.type === 'i-text' || obj.type === 'textbox' || obj.type === 'text') {
          obj.set({ fill: color });
        } else if (obj.type === 'group') {
          // For groups (like sticky notes), update the rect's fill
          const group = obj as any;
          const items = group.getObjects();
          items.forEach((item: any) => {
            if (item.type === 'rect') {
              item.set({ fill: color });
            }
          });
        } else {
          obj.set({ fill: color });
        }
      });
      canvas.renderAll();
    }
  };

  const handleStrokeColorChange = (color: string) => {
    setStrokeColor(color);
    if (canvas) {
      const activeObjects = canvas.getActiveObjects();
      activeObjects.forEach(obj => {
        // For text objects, update stroke
        if (obj.type === 'i-text' || obj.type === 'textbox' || obj.type === 'text') {
          obj.set({ stroke: color });
        } else if (obj.type === 'group') {
          // For groups (like sticky notes), update the rect's stroke
          const group = obj as any;
          const items = group.getObjects();
          items.forEach((item: any) => {
            if (item.type === 'rect') {
              item.set({ stroke: color });
            }
          });
        } else {
          obj.set({ stroke: color });
        }
      });
      canvas.renderAll();
    }
  };

  const handleStrokeWidthChange = (width: number) => {
    setStrokeWidth(width);
    if (canvas) {
      const activeObjects = canvas.getActiveObjects();
      activeObjects.forEach(obj => {
        // For text objects and pen paths, update stroke width
        if (obj.type === 'i-text' || obj.type === 'textbox' || obj.type === 'text' || obj.type === 'path') {
          obj.set({ strokeWidth: width });
        } else if (obj.type === 'group') {
          // For groups, update stroke width
          const group = obj as any;
          const items = group.getObjects();
          items.forEach((item: any) => {
            if (item.type === 'rect' || item.type === 'line') {
              item.set({ strokeWidth: width });
            }
          });
        } else {
          obj.set({ strokeWidth: width });
        }
      });
      canvas.renderAll();
    }
  };

  // Handle text property changes
  const handleTextColorChange = (color: string) => {
    setTextColor(color);
    if (canvas) {
      const activeObjects = canvas.getActiveObjects();
      activeObjects.forEach(obj => {
        if (obj.type === 'i-text' || obj.type === 'textbox' || obj.type === 'text') {
          obj.set({ fill: color });
        }
      });
      canvas.renderAll();
    }
  };

  const handleFontSizeChange = (size: number) => {
    setFontSize(size);
    if (canvas) {
      const activeObjects = canvas.getActiveObjects();
      activeObjects.forEach(obj => {
        if (obj.type === 'i-text' || obj.type === 'textbox' || obj.type === 'text') {
          obj.set({ fontSize: size });
        }
      });
      canvas.renderAll();
    }
  };

  const handleFontFamilyChange = (family: string) => {
    setFontFamily(family);
    if (canvas) {
      const activeObjects = canvas.getActiveObjects();
      activeObjects.forEach(obj => {
        if (obj.type === 'i-text' || obj.type === 'textbox' || obj.type === 'text') {
          obj.set({ fontFamily: family });
        }
      });
      canvas.renderAll();
    }
  };

  // Handle image upload directly when button is clicked
  const handleImageUploadClick = () => {
    if (!canvas) {
      log.error('Canvas not ready');
      return;
    }

    log.info('Image button clicked, opening file dialog...');

    // Create a hidden file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';

    input.onchange = async (e) => {
      log.info('File selected');
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        document.body.removeChild(input);
        return;
      }

      const { toast } = await import('sonner');
      toast.info('Loading image...');

      try {
        const reader = new FileReader();
        reader.onload = (event) => {
          const imgUrl = event.target?.result as string;
          fabric.FabricImage.fromURL(imgUrl).then((img) => {
            const maxSize = 400;
            const scale = Math.min(
              maxSize / img.width!,
              maxSize / img.height!,
              1
            );

            img.set({
              left: canvas.width! / 2 - (img.width! * scale) / 2,
              top: canvas.height! / 2 - (img.height! * scale) / 2,
              scaleX: scale,
              scaleY: scale,
            });

            canvas.add(img);
            canvas.setActiveObject(img);
            canvas.renderAll();

            toast.success('Image added successfully');
            document.body.removeChild(input);
          }).catch((error) => {
            log.error('Failed to load image:', { error });
            toast.error('Failed to load image');
            document.body.removeChild(input);
          });
        };

        reader.onerror = () => {
          toast.error('Failed to read image file');
          document.body.removeChild(input);
        };

        reader.readAsDataURL(file);
      } catch (error) {
        log.error('Image upload error:', { error });
        const { toast } = await import('sonner');
        toast.error('Failed to upload image');
        document.body.removeChild(input);
      }
    };

    document.body.appendChild(input);
    log.info('File input appended, clicking...');
    input.click();
  };

  const tools = [
    { id: "select", label: "Select", icon: MousePointer2 },
    { id: "pen", label: "Pen", icon: Pencil },
    { id: "rectangle", label: "Rectangle", icon: Square },
    { id: "circle", label: "Circle", icon: Circle },
    { id: "triangle", label: "Triangle", icon: Triangle },
    { id: "star", label: "Star", icon: Star },
    { id: "hexagon", label: "Hexagon", icon: Hexagon },
    { id: "diamond", label: "Diamond", icon: Diamond },
    { id: "line", label: "Line", icon: Minus },
    { id: "arrow", label: "Arrow", icon: ArrowRight },
    { id: "text", label: "Text", icon: Type },
    { id: "sticky", label: "Sticky Note", icon: StickyNote },
    { id: "kanban", label: "Kanban Board", icon: Columns },
    { id: "image", label: "Image", icon: Image, onClick: handleImageUploadClick },
    { id: "eraser", label: "Eraser", icon: Eraser },
  ];

  const handleZoomIn = () => {
    setZoom(Math.min(zoom + 0.1, 3));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(zoom - 0.1, 0.1));
  };

  const handleResetZoom = () => {
    setZoom(1);
  };

  const isTextTool = activeTool === 'text';
  const isShapeTool = ['rectangle', 'circle', 'triangle', 'star', 'hexagon', 'diamond', 'line', 'arrow'].includes(activeTool);
  const isPenTool = activeTool === 'pen';

  return (
    <div className="border-b bg-background/95 backdrop-blur">
      {/* Main Toolbar Row */}
      <div className="flex items-center justify-between px-4 py-2">
        {/* Drawing Tools */}
        <div className="flex items-center gap-1">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id;

            return (
              <Button
                key={tool.id}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                onClick={() => {
                  if ((tool as any).onClick) {
                    (tool as any).onClick();
                  } else {
                    setActiveTool(tool.id as any);
                  }
                }}
                className={cn("h-9 px-3", isActive && "shadow-sm")}
                title={tool.label}
              >
                <Icon className="h-4 w-4" />
                <span className="ml-2 hidden lg:inline">{tool.label}</span>
              </Button>
            );
          })}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleZoomOut} title="Zoom Out">
            <ZoomOut className="h-4 w-4" />
          </Button>

          <button
            onClick={handleResetZoom}
            className="px-3 py-1 text-sm font-medium hover:bg-accent rounded transition-colors min-w-[60px]"
            title="Reset Zoom"
          >
            {Math.round(zoom * 100)}%
          </button>

          <Button variant="outline" size="sm" onClick={handleZoomIn} title="Zoom In">
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Formatting Toolbar Row - Context Sensitive */}
      <div className="flex items-center gap-4 px-4 py-2 border-t bg-muted/30">
        {/* Color Controls - Always Visible */}
        <div className="flex items-center gap-2">
          <Label className="text-xs font-medium">Fill:</Label>
          <input
            type="color"
            value={fillColor}
            onChange={(e) => handleFillColorChange(e.target.value)}
            className="w-12 h-8 rounded border border-input cursor-pointer"
            title="Fill Color - Changes selected objects"
          />
          <span className="text-xs text-muted-foreground hidden lg:inline">{fillColor}</span>
        </div>

        <Separator orientation="vertical" className="h-6" />

        <div className="flex items-center gap-2">
          <Label className="text-xs font-medium">Stroke:</Label>
          <input
            type="color"
            value={strokeColor}
            onChange={(e) => handleStrokeColorChange(e.target.value)}
            className="w-12 h-8 rounded border border-input cursor-pointer"
            title="Stroke Color - Changes selected objects"
          />
          <span className="text-xs text-muted-foreground hidden lg:inline">{strokeColor}</span>
        </div>

        {/* Stroke Width Visual Selector - Show for pen and shape tools */}
        {(isShapeTool || isPenTool) && (
          <>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              <Label className="text-xs font-medium">Stroke:</Label>
              <div className="flex gap-1">
                {[1, 2, 4, 6, 8].map((width) => (
                  <button
                    key={width}
                    onClick={() => handleStrokeWidthChange(width)}
                    className={cn(
                      "flex items-center justify-center w-8 h-8 rounded border transition-colors",
                      strokeWidth === width
                        ? "border-primary bg-primary/10"
                        : "border-muted hover:border-muted-foreground/50"
                    )}
                    title={`${width}px`}
                  >
                    <div
                      className="bg-foreground rounded"
                      style={{
                        width: '20px',
                        height: `${width}px`
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Text Formatting - Show for text tool */}
        {isTextTool && (
          <>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              <Label className="text-xs font-medium">Font:</Label>
              <Select value={fontFamily} onValueChange={handleFontFamilyChange}>
                <SelectTrigger className="w-32 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Arial">Arial</SelectItem>
                  <SelectItem value="Helvetica">Helvetica</SelectItem>
                  <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                  <SelectItem value="Courier New">Courier New</SelectItem>
                  <SelectItem value="Georgia">Georgia</SelectItem>
                  <SelectItem value="Verdana">Verdana</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Label className="text-xs font-medium">Size:</Label>
              <Input
                type="number"
                min="8"
                max="120"
                value={fontSize}
                onChange={(e) => handleFontSizeChange(Number(e.target.value))}
                className="w-16 h-8"
              />
            </div>

            <Separator orientation="vertical" className="h-6" />

            <div className="flex items-center gap-1">
              <Button
                variant={fontWeight === 'bold' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFontWeight(fontWeight === 'bold' ? 'normal' : 'bold')}
                className="h-8 w-8 p-0"
                title="Bold"
              >
                <Bold className="h-4 w-4" />
              </Button>

              <Button
                variant={fontStyle === 'italic' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFontStyle(fontStyle === 'italic' ? 'normal' : 'italic')}
                className="h-8 w-8 p-0"
                title="Italic"
              >
                <Italic className="h-4 w-4" />
              </Button>

              <Button
                variant={textDecoration === 'underline' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTextDecoration(textDecoration === 'underline' ? 'none' : 'underline')}
                className="h-8 w-8 p-0"
                title="Underline"
              >
                <Underline className="h-4 w-4" />
              </Button>

              <Button
                variant={textDecoration === 'line-through' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTextDecoration(textDecoration === 'line-through' ? 'none' : 'line-through')}
                className="h-8 w-8 p-0"
                title="Strikethrough"
              >
                <Strikethrough className="h-4 w-4" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6" />

            <div className="flex items-center gap-1">
              <Button
                variant={textAlign === 'left' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTextAlign('left')}
                className="h-8 w-8 p-0"
                title="Align Left"
              >
                <AlignLeft className="h-4 w-4" />
              </Button>

              <Button
                variant={textAlign === 'center' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTextAlign('center')}
                className="h-8 w-8 p-0"
                title="Align Center"
              >
                <AlignCenter className="h-4 w-4" />
              </Button>

              <Button
                variant={textAlign === 'right' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTextAlign('right')}
                className="h-8 w-8 p-0"
                title="Align Right"
              >
                <AlignRight className="h-4 w-4" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6" />

            <div className="flex items-center gap-2">
              <Label className="text-xs font-medium">Color:</Label>
              <input
                type="color"
                value={textColor}
                onChange={(e) => handleTextColorChange(e.target.value)}
                className="w-12 h-8 rounded border border-input cursor-pointer"
                title="Text Color - Changes selected text"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
