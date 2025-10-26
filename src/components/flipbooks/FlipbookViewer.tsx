"use client";

/**
 * WebGL Flipbook Viewer
 *
 * Interactive 3D flipbook viewer with page-turning animations
 * Built with Three.js and React Three Fiber
 * Enhanced with TOC panel for improved navigation
 */

import { useRef, useState, useEffect, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, Menu, Maximize, Minimize } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api/client";
import { TOCPanel } from "@/components/flipbooks/navigation/TOCPanel";

interface FlipbookPage {
  id: string;
  page_number: number;
  image_url: string;
  thumbnail_url: string;
  width?: number | null;
  height?: number | null;
  hotspots?: Array<{
    id: string;
    x_percent: number;
    y_percent: number;
    width: number;
    height: number;
    label?: string;
    product: {
      id: string;
      name: string;
      sku: string;
      thumbnail_url: string | null;
    };
  }>;
}

type FlipbookHotspot = NonNullable<FlipbookPage["hotspots"]>[0];

interface FlipbookViewerProps {
  flipbookId?: string;
  pages: FlipbookPage[];
  initialPage?: number;
  onPageChange?: (_pageNumber: number) => void;
  onHotspotClick?: (_hotspot: FlipbookHotspot) => void;
  onClose?: () => void;
  className?: string;
}

/**
 * Page component with texture and turn animation
 * Dynamically sizes based on page aspect ratio
 */
