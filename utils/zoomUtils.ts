/**
 * BIOMEDICAL CRITICAL: 2.5x zoom ensures adequate detail for color analysis
 * This zoom level provides optimal balance between:
 * - Color sampling accuracy (larger pixels = better color detection)
 * - Field of view (captures full test strip area)
 * - Image stability (manageable camera shake)
 */
export const CAMERA_ZOOM_FACTOR = 2.5;

/**
 * Extracts high-quality image for biomedical color analysis
 *
 * CRITICAL: Uses 2.5x zoom crop to maintain consistent magnification
 * across capture/preview/analysis pipeline. Quality set to 92% minimum
 * to preserve color fidelity for accurate concentration measurements.
 *
 * @param videoElement - Live video stream
 * @param format - 'blob' for upload, 'dataURL' for display
 * @param quality - JPEG quality (0.92+ recommended for medical accuracy)
 */
export async function extractZoomedFrame(
  videoElement: HTMLVideoElement,
  format: 'dataURL' | 'blob' = 'dataURL',
  quality: number = 0.92
): Promise<string | Blob> {
  // Basic null check for critical errors
  if (!videoElement) {
    throw new Error('Video element is required');
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    canvas.remove(); // Clean up canvas if context creation fails
    throw new Error('Failed to get canvas context');
  }

  const videoWidth = videoElement.videoWidth;
  const videoHeight = videoElement.videoHeight;

  // Calculate the size of the cropped area (1/zoomFactor of the original)
  const cropWidth = videoWidth / CAMERA_ZOOM_FACTOR;
  const cropHeight = videoHeight / CAMERA_ZOOM_FACTOR;

  // Calculate the offset to center the crop
  const offsetX = (videoWidth - cropWidth) / 2;
  const offsetY = (videoHeight - cropHeight) / 2;

  // Set canvas size to the original video dimensions (to maintain resolution)
  canvas.width = videoWidth;
  canvas.height = videoHeight;

  // Draw only the center portion of the video, scaled up to fill the canvas
  ctx.drawImage(
    videoElement,
    offsetX,
    offsetY,
    cropWidth,
    cropHeight, // Source rectangle (cropped area)
    0,
    0,
    canvas.width,
    canvas.height // Destination rectangle (full canvas)
  );

  try {
    if (format === 'dataURL') {
      return canvas.toDataURL('image/jpeg', quality);
    } else {
      // Convert canvas to blob
      return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to create blob from canvas'));
          },
          'image/jpeg',
          quality
        );
      });
    }
  } finally {
    // Always clean up the canvas
    canvas.remove();
  }
}

/**
 * Applies consistent 2.5x zoom for biomedical analysis
 *
 * Uses CSS transform exclusively for zoom - no media API zoom.
 * Consistent zoom is CRITICAL for:
 * - Accurate color measurement
 * - Matching capture/preview views
 * - Reliable concentration calculations
 */
export async function applyVideoZoom(videoElement: HTMLVideoElement): Promise<void> {
  // Apply CSS transform for 2.5x zoom
  videoElement.style.transform = `scale(${CAMERA_ZOOM_FACTOR})`;
  videoElement.style.transformOrigin = 'center';
}

/**
 * Resets video zoom when exiting analysis mode
 * Essential for proper cleanup and next session preparation
 */
export function resetVideoZoom(videoElement: HTMLVideoElement): void {
  if (!videoElement) return;

  videoElement.style.transform = '';
  videoElement.style.transformOrigin = '';
}
