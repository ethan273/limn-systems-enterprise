"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useBoardStore } from "@/lib/design-boards/board-store";
import { Moon, Sun } from "lucide-react";

interface BoardSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BoardSettingsDialog({ open, onOpenChange }: BoardSettingsDialogProps) {
  const {
    theme,
    setTheme,
    backgroundColor,
    setBackgroundColor,
    canvasWidth,
    setCanvasWidth,
    canvasHeight,
    setCanvasHeight,
    showGrid,
    setShowGrid,
    gridSize,
    setGridSize,
    gridEnabled,
    setGridEnabled,
    snapToGrid,
    setSnapToGrid,
  } = useBoardStore();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Board Settings</DialogTitle>
          <DialogDescription>
            Customize your design board appearance and behavior
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Theme Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-semibold">Theme</Label>
                <p className="text-sm text-muted-foreground">
                  Choose your preferred theme
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setTheme('light')}
                className={`flex items-center justify-center gap-2 rounded-lg border-2 p-4 transition-colors ${
                  theme === 'light'
                    ? 'border-primary bg-primary/10'
                    : 'border-muted hover:border-muted-foreground/50'
                }`}
              >
                <Sun className="h-5 w-5" />
                <span className="font-medium">Light</span>
              </button>

              <button
                onClick={() => setTheme('dark')}
                className={`flex items-center justify-center gap-2 rounded-lg border-2 p-4 transition-colors ${
                  theme === 'dark'
                    ? 'border-primary bg-primary/10'
                    : 'border-muted hover:border-muted-foreground/50'
                }`}
              >
                <Moon className="h-5 w-5" />
                <span className="font-medium">Dark</span>
              </button>
            </div>
          </div>

          <Separator />

          {/* Canvas Settings */}
          <div className="space-y-4">
            <div className="space-y-0.5">
              <Label className="text-base font-semibold">Canvas</Label>
              <p className="text-sm text-muted-foreground">
                Configure canvas appearance and size
              </p>
            </div>

            {/* Background Color */}
            <div className="grid gap-2">
              <Label htmlFor="bg-color">Background Color</Label>
              <div className="flex gap-2">
                <Input
                  id="bg-color"
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="w-20 h-10 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="flex-1"
                  placeholder="#ffffff"
                />
              </div>
            </div>

            {/* Canvas Size */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="canvas-width">Width (px)</Label>
                <Input
                  id="canvas-width"
                  type="number"
                  min="800"
                  max="7680"
                  value={canvasWidth}
                  onChange={(e) => setCanvasWidth(Number(e.target.value))}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="canvas-height">Height (px)</Label>
                <Input
                  id="canvas-height"
                  type="number"
                  min="600"
                  max="4320"
                  value={canvasHeight}
                  onChange={(e) => setCanvasHeight(Number(e.target.value))}
                />
              </div>
            </div>

            {/* Common Sizes */}
            <div className="grid gap-2">
              <Label>Quick Sizes</Label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    setCanvasWidth(1920);
                    setCanvasHeight(1080);
                  }}
                  className="px-3 py-2 text-sm border rounded-md hover:bg-accent transition-colors"
                >
                  1080p
                </button>
                <button
                  onClick={() => {
                    setCanvasWidth(2560);
                    setCanvasHeight(1440);
                  }}
                  className="px-3 py-2 text-sm border rounded-md hover:bg-accent transition-colors"
                >
                  1440p
                </button>
                <button
                  onClick={() => {
                    setCanvasWidth(3840);
                    setCanvasHeight(2160);
                  }}
                  className="px-3 py-2 text-sm border rounded-md hover:bg-accent transition-colors"
                >
                  4K
                </button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Grid Settings */}
          <div className="space-y-4">
            <div className="space-y-0.5">
              <Label className="text-base font-semibold">Grid</Label>
              <p className="text-sm text-muted-foreground">
                Configure grid display and snapping behavior
              </p>
            </div>

            {/* Show Grid */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="show-grid">Show Grid</Label>
                <p className="text-sm text-muted-foreground">
                  Display grid overlay on canvas
                </p>
              </div>
              <Switch
                id="show-grid"
                checked={gridEnabled}
                onCheckedChange={setGridEnabled}
              />
            </div>

            {/* Snap to Grid */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="snap-grid">Snap to Grid</Label>
                <p className="text-sm text-muted-foreground">
                  Align objects to grid automatically
                </p>
              </div>
              <Switch
                id="snap-grid"
                checked={snapToGrid}
                onCheckedChange={setSnapToGrid}
              />
            </div>

            {/* Grid Size */}
            <div className="grid gap-2">
              <Label htmlFor="grid-size">Grid Size (px)</Label>
              <div className="flex gap-2">
                <Input
                  id="grid-size"
                  type="number"
                  min="5"
                  max="100"
                  step="5"
                  value={gridSize}
                  onChange={(e) => setGridSize(Number(e.target.value))}
                  className="flex-1"
                />
                <Select
                  value={gridSize.toString()}
                  onValueChange={(value) => setGridSize(Number(value))}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10px</SelectItem>
                    <SelectItem value="20">20px</SelectItem>
                    <SelectItem value="25">25px</SelectItem>
                    <SelectItem value="50">50px</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Performance Settings */}
          <div className="space-y-4">
            <div className="space-y-0.5">
              <Label className="text-base font-semibold">Performance</Label>
              <p className="text-sm text-muted-foreground">
                Optimize performance for your device
              </p>
            </div>

            <div className="rounded-lg border p-4 space-y-2">
              <p className="text-sm font-medium">Auto-save</p>
              <p className="text-sm text-muted-foreground">
                Changes are automatically saved to the database every few seconds.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
