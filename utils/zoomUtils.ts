// Zoom constant
export const CAMERA_ZOOM_FACTOR = 2.5;

/**
 * Extracts the zoomed-in portion of a video element as a data URL or blob
 * @param videoElement - The video element to extract from
 * @param format - Output format: 'dataURL' or 'blob'
 * @param quality - JPEG quality (0-1)
 * @returns Promise<string | Blob> - The cropped image as data URL or blob
 */
export async function extractZoomedFrame(
  videoElement: HTMLVideoElement,
  format: 'dataURL' | 'blob' = 'dataURL',
  quality: number = 0.92
): Promise<string | Blob> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
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
}

/**
 * Applies zoom to a video element using native API or CSS transform
 * @param videoElement - The video element to apply zoom to
 * @param stream - The media stream associated with the video
 */
export async function applyVideoZoom(videoElement: HTMLVideoElement, stream: MediaStream): Promise<void> {
  const videoTrack = stream.getVideoTracks()[0];
  if (!videoTrack) return;

  // HACK: TypeScript doesn't include zoom in MediaTrackCapabilities yet,
  // but it's supported in modern browsers. Using 'any' to bypass type checking.
  const capabilities = videoTrack.getCapabilities() as any;

  if (capabilities.zoom && capabilities.zoom.min && capabilities.zoom.max) {
    // Use MediaStream API zoom if available
    const zoomValue = Math.min(CAMERA_ZOOM_FACTOR, capabilities.zoom.max);
    // HACK: TypeScript doesn't recognize 'zoom' as a valid constraint yet.
    // This is a valid constraint in browsers that support camera zoom.
    await videoTrack.applyConstraints({
      advanced: [{ zoom: zoomValue } as any]
    });
  } else {
    // Fallback to CSS transform for manual scaling
    videoElement.style.transform = `scale(${CAMERA_ZOOM_FACTOR})`;
    videoElement.style.transformOrigin = 'center';
  }
}

/**
 * Resets zoom on a video element
 * @param videoElement - The video element to reset zoom on
 */
export function resetVideoZoom(videoElement: HTMLVideoElement): void {
  videoElement.style.transform = '';
  videoElement.style.transformOrigin = '';
}
