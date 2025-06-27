'use client';
import { videoConstraints } from '@/constants/appConstants';
import { applyVideoZoom, resetVideoZoom } from '@/utils/zoomUtils';
import { RefObject, useEffect } from 'react';

interface UseCameraStreamProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  enabled: boolean; // Controls if the camera should be active
  onStreamError: (message: string) => void;
}

/**
 * Custom hook to manage camera stream with automatic zoom functionality
 *
 * @description
 * This hook handles:
 * - Camera initialization and cleanup
 * - Automatic application of zoom (native API or CSS fallback)
 * - Error handling for various camera access scenarios
 * - Stream lifecycle management based on enabled state
 *
 * @param {UseCameraStreamProps} props - Hook configuration
 * @param {RefObject<HTMLVideoElement>} props.videoRef - Reference to the video element that will display the stream
 * @param {boolean} props.enabled - Whether the camera should be active. When false, any existing stream is stopped
 * @param {(message: string) => void} props.onStreamError - Callback for handling stream errors with user-friendly messages
 *
 * @example
 * ```tsx
 * const videoRef = useRef<HTMLVideoElement>(null);
 * useCameraStream({
 *   videoRef,
 *   enabled: !isCapturing && !isAnalyzing,
 *   onStreamError: (error) => setErrorMessage(error)
 * });
 * ```
 */
export function useCameraStream({ videoRef, enabled, onStreamError }: UseCameraStreamProps) {
  useEffect(() => {
    if (!videoRef) return;

    let stream: MediaStream | null = null;
    // Capture the current video element to use in cleanup
    const videoElement = videoRef.current;

    const initCamera = async () => {
      if (!videoElement) return;

      if (!enabled) {
        // If not enabled, ensure any existing stream is stopped
        if (videoElement.srcObject) {
          const existingStream = videoElement.srcObject as MediaStream;
          existingStream.getTracks().forEach((track) => track.stop());
          videoElement.srcObject = null;
        }
        return;
      }

      // If already streaming with the correct stream, do nothing
      if (videoElement.srcObject) return;

      try {
        stream = await navigator.mediaDevices.getUserMedia(videoConstraints);
        // Check if component is still mounted and video element still exists
        if (videoRef.current && videoRef.current === videoElement) {
          videoElement.srcObject = stream;
          await videoElement.play().catch((err) => {
            console.error('Error playing video stream:', err);
            onStreamError('Could not play video stream.');
          });

          // Apply zoom using the shared utility
          await applyVideoZoom(videoElement, stream);
        }
      } catch (err) {
        console.error('Camera initialization error:', err);
        let message = 'Camera access denied or unavailable. Please check permissions.';
        if (err instanceof Error && err.name === 'NotFoundError') {
          message = 'No camera found. Please ensure a camera is connected and enabled.';
        } else if (err instanceof Error && err.name === 'NotAllowedError') {
          message = 'Camera access was denied. Please grant permission in your browser settings.';
        }
        onStreamError(message);
      }
    };

    initCamera();

    return () => {
      // Clean up stream
      stream?.getTracks().forEach((track) => track.stop());

      // Use the captured video element reference
      if (videoElement) {
        videoElement.srcObject = null;
        // Reset transform when cleaning up
        resetVideoZoom(videoElement);
      }
    };
  }, [enabled, videoRef, onStreamError]);
}
