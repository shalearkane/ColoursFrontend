import { ConcentrationResponse, PlacedCrosshair } from '@/types';
import { extractZoomedFrame } from '@/utils/zoomUtils';

/**
 * Biomedical Analysis Service
 *
 * Handles image and point data submission for colorimetric analysis.
 * Critical for accurate concentration measurements of:
 * - Albumin, ALP, Creatinine levels
 * - Requires precise point coordinates for color sampling
 */

// Validates base64 image data format
const isValidDataUrl = (url: string): boolean => {
  return url.startsWith('data:image/') && url.includes('base64,');
};

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
 * Submits biomedical test data for colorimetric analysis
 *
 * CRITICAL: Point IDs are preserved to correlate backend results
 * with frontend crosshair positions in the results modal.
 *
 * Quality requirements:
 * - Image: 95% JPEG quality for accurate color analysis
 * - Zoom: Consistent 2.5x magnification
 * - Points: Precise coordinates for color sampling areas
 *
 * @param data.imageDataUrl - High-quality base64 image of test strip
 * @param data.crosshairs - Analysis points with preserved IDs
 * @param data.videoElement - Optional: extract fresh frame instead
 * @returns Promise resolving to concentration results with point correlation
 */
export async function sendAnalysisData({ imageDataUrl, crosshairs, videoElement }: AnalysisRequestData): Promise<AnalysisServiceResponse> {
  const formData = new FormData();
  try {
    // Only validate external data URL format
    if (!videoElement && !isValidDataUrl(imageDataUrl)) {
      throw new Error('Invalid image data URL format');
    }

    // Get the image blob - either from zoomed video or original data URL
    let photoBlob: Blob;

    if (videoElement) {
      photoBlob = (await extractZoomedFrame(videoElement, 'blob', 0.95)) as Blob;
    } else {
      const response = await fetch(imageDataUrl);
      if (!response.ok) {
        throw new Error(`Failed to process image data: ${response.statusText}`);
      }
      photoBlob = await response.blob();
    }

    if (!photoBlob) {
      throw new Error('Failed to create image blob');
    }

    formData.append('photo.jpeg', photoBlob, 'photo.jpeg');

    // CRITICAL: Preserve point IDs for result correlation in frontend
    // Backend needs these IDs to match concentration results to crosshair positions
    const crosshairsData = crosshairs.map((ch) => ({
      id: ch.id, // Essential for result matching
      x: ch.x, // Normalized coordinates (0-1)
      y: ch.y,
      testType: ch.testType,
      pointIndex: ch.pointIndex // Sequential numbering
    }));
    formData.append('points.json', new Blob([JSON.stringify(crosshairsData)], { type: 'application/json' }), 'points.json');

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      console.error('API URL (NEXT_PUBLIC_API_URL) is not configured in environment variables.');
      return { success: false, error: 'Client configuration error: API URL is missing.' };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    let response: Response;
    try {
      response = await fetch(`${apiUrl}/process`, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        throw new Error('Request timed out - please try again');
      }
      throw fetchError;
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`);
    }

    const responseData = await response.json();

    // Basic response validation
    if (!responseData?.results || !Array.isArray(responseData.results)) {
      throw new Error('Invalid response format from server');
    }

    // Validate concentration results have required fields
    const validResults = responseData.results.filter((result: unknown) => {
      const candidate = result as Record<string, unknown>;
      return (
        typeof candidate.pointIndex === 'number' &&
        typeof candidate.test_type === 'string' &&
        typeof candidate.concentration === 'number' &&
        typeof candidate.remarks === 'string' &&
        ['none', 'low', 'normal', 'high'].includes(candidate.remarks)
      );
    });

    if (validResults.length === 0) {
      throw new Error('No valid concentration results received from server');
    }

    return { success: true, results: validResults };
  } catch (error) {
    console.error('Error in sendAnalysisData:', error);

    let errorMessage = 'An unknown error occurred.';

    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    return {
      success: false,
      error: errorMessage
    };
  }
}
