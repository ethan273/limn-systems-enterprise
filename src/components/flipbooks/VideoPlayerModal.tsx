"use client";
import { log } from '@/lib/logger';

/**
 * Video Player Modal
 *
 * Displays video content in a modal overlay with support for:
 * - YouTube videos
 * - Vimeo videos
 * - Native video (MP4, WebM, OGG)
 * - Fullscreen mode
 * - Responsive sizing
 *
 * Phase 7: Video Embedding
 */

import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, Maximize, Minimize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VideoPlayerModalProps {
  /** Whether modal is open */
  open: boolean;

  /** Close callback */
  onClose: () => void;

  /** Video URL (YouTube, Vimeo, or direct video file) */
  videoUrl: string;

  /** Optional video title */
  title?: string;

  /** Optional video description */
  description?: string;
}

/**
 * Extract video ID from YouTube URL
 */
function getYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

/**
 * Extract video ID from Vimeo URL
 */
function getVimeoVideoId(url: string): string | null {
  const pattern = /vimeo\.com\/(?:video\/)?(\d+)/;
  const match = url.match(pattern);
  return match ? match[1] : null;
}

/**
 * Detect video source type
 */
function getVideoSource(url: string): {
  type: 'youtube' | 'vimeo' | 'native';
  id?: string;
} {
  // YouTube
  const youtubeId = getYouTubeVideoId(url);
  if (youtubeId) {
    return { type: 'youtube', id: youtubeId };
  }

  // Vimeo
  const vimeoId = getVimeoVideoId(url);
  if (vimeoId) {
    return { type: 'vimeo', id: vimeoId };
  }

  // Native video (MP4, WebM, etc.)
  return { type: 'native' };
}

/**
 * Video Player Modal Component
 */
export function VideoPlayerModal({
  open,
  onClose,
  videoUrl,
  title,
  description,
}: VideoPlayerModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoSource = getVideoSource(videoUrl);

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch((err) => log.error('Fullscreen request failed:', err));
    } else {
      document.exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch((err) => log.error('Exit fullscreen failed:', err));
    }
  };

  // Monitor fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Reset fullscreen when modal closes
  useEffect(() => {
    if (!open && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }, [open]);

  /**
   * Render YouTube embed
   */
  const renderYouTubeVideo = (videoId: string) => {
    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;

    return (
      <iframe
        src={embedUrl}
        title={title || 'YouTube video'}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full"
        style={{ border: 'none' }}
      />
    );
  };

  /**
   * Render Vimeo embed
   */
  const renderVimeoVideo = (videoId: string) => {
    const embedUrl = `https://player.vimeo.com/video/${videoId}?autoplay=1&title=0&byline=0&portrait=0`;

    return (
      <iframe
        src={embedUrl}
        title={title || 'Vimeo video'}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        className="w-full h-full"
        style={{ border: 'none' }}
      />
    );
  };

  /**
   * Render native video element
   */
  const renderNativeVideo = (url: string) => {
    return (
      <video
        src={url}
        controls
        autoPlay
        className="w-full h-full"
        style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
      >
        Your browser does not support the video tag.
      </video>
    );
  };

  /**
   * Render appropriate video player
   */
  const renderVideoPlayer = () => {
    switch (videoSource.type) {
      case 'youtube':
        return renderYouTubeVideo(videoSource.id!);
      case 'vimeo':
        return renderVimeoVideo(videoSource.id!);
      case 'native':
        return renderNativeVideo(videoUrl);
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Unsupported video format</p>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          "max-w-5xl p-0 gap-0",
          isFullscreen && "max-w-none w-screen h-screen"
        )}
        // Prevent dialog from closing on outside click during video playback
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
          <div className="flex-1 min-w-0">
            {title && (
              <h3 className="font-semibold text-lg truncate">{title}</h3>
            )}
            {description && (
              <p className="text-sm text-muted-foreground truncate">{description}</p>
            )}
          </div>

          <div className="flex items-center gap-2 ml-4">
            {/* Fullscreen toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="h-8 w-8"
              title={isFullscreen ? 'Exit fullscreen (ESC)' : 'Enter fullscreen (F)'}
            >
              {isFullscreen ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )}
            </Button>

            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
              title="Close (ESC)"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Video player */}
        <div
          className={cn(
            "relative bg-black flex items-center justify-center",
            isFullscreen ? "h-[calc(100vh-64px)]" : "aspect-video"
          )}
        >
          {renderVideoPlayer()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
