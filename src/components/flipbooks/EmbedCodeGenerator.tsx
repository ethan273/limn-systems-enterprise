"use client";
import { log } from '@/lib/logger';

/**
 * Embed Code Generator Component
 *
 * Generates iframe embed code for flipbooks with customization options:
 * - Size (width, height, responsive)
 * - Theme (light, dark, auto)
 * - Auto-play on load
 * - Controls visibility
 * - Starting page
 *
 * Features:
 * - Copy to clipboard
 * - Live preview
 * - Responsive sizing options
 * - Custom dimensions
 *
 * Phase 8: Embed Code Generation
 */

import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Copy, Check, Code, Eye, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface EmbedCodeGeneratorProps {
  /** Flipbook ID */
  flipbookId: string;

  /** Optional flipbook title for preview */
  title?: string;

  /** Base URL (e.g., https://yourdomain.com) */
  baseUrl?: string;
}

/**
 * Size presets for common embed dimensions
 */
const SIZE_PRESETS = {
  small: { width: 600, height: 400, label: "Small (600×400)" },
  medium: { width: 800, height: 600, label: "Medium (800×600)" },
  large: { width: 1200, height: 800, label: "Large (1200×800)" },
  fullwidth: { width: "100%", height: 600, label: "Full Width" },
  responsive: { width: "100%", height: "100%", label: "Responsive" },
  custom: { width: 800, height: 600, label: "Custom" },
};

/**
 * Embed Code Generator Component
 */
