"use client";

/**
 * WebGL Flipbook Viewer
 *
 * Interactive 3D flipbook viewer with page-turning animations
 * Built with Three.js and React Three Fiber
 */

import { useRef, useState, useEffect, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface FlipbookPage {
  id: string;
  page_number: number;
  image_url: string;
  thumbnail_url: string;
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
  pages: FlipbookPage[];
  initialPage?: number;
  onPageChange?: (pageNumber: number) => void;
  onHotspotClick?: (hotspot: FlipbookHotspot) => void;
  onClose?: () => void;
  className?: string;
}

/**
 * Page component with texture and turn animation
 */
function Page({
  imageUrl,
  position,
  rotation,
  isActive,
  onClick,
}: {
  imageUrl: string;
  position: [number, number, number];
  rotation: [number, number, number];
  isActive: boolean;
  onClick?: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Load texture
  const texture = useTexture(imageUrl);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  // Animate page turn
  useFrame((state, delta) => {
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
      <planeGeometry args={[2, 2.8]} />
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
 */
function Hotspot({
  xPercent,
  yPercent,
  width,
  height,
  label,
  onClick,
}: {
  xPercent: number;
  yPercent: number;
  width: number;
  height: number;
  label?: string;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  // Convert percentage to 3D coordinates
  // Page is 2 units wide, 2.8 units tall
  const x = ((xPercent - 50) / 50) * 1; // -1 to 1
  const y = ((50 - yPercent) / 50) * 1.4; // -1.4 to 1.4
  const w = (width / 100) * 2;
  const h = (height / 100) * 2.8;

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
  onHotspotClick?: (hotspot: FlipbookHotspot) => void;
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
  pages,
  initialPage = 1,
  onPageChange,
  onHotspotClick,
  onClose,
  className,
}: FlipbookViewerProps) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const totalPages = pages.length;

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
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNextPage, goToPreviousPage, goToPage, totalPages, onClose]);

  return (
    <div className={cn("relative h-full w-full bg-slate-900", className)}>
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
                      ? "border-blue-500 ring-2 ring-blue-400"
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
      <div className="absolute left-0 right-0 top-0 bg-gradient-to-b from-black/80 to-transparent p-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex gap-2">
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

      {/* Keyboard shortcuts hint */}
      <div className="absolute bottom-24 right-6 rounded-lg bg-black/60 p-3 text-xs text-white">
        <div className="font-semibold">Keyboard Shortcuts:</div>
        <div className="mt-1 space-y-1">
          <div>← → Arrow keys to navigate</div>
          <div>Space for next page</div>
          <div>Home/End for first/last</div>
          <div>ESC to close</div>
        </div>
      </div>
    </div>
  );
}