function Page({
  imageUrl,
  position,
  rotation,
  isActive,
  onClick,
  pageWidth,
  pageHeight,
}: {
  imageUrl: string;
  position: [number, number, number];
  rotation: [number, number, number];
  isActive: boolean;
  onClick?: () => void;
  pageWidth?: number | null;
  pageHeight?: number | null;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Load texture
  const texture = useTexture(imageUrl);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  // Calculate aspect ratio from page dimensions
  // Default to 2:2.8 (portrait) if dimensions not available
  const aspectRatio = (pageWidth && pageHeight) ? pageWidth / pageHeight : 2 / 2.8;

  // Standard page height (keep consistent viewer size)
  const standardHeight = 2.8;

  // Calculate width based on aspect ratio
  const planeWidth = standardHeight * aspectRatio;
  const planeHeight = standardHeight;

  // Animate page turn
  useFrame((_state, _delta) => {
    if (!meshRef.current) return;

    // Subtle hover effect
    if (hovered) {
      meshRef.current.scale.lerp(new THREE.Vector3(1.02, 1.02, 1.02), 0.1);
    } else {
      meshRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={rotation}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <planeGeometry args={[planeWidth, planeHeight]} />
      <meshStandardMaterial
        map={texture}
        side={THREE.DoubleSide}
        transparent={!isActive}
        opacity={isActive ? 1 : 0.7}
      />
    </mesh>
  );
}

/**
 * Hotspot marker component
 * Dynamically positions based on page dimensions
 */
function Hotspot({
  xPercent,
  yPercent,
  width,
  height,
  label,
  onClick,
  pageWidth,
  pageHeight,
}: {
  xPercent: number;
  yPercent: number;
  width: number;
  height: number;
  label?: string;
  onClick: () => void;
  pageWidth?: number | null;
  pageHeight?: number | null;
}) {
  const [hovered, setHovered] = useState(false);

  // Calculate page aspect ratio and plane dimensions (matches Page component)
  const aspectRatio = (pageWidth && pageHeight) ? pageWidth / pageHeight : 2 / 2.8;
  const standardHeight = 2.8;
  const planeWidth = standardHeight * aspectRatio;
  const planeHeight = standardHeight;

  // Convert percentage to 3D coordinates using actual plane dimensions
  const halfWidth = planeWidth / 2;
  const halfHeight = planeHeight / 2;
  const x = ((xPercent - 50) / 50) * halfWidth; // -halfWidth to +halfWidth
  const y = ((50 - yPercent) / 50) * halfHeight; // -halfHeight to +halfHeight
  const w = (width / 100) * planeWidth;
  const h = (height / 100) * planeHeight;

  return (
    <group position={[x, y, 0.01]}>
      {/* Hotspot indicator */}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial
          color={hovered ? "#3b82f6" : "#60a5fa"}
          transparent
          opacity={hovered ? 0.4 : 0.2}
        />
      </mesh>

      {/* Label */}
      {label && hovered && (
        <mesh position={[0, h / 2 + 0.2, 0]}>
          <planeGeometry args={[w, 0.3]} />
          <meshBasicMaterial color="#1e293b" opacity={0.9} transparent />
        </mesh>
      )}
    </group>
  );
}

/**
 * 3D Scene with pages and hotspots
 */
function Scene({
  currentPage,
  pages,
  onHotspotClick,
}: {
  currentPage: number;
  pages: FlipbookPage[];
  onHotspotClick?: (_hotspot: FlipbookHotspot) => void;
}) {
  const page = pages[currentPage - 1];

  if (!page) return null;

  return (
    <group>
      {/* Main page */}
      <Page
        imageUrl={page.image_url}
        position={[0, 0, 0]}
        rotation={[0, 0, 0]}
        isActive={true}
        pageWidth={page.width}
        pageHeight={page.height}
      />

      {/* Hotspots */}
      {page.hotspots?.map((hotspot) => (
        <Hotspot
          key={hotspot.id}
          xPercent={hotspot.x_percent}
          yPercent={hotspot.y_percent}
          width={hotspot.width}
          height={hotspot.height}
          label={hotspot.label || hotspot.product.name}
          onClick={() => onHotspotClick?.(hotspot)}
          pageWidth={page.width}
          pageHeight={page.height}
        />
      ))}

      {/* Lighting */}
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 5, 5]} intensity={0.5} />
    </group>
  );
}

/**
 * Main Flipbook Viewer Component
 */
export function FlipbookViewer({
  flipbookId,
  pages,
  initialPage = 1,
  onPageChange,
  onHotspotClick,
  onClose,
  className,
}: FlipbookViewerProps) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTOC, setShowTOC] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalPages = pages.length;

  // Fetch TOC data if flipbookId is provided
  const { data: tocData } = api.flipbooks.getTOC.useQuery(
    { flipbookId: flipbookId! },
    { enabled: !!flipbookId }
  );

  // Navigation handlers
  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      onPageChange?.(nextPage);
    }
  }, [currentPage, totalPages, onPageChange]);

  const goToPreviousPage = useCallback(() => {
    if (currentPage > 1) {
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
      onPageChange?.(prevPage);
    }
  }, [currentPage, onPageChange]);

  const goToPage = useCallback(
    (pageNumber: number) => {
      if (pageNumber >= 1 && pageNumber <= totalPages) {
        setCurrentPage(pageNumber);
        onPageChange?.(pageNumber);
      }
    },
    [totalPages, onPageChange]
  );

  // Fullscreen handlers
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current
        .requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch((err) => console.error('Fullscreen request failed:', err));
    } else {
      document
        .exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch((err) => console.error('Exit fullscreen failed:', err));
    }
  }, []);

  // Monitor fullscreen changes (e.g., ESC key)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        goToNextPage();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToPreviousPage();
      } else if (e.key === "Home") {
        e.preventDefault();
        goToPage(1);
      } else if (e.key === "End") {
        e.preventDefault();
        goToPage(totalPages);
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === "Escape") {
        e.preventDefault();
        // ESC exits fullscreen first, then closes viewer
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          onClose?.();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNextPage, goToPreviousPage, goToPage, totalPages, toggleFullscreen, onClose]);

  return (
    <div
      ref={containerRef}
      className={cn("relative h-full w-full bg-background flex", className)}
    >
      {/* TOC Panel (collapsible sidebar) */}
      {showTOC && tocData?.tocData && (
        <div className="w-80 border-r bg-background flex-shrink-0 z-20">
          <TOCPanel
            tocData={tocData.tocData}
            currentPage={currentPage}
            onNavigate={goToPage}
            settings={{
              enabled: true,
              position: "left",
              defaultExpanded: false,
              showPageNumbers: true,
              searchEnabled: true,
            }}
          />
        </div>
      )}

      {/* Main viewer area */}
      <div className="flex-1 relative">
        {/* Canvas */}
        <Canvas
        camera={{ position: [0, 0, 4], fov: 50 }}
        className="h-full w-full"
      >
        <Scene
          currentPage={currentPage}
          pages={pages}
          onHotspotClick={onHotspotClick}
        />
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          minDistance={2}
          maxDistance={8}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 2}
        />
      </Canvas>

      {/* Controls Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          {/* Previous button */}
          <Button
            variant="outline"
            size="lg"
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
            className="bg-white/10 text-white hover:bg-white/20"
          >
            <ChevronLeft className="h-6 w-6" />
            <span className="ml-2">Previous</span>
          </Button>

          {/* Page indicator */}
          <div className="flex items-center gap-4">
            <span className="text-lg font-medium text-white">
              Page {currentPage} of {totalPages}
            </span>

            {/* Page thumbnails */}
            <div className="flex gap-2">
              {pages.map((page) => (
                <button
                  key={page.id}
                  onClick={() => goToPage(page.page_number)}
                  className={cn(
                    "h-16 w-12 rounded border-2 transition-all",
                    currentPage === page.page_number
                      ? "border-primary ring-2 ring-primary/50"
                      : "border-white/20 hover:border-white/40"
                  )}
                  style={{
                    backgroundImage: `url(${page.thumbnail_url})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Next button */}
          <Button
            variant="outline"
            size="lg"
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className="bg-white/10 text-white hover:bg-white/20"
          >
            <span className="mr-2">Next</span>
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Top controls */}
      <div className="absolute left-0 right-0 top-0 bg-gradient-to-b from-black/80 to-transparent p-4 z-10">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex gap-2">
            {/* TOC Toggle Button */}
            {tocData?.tocData && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowTOC(!showTOC)}
                className="bg-white/10 text-white hover:bg-white/20"
                title={showTOC ? "Hide table of contents" : "Show table of contents"}
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              className="bg-white/10 text-white hover:bg-white/20"
            >
              <ZoomIn className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="bg-white/10 text-white hover:bg-white/20"
            >
              <ZoomOut className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex gap-2">
            {/* Fullscreen Toggle Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={toggleFullscreen}
              className="bg-white/10 text-white hover:bg-white/20"
              title={isFullscreen ? "Exit fullscreen (F)" : "Enter fullscreen (F)"}
            >
              {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </Button>

            {onClose && (
              <Button
                variant="outline"
                size="icon"
                onClick={onClose}
                className="bg-white/10 text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="absolute bottom-24 right-6 rounded-lg bg-black/60 p-3 text-xs text-white z-10">
        <div className="font-semibold">Keyboard Shortcuts:</div>
        <div className="mt-1 space-y-1">
          <div>← → Arrow keys to navigate</div>
          <div>Space for next page</div>
          <div>Home/End for first/last</div>
          <div>F for fullscreen</div>
          <div>ESC to close</div>
          {tocData?.tocData && <div>Click menu icon for TOC</div>}
        </div>
      </div>
      </div>
    </div>
  );
}