export function EmbedCodeGenerator({
  flipbookId,
  title,
  baseUrl = typeof window !== "undefined" ? window.location.origin : "",
}: EmbedCodeGeneratorProps) {
  // Embed configuration state
  const [sizePreset, setSizePreset] = useState<keyof typeof SIZE_PRESETS>("medium");
  const [customWidth, setCustomWidth] = useState<number>(800);
  const [customHeight, setCustomHeight] = useState<number>(600);
  const [theme, setTheme] = useState<"light" | "dark" | "auto">("auto");
  const [startPage, setStartPage] = useState<number>(1);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [autoPlay, setAutoPlay] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Get actual dimensions based on preset
  const dimensions = useMemo(() => {
    if (sizePreset === "custom") {
      return { width: customWidth, height: customHeight };
    }
    // eslint-disable-next-line security/detect-object-injection
    return SIZE_PRESETS[sizePreset];
  }, [sizePreset, customWidth, customHeight]);

  // Generate embed URL with query parameters
  const embedUrl = useMemo(() => {
    const url = new URL(`/flipbooks/embed/${flipbookId}`, baseUrl);

    if (theme !== "auto") url.searchParams.set("theme", theme);
    if (startPage > 1) url.searchParams.set("page", startPage.toString());
    if (!showControls) url.searchParams.set("controls", "false");
    if (autoPlay) url.searchParams.set("autoplay", "true");

    return url.toString();
  }, [flipbookId, baseUrl, theme, startPage, showControls, autoPlay]);

  // Generate iframe embed code
  const iframeCode = useMemo(() => {
    const widthAttr = typeof dimensions.width === "number"
      ? `width="${dimensions.width}"`
      : `style="width: ${dimensions.width};"`;

    const heightAttr = typeof dimensions.height === "number"
      ? `height="${dimensions.height}"`
      : `style="height: ${dimensions.height};"`;

    const responsiveStyle = sizePreset === "responsive"
      ? ' style="width: 100%; height: 100%; min-height: 600px;"'
      : '';

    return `<iframe
  src="${embedUrl}"
  ${sizePreset !== "responsive" ? widthAttr : ""}
  ${sizePreset !== "responsive" ? heightAttr : ""}${responsiveStyle}
  frameborder="0"
  allowfullscreen
  allow="autoplay; fullscreen"
  title="${title || "Flipbook"}"
></iframe>`;
  }, [embedUrl, dimensions, sizePreset, title]);

  // Generate responsive wrapper code
  const responsiveWrapperCode = useMemo(() => {
    const aspectRatio = typeof dimensions.height === "number" && typeof dimensions.width === "number"
      ? (dimensions.height / dimensions.width) * 100
      : 75; // Default 4:3 ratio

    return `<!-- Responsive wrapper for ${title || "flipbook"} -->
<div style="position: relative; padding-bottom: ${aspectRatio.toFixed(2)}%; height: 0; overflow: hidden;">
  <iframe
    src="${embedUrl}"
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
    frameborder="0"
    allowfullscreen
    allow="autoplay; fullscreen"
    title="${title || "Flipbook"}"
  ></iframe>
</div>`;
  }, [embedUrl, dimensions, title]);

  // Generate direct link
  const directLink = useMemo(() => {
    return `${baseUrl}/flipbooks/${flipbookId}`;
  }, [baseUrl, flipbookId]);

  // Copy to clipboard handler
  const copyToClipboard = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(`${label} copied to clipboard`);

      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      log.error("Failed to copy:", { err });
      toast.error("Failed to copy to clipboard");
    }
  }, []);

  // Open preview in new window
  const openPreview = useCallback(() => {
    window.open(embedUrl, "_blank", "noopener,noreferrer");
  }, [embedUrl]);

  return (
    <div className="space-y-6">
      {/* Configuration Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Size & Dimensions */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="size-preset">Size Preset</Label>
            <Select
              value={sizePreset}
              onValueChange={(value) => setSizePreset(value as keyof typeof SIZE_PRESETS)}
            >
              <SelectTrigger id="size-preset">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SIZE_PRESETS).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {sizePreset === "custom" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="custom-width">Width (px)</Label>
                <Input
                  id="custom-width"
                  type="number"
                  value={customWidth}
                  onChange={(e) => setCustomWidth(parseInt(e.target.value) || 800)}
                  min={300}
                  max={2000}
                />
              </div>
              <div>
                <Label htmlFor="custom-height">Height (px)</Label>
                <Input
                  id="custom-height"
                  type="number"
                  value={customHeight}
                  onChange={(e) => setCustomHeight(parseInt(e.target.value) || 600)}
                  min={200}
                  max={1500}
                />
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="theme">Theme</Label>
            <Select value={theme} onValueChange={(value: any) => setTheme(value)}>
              <SelectTrigger id="theme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto (System)</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Right Column: Options */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="start-page">Starting Page</Label>
            <Input
              id="start-page"
              type="number"
              value={startPage}
              onChange={(e) => setStartPage(parseInt(e.target.value) || 1)}
              min={1}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="show-controls" className="cursor-pointer">
              Show Controls
            </Label>
            <Switch
              id="show-controls"
              checked={showControls}
              onCheckedChange={setShowControls}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="auto-play" className="cursor-pointer">
              Auto-play on Load
            </Label>
            <Switch
              id="auto-play"
              checked={autoPlay}
              onCheckedChange={setAutoPlay}
            />
          </div>

          <div className="pt-4">
            <Button
              onClick={openPreview}
              variant="outline"
              className="w-full"
              size="sm"
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview in New Window
            </Button>
          </div>
        </div>
      </div>

      {/* Embed Code Tabs */}
      <Tabs defaultValue="iframe" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="iframe">
            <Code className="h-4 w-4 mr-2" />
            Iframe
          </TabsTrigger>
          <TabsTrigger value="responsive">
            <Code className="h-4 w-4 mr-2" />
            Responsive
          </TabsTrigger>
          <TabsTrigger value="link">
            <ExternalLink className="h-4 w-4 mr-2" />
            Direct Link
          </TabsTrigger>
        </TabsList>

        {/* Iframe Code Tab */}
        <TabsContent value="iframe" className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Embed Code</Label>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(iframeCode, "Embed code")}
              >
                {copied ? (
                  <Check className="h-4 w-4 mr-2 text-foreground" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
              <code>{iframeCode}</code>
            </pre>
          </div>

          <div className="bg-muted/50 border rounded-lg p-4">
            <p className="text-sm text-foreground">
              <strong>Usage:</strong> Copy this code and paste it into your HTML where you want the flipbook to appear.
            </p>
          </div>
        </TabsContent>

        {/* Responsive Wrapper Tab */}
        <TabsContent value="responsive" className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Responsive Embed Code</Label>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(responsiveWrapperCode, "Responsive embed code")}
              >
                {copied ? (
                  <Check className="h-4 w-4 mr-2 text-foreground" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
              <code>{responsiveWrapperCode}</code>
            </pre>
          </div>

          <div className="bg-muted/50 border rounded-lg p-4">
            <p className="text-sm text-foreground">
              <strong>Responsive Embed:</strong> This code maintains the aspect ratio of your flipbook and scales automatically to fit any container width.
            </p>
          </div>
        </TabsContent>

        {/* Direct Link Tab */}
        <TabsContent value="link" className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Direct Link</Label>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(directLink, "Direct link")}
              >
                {copied ? (
                  <Check className="h-4 w-4 mr-2 text-foreground" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <code className="text-sm break-all">{directLink}</code>
            </div>
          </div>

          <div className="bg-muted/50 border rounded-lg p-4">
            <p className="text-sm text-foreground">
              <strong>Share Link:</strong> Share this link directly with others to view the full flipbook page.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Live Preview */}
      <div>
        <Label className="mb-2 block">Live Preview</Label>
        <div
          className={cn(
            "bg-muted rounded-lg border overflow-hidden",
            sizePreset === "responsive" && "aspect-video"
          )}
          style={{
            width: sizePreset !== "responsive" && typeof dimensions.width === "number"
              ? `${Math.min(dimensions.width, 800)}px`
              : "100%",
            height: sizePreset !== "responsive" && typeof dimensions.height === "number"
              ? `${Math.min(dimensions.height, 600)}px`
              : sizePreset === "responsive"
              ? "auto"
              : "600px",
          }}
        >
          <iframe
            src={embedUrl}
            className="w-full h-full"
            style={{ border: "none", minHeight: sizePreset === "responsive" ? "400px" : undefined }}
            title={`Preview: ${title || "Flipbook"}`}
            allowFullScreen
            allow="autoplay; fullscreen"
          />
        </div>
      </div>
    </div>
  );
}
