import { ConcentrationResponse, PlacedCrosshair } from '@/types';
import { extractZoomedFrame } from '@/utils/zoomUtils';

export interface AnalysisRequestData {
  imageDataUrl: string;
  crosshairs: PlacedCrosshair[];
  videoElement?: HTMLVideoElement; // Added optional video element reference
}

export interface AnalysisServiceResponse {
  success: boolean;
  results?: ConcentrationResponse[];
  error?: string;
}

/**
 * Sends captured image and analysis points to the server for processing
 *
 * @description
 * This function prepares and sends analysis data to the backend API. It supports two modes:
 * 1. Standard mode: Uses a pre-captured image data URL (typical flow)
 * 2. Live mode: Extracts a fresh zoomed frame from a video element
 *
 * The videoElement parameter is optional and typically not used in the standard flow where:
 * - User captures an image (already zoomed)
 * - Places analysis points on the captured image
 * - Sends the captured image for analysis
 *
 * The videoElement parameter would be useful for:
 * - Real-time analysis without capturing
 * - Refreshing the image just before sending
 * - Alternative workflows where the captured image might be stale
 *
 * @param {AnalysisRequestData} data - The analysis request data
 * @param {string} data.imageDataUrl - Base64 data URL of the image to analyze (already zoomed in standard flow)
 * @param {PlacedCrosshair[]} data.crosshairs - Array of analysis points with coordinates and test types
 * @param {HTMLVideoElement} [data.videoElement] - Optional video element for live extraction (overrides imageDataUrl)
 *
 * @returns {Promise<AnalysisServiceResponse>} Analysis results or error information
 *
 * @example
 * ```tsx
 * // Standard usage with pre-captured image
 * const response = await sendAnalysisData({
 *   imageDataUrl: capturedImageDataUrl,
 *   crosshairs: placedCrosshairs
 * });
 *
 * // Alternative usage with live video extraction
 * const response = await sendAnalysisData({
 *   imageDataUrl: '', // Will be ignored
 *   crosshairs: placedCrosshairs,
 *   videoElement: videoRef.current
 * });
 * ```
 */
export async function sendAnalysisData({ imageDataUrl, crosshairs, videoElement }: AnalysisRequestData): Promise<AnalysisServiceResponse> {
  const formData = new FormData();
  try {
    // Get the image blob - either from zoomed video or original data URL
    const photoBlob = videoElement
      ? ((await extractZoomedFrame(videoElement, 'blob', 0.95)) as Blob)
      : await fetch(imageDataUrl).then((res) => res.blob());

    formData.append('photo.jpeg', photoBlob, 'photo.jpeg');

    const crosshairsData = crosshairs.map(({ id, ...rest }) => rest); // Exclude client-side 'id'
    formData.append('points.json', new Blob([JSON.stringify(crosshairsData)], { type: 'application/json' }), 'points.json');

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      console.error('API URL (NEXT_PUBLIC_API_URL) is not configured in environment variables.');
      return { success: false, error: 'Client configuration error: API URL is missing.' };
    }

    const response = await fetch(`${apiUrl}/process`, {
      method: 'POST',
      body: formData
    });

    const responseData = await response.json();

    if (response.ok) {
      return { success: true, results: responseData.results as ConcentrationResponse[] };
    } else {
      return {
        success: false,
        error: `Server error: ${responseData.error || response.statusText || 'Unknown error'} (Status: ${response.status})`
      };
    }
  } catch (error) {
    console.error('Client-side error during send or parsing response:', error);
    let errorMessage = 'Failed to send data or interpret server response. Check network or console.';
    if (error instanceof Error) {
      errorMessage = `Network or client-side error: ${error.message}`;
    }
    return { success: false, error: errorMessage };
  }
}
