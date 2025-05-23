'use client';
import { videoConstraints } from '@/constants/appConstants';
import { RefObject, useEffect } from 'react';

interface UseCameraStreamProps {
  videoRef: RefObject<HTMLVideoElement>;
  enabled: boolean; // Controls if the camera should be active
  onStreamError: (message: string) => void;
}

export function useCameraStream({ videoRef, enabled, onStreamError }: UseCameraStreamProps) {
  useEffect(() => {
    let stream: MediaStream | null = null;

    const initCamera = async () => {
      if (!videoRef.current) return;

      if (!enabled) {
        // If not enabled, ensure any existing stream is stopped
        if (videoRef.current.srcObject) {
          const existingStream = videoRef.current.srcObject as MediaStream;
          existingStream.getTracks().forEach((track) => track.stop());
          videoRef.current.srcObject = null;
        }
        return;
      }

      // If already streaming with the correct stream, do nothing
      if (videoRef.current.srcObject) return;

      try {
        stream = await navigator.mediaDevices.getUserMedia(videoConstraints);
        if (videoRef.current) {
          // Check ref again as it might have changed
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch((err) => {
            console.error('Error playing video stream:', err);
            onStreamError('Could not play video stream.');
          });
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
      stream?.getTracks().forEach((track) => track.stop());
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [enabled, videoRef, onStreamError]);
}
