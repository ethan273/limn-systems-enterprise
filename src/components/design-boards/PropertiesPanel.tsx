"use client";

import { useEffect, useState } from "react";
import * as fabric from "fabric";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  Trash2,
  Copy,
  Group,
  Ungroup
} from "lucide-react";

interface PropertiesPanelProps {
  canvas: fabric.Canvas | null;
  selectedObjects: string[];
  onObjectsChange?: () => void;
}

export function PropertiesPanel({
  canvas,
  selectedObjects,
  onObjectsChange
}: PropertiesPanelProps) {
  const [fillColor, setFillColor] = useState("#3B82F6");
  const [strokeColor, setStrokeColor] = useState("#1E40AF");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [opacity, setOpacity] = useState(100);
  const [fontSize, setFontSize] = useState(20);

  const activeObjects = canvas?.getActiveObjects() || [];
  const hasSelection = activeObjects.length > 0;
  const singleSelection = activeObjects.length === 1;
  const multipleSelection = activeObjects.length > 1;

  // Update local state when selection changes
  useEffect(() => {
    if (singleSelection && activeObjects[0]) {
      const obj = activeObjects[0];

      if (obj.fill && typeof obj.fill === 'string') {
        setFillColor(obj.fill);
      }
      if (obj.stroke && typeof obj.stroke === 'string') {
        setStrokeColor(obj.stroke);
      }
      if (obj.strokeWidth) {
        setStrokeWidth(obj.strokeWidth);
      }
      if (obj.opacity !== undefined) {
        setOpacity(Math.round(obj.opacity * 100));
      }

      // For text objects
      if (obj.type === 'i-text' || obj.type === 'text') {
        const textObj = obj as fabric.IText;
        if (textObj.fontSize) {
          setFontSize(textObj.fontSize);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedObjects, singleSelection]); // activeObjects is derived from canvas state

  const handleFillColorChange = (color: string) => {
    setFillColor(color);
    activeObjects.forEach(obj => {
      obj.set({ fill: color });
    });
    canvas?.renderAll();
    onObjectsChange?.();
  };

  const handleStrokeColorChange = (color: string) => {
    setStrokeColor(color);
    activeObjects.forEach(obj => {
      obj.set({ stroke: color });
    });
    canvas?.renderAll();
    onObjectsChange?.();
  };

  const handleStrokeWidthChange = (value: number[]) => {
    const width = value[0];
    setStrokeWidth(width);
    activeObjects.forEach(obj => {
      obj.set({ strokeWidth: width });
    });
    canvas?.renderAll();
    onObjectsChange?.();
  };

  const handleOpacityChange = (value: number[]) => {
    const op = value[0];
    setOpacity(op);
    activeObjects.forEach(obj => {
      obj.set({ opacity: op / 100 });
    });
    canvas?.renderAll();
    onObjectsChange?.();
  };

  const handleFontSizeChange = (value: number[]) => {
    const size = value[0];
    setFontSize(size);
    activeObjects.forEach(obj => {
      if (obj.type === 'i-text' || obj.type === 'text') {
        (obj as fabric.IText).set({ fontSize: size });
      }
    });
    canvas?.renderAll();
    onObjectsChange?.();
  };

  const bringToFront = () => {
    activeObjects.forEach(obj => {
      canvas?.bringObjectToFront(obj);
    });
    canvas?.renderAll();
    onObjectsChange?.();
  };

  const bringForward = () => {
    activeObjects.forEach(obj => {
      canvas?.bringObjectForward(obj);
    });
    canvas?.renderAll();
    onObjectsChange?.();
  };

  const sendBackward = () => {
    activeObjects.forEach(obj => {
      canvas?.sendObjectBackwards(obj);
    });
    canvas?.renderAll();
    onObjectsChange?.();
  };

  const sendToBack = () => {
    activeObjects.forEach(obj => {
      canvas?.sendObjectToBack(obj);
    });
    canvas?.renderAll();
    onObjectsChange?.();
  };

  const deleteObjects = () => {
    activeObjects.forEach(obj => {
      canvas?.remove(obj);
    });
    canvas?.discardActiveObject();
    canvas?.renderAll();
    onObjectsChange?.();
  };

  const duplicateObjects = () => {
    if (!canvas) return;

    activeObjects.forEach(async obj => {
      const cloned = await obj.clone();
      cloned.set({
        left: (cloned.left || 0) + 10,
        top: (cloned.top || 0) + 10,
      });
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      canvas.renderAll();
      onObjectsChange?.();
    });
  };

  const groupObjects = () => {
    if (!canvas || !multipleSelection) return;

    const group = new fabric.Group(activeObjects);
    activeObjects.forEach(obj => canvas.remove(obj));
    canvas.add(group);
    canvas.setActiveObject(group);
    canvas.renderAll();
    onObjectsChange?.();
  };

  const ungroupObjects = () => {
    if (!canvas || !singleSelection) return;

    const obj = activeObjects[0];
    if (obj.type !== 'group') return;

    const group = obj as fabric.Group;
    // const items = group.getObjects(); // Unused - may be needed for future features

    (group as any).toActiveSelection?.();
    canvas.remove(group);
    canvas.renderAll();
    onObjectsChange?.();
  };

  if (!hasSelection) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Properties</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Select an object to edit its properties
          </p>
        </CardContent>
      </Card>
    );
  }

  const isGroup = singleSelection && activeObjects[0].type === 'group';
  const isText = singleSelection && (activeObjects[0].type === 'i-text' || activeObjects[0].type === 'text');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">
          {singleSelection ? 'Object Properties' : `${activeObjects.length} Objects Selected`}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Actions */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Actions</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={duplicateObjects}>
              <Copy className="h-4 w-4 mr-1" />
              Duplicate
            </Button>
            <Button variant="outline" size="sm" onClick={deleteObjects}>
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>

        {/* Layer Order */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Layer Order</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={bringToFront} title="Bring to Front">
              <ChevronsUp className="h-4 w-4 mr-1" />
              To Front
            </Button>
            <Button variant="outline" size="sm" onClick={bringForward} title="Bring Forward">
              <ArrowUp className="h-4 w-4 mr-1" />
              Forward
            </Button>
            <Button variant="outline" size="sm" onClick={sendBackward} title="Send Backward">
              <ArrowDown className="h-4 w-4 mr-1" />
              Backward
            </Button>
            <Button variant="outline" size="sm" onClick={sendToBack} title="Send to Back">
              <ChevronsDown className="h-4 w-4 mr-1" />
              To Back
            </Button>
          </div>

          {multipleSelection && (
            <Button variant="outline" size="sm" className="w-full" onClick={groupObjects}>
              <Group className="h-4 w-4 mr-1" />
              Group
            </Button>
          )}

          {isGroup && (
            <Button variant="outline" size="sm" className="w-full" onClick={ungroupObjects}>
              <Ungroup className="h-4 w-4 mr-1" />
              Ungroup
            </Button>
          )}
        </div>

        {/* Fill Color */}
        <div className="space-y-2">
          <Label htmlFor="fill-color" className="text-xs">Fill Color</Label>
          <div className="flex gap-2">
            <input
              id="fill-color"
              type="color"
              value={fillColor}
              onChange={(e) => handleFillColorChange(e.target.value)}
              className="w-16 h-10 rounded border border-input cursor-pointer"
            />
            <Input
              type="text"
              value={fillColor}
              onChange={(e) => handleFillColorChange(e.target.value)}
              className="flex-1"
              placeholder="#3B82F6"
            />
          </div>
        </div>

        {/* Stroke Color */}
        <div className="space-y-2">
          <Label htmlFor="stroke-color" className="text-xs">Stroke Color</Label>
          <div className="flex gap-2">
            <input
              id="stroke-color"
              type="color"
              value={strokeColor}
              onChange={(e) => handleStrokeColorChange(e.target.value)}
              className="w-16 h-10 rounded border border-input cursor-pointer"
            />
            <Input
              type="text"
              value={strokeColor}
              onChange={(e) => handleStrokeColorChange(e.target.value)}
              className="flex-1"
              placeholder="#1E40AF"
            />
          </div>
        </div>

        {/* Stroke Width */}
        <div className="space-y-2">
          <Label className="text-xs">Stroke Width: {strokeWidth}px</Label>
          <Slider
            value={[strokeWidth]}
            onValueChange={handleStrokeWidthChange}
            min={0}
            max={20}
            step={1}
          />
        </div>

        {/* Opacity */}
        <div className="space-y-2">
          <Label className="text-xs">Opacity: {opacity}%</Label>
          <Slider
            value={[opacity]}
            onValueChange={handleOpacityChange}
            min={0}
            max={100}
            step={5}
          />
        </div>

        {/* Font Size (for text objects) */}
        {isText && (
          <div className="space-y-2">
            <Label className="text-xs">Font Size: {fontSize}px</Label>
            <Slider
              value={[fontSize]}
              onValueChange={handleFontSizeChange}
              min={8}
              max={72}
              step={1}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
