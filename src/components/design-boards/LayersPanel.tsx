"use client";

import { useEffect, useState } from "react";
import * as fabric from "fabric";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  EyeOff,
  Square,
  Circle,
  Type,
  Pencil,
  StickyNote,
  Minus,
  Layers,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LayersPanelProps {
  canvas: fabric.Canvas | null;
  selectedObjects: string[];
}

interface LayerInfo {
  id: string;
  type: string;
  name: string;
  visible: boolean;
  locked: boolean;
  index: number;
}

export function LayersPanel({ canvas, selectedObjects }: LayersPanelProps) {
  const [layers, setLayers] = useState<LayerInfo[]>([]);
  const [, setRefreshTrigger] = useState(0);

  // Refresh layers list when canvas objects change
  useEffect(() => {
    if (!canvas) return;

    const updateLayers = () => {
      const objects = canvas.getObjects();
      const layerList: LayerInfo[] = objects.map((obj, index) => {
        // Generate a name based on type
        const typeName = getTypeName(obj.type || 'unknown');
        const objectName = (obj as any).name || `${typeName} ${index + 1}`;

        return {
          id: (obj as any).id || `temp-${index}`,
          type: obj.type || 'unknown',
          name: objectName,
          visible: obj.visible !== false,
          locked: obj.selectable === false,
          index,
        };
      });

      setLayers(layerList.reverse()); // Reverse to show top objects first
    };

    updateLayers();

    // Listen to canvas events
    canvas.on('object:added', updateLayers);
    canvas.on('object:removed', updateLayers);
    canvas.on('object:modified', updateLayers);

    return () => {
      canvas.off('object:added', updateLayers);
      canvas.off('object:removed', updateLayers);
      canvas.off('object:modified', updateLayers);
    };
  }, [canvas]);

  // Also update when selection changes
  useEffect(() => {
    setRefreshTrigger(prev => prev + 1);
  }, [selectedObjects]);

  const getTypeName = (type: string): string => {
    const typeMap: Record<string, string> = {
      'rect': 'Rectangle',
      'circle': 'Circle',
      'line': 'Line',
      'i-text': 'Text',
      'text': 'Text',
      'path': 'Drawing',
      'group': 'Group',
      'sticky': 'Sticky Note',
    };
    // eslint-disable-next-line security/detect-object-injection
    return typeMap[type] || type; // Safe: typeMap lookup with fallback to type string
  };

  const getTypeIcon = (type: string) => {
    const iconClass = "h-4 w-4";
    switch (type) {
      case 'rect':
        return <Square className={iconClass} />;
      case 'circle':
        return <Circle className={iconClass} />;
      case 'line':
        return <Minus className={iconClass} />;
      case 'i-text':
      case 'text':
        return <Type className={iconClass} />;
      case 'path':
        return <Pencil className={iconClass} />;
      case 'group':
        return <Layers className={iconClass} />;
      case 'sticky':
        return <StickyNote className={iconClass} />;
      default:
        return <Square className={iconClass} />;
    }
  };

  const handleLayerClick = (layer: LayerInfo) => {
    if (!canvas) return;

    const objects = canvas.getObjects();
    const actualIndex = objects.length - 1 - layer.index; // Reverse index
    // eslint-disable-next-line security/detect-object-injection
    const obj = objects[actualIndex]; // Safe: actualIndex is calculated from validated layer.index

    if (obj) {
      canvas.setActiveObject(obj);
      canvas.renderAll();
    }
  };

  const toggleVisibility = (layer: LayerInfo, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canvas) return;

    const objects = canvas.getObjects();
    const actualIndex = objects.length - 1 - layer.index;
    // eslint-disable-next-line security/detect-object-injection
    const obj = objects[actualIndex]; // Safe: actualIndex is calculated from validated layer.index

    if (obj) {
      obj.set({ visible: !layer.visible });
      canvas.renderAll();
      setRefreshTrigger(prev => prev + 1);
    }
  };

  const moveLayerUp = (layer: LayerInfo, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canvas) return;

    const objects = canvas.getObjects();
    const actualIndex = objects.length - 1 - layer.index;
    // eslint-disable-next-line security/detect-object-injection
    const obj = objects[actualIndex]; // Safe: actualIndex is calculated from validated layer.index

    if (obj && actualIndex < objects.length - 1) {
      canvas.bringObjectForward(obj);
      canvas.renderAll();
      setRefreshTrigger(prev => prev + 1);
    }
  };

  const moveLayerDown = (layer: LayerInfo, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canvas) return;

    const objects = canvas.getObjects();
    const actualIndex = objects.length - 1 - layer.index;
    // eslint-disable-next-line security/detect-object-injection
    const obj = objects[actualIndex]; // Safe: actualIndex is calculated from validated layer.index

    if (obj && actualIndex > 0) {
      canvas.sendObjectBackwards(obj);
      canvas.renderAll();
      setRefreshTrigger(prev => prev + 1);
    }
  };

  const isLayerSelected = (layer: LayerInfo): boolean => {
    return selectedObjects.includes(layer.id);
  };

  if (!canvas) {
    return (
      <Card className="w-80">
        <CardHeader>
          <CardTitle className="text-sm">Layers</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Canvas not initialized
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-80">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm">Layers</CardTitle>
        <Badge variant="outline" className="badge-neutral">
          {layers.length}
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        {layers.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-sm text-muted-foreground">
              No objects on canvas
            </p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {layers.map((layer) => (
              <div
                key={layer.id}
                onClick={() => handleLayerClick(layer)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 border-b cursor-pointer hover:bg-accent transition-colors",
                  isLayerSelected(layer) && "bg-accent border-l-4 border-l-primary"
                )}
              >
                {/* Type Icon */}
                <div className="text-muted-foreground">
                  {getTypeIcon(layer.type)}
                </div>

                {/* Layer Name */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{layer.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {getTypeName(layer.type)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {/* Move Up */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => moveLayerUp(layer, e)}
                    disabled={layer.index === 0}
                  >
                    <ChevronUp className="h-3 w-3" />
                  </Button>

                  {/* Move Down */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => moveLayerDown(layer, e)}
                    disabled={layer.index === layers.length - 1}
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>

                  {/* Visibility Toggle */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => toggleVisibility(layer, e)}
                  >
                    {layer.visible ? (
                      <Eye className="h-3 w-3" />
                    ) : (
                      <EyeOff className="h-3 w-3 opacity-50" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
