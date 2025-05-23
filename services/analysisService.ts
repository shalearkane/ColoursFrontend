import { ConcentrationResponse, PlacedCrosshair } from '@/types';

export interface AnalysisRequestData {
  imageDataUrl: string;
  crosshairs: PlacedCrosshair[];
}

export interface AnalysisServiceResponse {
  success: boolean;
  results?: ConcentrationResponse[];
  error?: string;
}

export async function sendAnalysisData({ imageDataUrl, crosshairs }: AnalysisRequestData): Promise<AnalysisServiceResponse> {
  const formData = new FormData();
  try {
    const photoBlob = await fetch(imageDataUrl).then((res) => res.blob());
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
