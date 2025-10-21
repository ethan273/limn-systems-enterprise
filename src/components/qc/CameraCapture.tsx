'use client';

/**
 * Camera Capture Component
 * Progressive Web Camera for QC Photo Capture
 * Optimized for mobile devices in factory environments
 */

import { useState, useRef, useEffect } from 'react';
import { compressImage, getRecommendedSettings } from '@/lib/imageCompression';
import { uploadQueue } from '@/lib/uploadQueue';

export interface CameraCaptureProps {
  inspectionId: string;
  checkpointId: string;
  onPhotoCapture?: (_photoUrl: string) => void;
  onError?: (_error: string) => void;
  maxPhotos?: number; // Maximum number of photos (default: 10)
}

export function CameraCapture({
  inspectionId,
  checkpointId,
  onPhotoCapture,
  onError,
  maxPhotos = 10,
}: CameraCaptureProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  /**
   * Open camera and start video stream
   */
  const openCamera = async () => {
    try {
      setIsOpen(true);

      // Request camera permission and start stream
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraReady(true);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to access camera';
      console.error('Camera error:', errorMessage);
      onError?.(errorMessage);
      setIsOpen(false);
    }
  };

  /**
   * Close camera and stop video stream
   */
  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsOpen(false);
    setIsCameraReady(false);
  };

  /**
   * Capture photo from video stream
   */
  const capturePhoto = async () => {
    if (!videoRef.current || !isCameraReady) return;

    try {
      // Create canvas and capture frame
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b) resolve(b);
            else reject(new Error('Failed to create blob'));
          },
          'image/jpeg',
          0.95
        );
      });

      // Compress image based on network conditions
      const networkInfo = (navigator as any).connection;
      const effectiveType = networkInfo?.effectiveType;
      const compressionSettings = getRecommendedSettings(effectiveType);

      const compressed = await compressImage(blob, compressionSettings);

      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `qc-${checkpointId}-${timestamp}.jpg`;

      // Add to upload queue
      const taskId = uploadQueue.addTask(compressed.blob, filename, {
        inspection_id: inspectionId,
        checkpoint_id: checkpointId,
        user_id: 'current-user', // Will be replaced with actual user ID
        captured_at: new Date().toISOString(),
      });

      // Subscribe to upload completion
      uploadQueue.onComplete(taskId, (result) => {
        if (result.success && result.url) {
          setCapturedPhotos((prev) => [...prev, result.url!]);
          onPhotoCapture?.(result.url);
          setUploadingCount((prev) => prev - 1);
        } else {
          onError?.(`Upload failed: ${result.error}`);
          setUploadingCount((prev) => prev - 1);
        }
      });

      setUploadingCount((prev) => prev + 1);

      // Show thumbnail immediately (optimistic UI)
      setCapturedPhotos((prev) => [...prev, compressed.dataUrl]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to capture photo';
      console.error('Capture error:', errorMessage);
      onError?.(errorMessage);
    }
  };

  /**
   * Toggle camera facing mode (front/back)
   */
  const toggleFacingMode = async () => {
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);

    // Restart camera with new facing mode
    if (isOpen) {
      closeCamera();
      setTimeout(() => openCamera(), 100);
    }
  };

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      closeCamera();
    };
  }, []);

  /**
   * Check if max photos reached
   */
  const isMaxPhotosReached = capturedPhotos.length >= maxPhotos;

  return (
    <div className="camera-capture-container">
      {/* Open Camera Button */}
      {!isOpen && (
        <button
          onClick={openCamera}
          disabled={isMaxPhotosReached}
          className="btn btn-primary btn-camera-open"
          aria-label="Open camera"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="icon-camera"
          >
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          <span>Take Photo ({capturedPhotos.length}/{maxPhotos})</span>
        </button>
      )}

      {/* Camera Modal */}
      {isOpen && (
        <div className="camera-modal" role="dialog" aria-modal="true">
          <div className="camera-modal-content">
            {/* Video Stream */}
            <video
              ref={videoRef}
              className="camera-video"
              autoPlay
              playsInline
              muted
              aria-label="Camera preview"
            />

            {/* Camera Controls */}
            <div className="camera-controls">
              {/* Close Button */}
              <button
                onClick={closeCamera}
                className="btn btn-secondary btn-camera-close"
                aria-label="Close camera"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="icon-close"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                Close
              </button>

              {/* Capture Button */}
              <button
                onClick={capturePhoto}
                disabled={!isCameraReady || isMaxPhotosReached}
                className="btn btn-primary btn-camera-capture"
                aria-label="Capture photo"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="icon-capture"
                >
                  <circle cx="12" cy="12" r="10" />
                </svg>
                Capture
              </button>

              {/* Flip Camera Button */}
              <button
                onClick={toggleFacingMode}
                className="btn btn-secondary btn-camera-flip"
                aria-label="Flip camera"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="icon-flip"
                >
                  <polyline points="1 4 1 10 7 10" />
                  <polyline points="23 20 23 14 17 14" />
                  <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
                </svg>
                Flip
              </button>
            </div>

            {/* Photo Counter */}
            <div className="camera-photo-count" aria-live="polite">
              {capturedPhotos.length} / {maxPhotos} photos
              {uploadingCount > 0 && ` (${uploadingCount} uploading)`}
            </div>
          </div>
        </div>
      )}

      {/* Captured Photos Thumbnails */}
      {capturedPhotos.length > 0 && (
        <div className="camera-thumbnails" role="list" aria-label="Captured photos">
          {capturedPhotos.map((url, index) => (
            <div key={index} className="camera-thumbnail" role="listitem">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Captured photo ${index + 1}`} loading="lazy" />
            </div>
          ))}
        </div>
      )}

      {/* Status Messages */}
      {isMaxPhotosReached && (
        <div className="camera-status-message camera-status-warning" role="alert">
          Maximum number of photos reached ({maxPhotos})
        </div>
      )}

      {uploadingCount > 0 && (
        <div className="camera-status-message camera-status-info" role="status" aria-live="polite">
          Uploading {uploadingCount} {uploadingCount === 1 ? 'photo' : 'photos'}...
        </div>
      )}
    </div>
  );
}
