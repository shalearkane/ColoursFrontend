'use client';
import ActionButtons from '@/components/ActionButtons';
import AnalysisTopControls from '@/components/AnalysisTopControls';
import CameraDisplay from '@/components/CameraDisplay';
import InfoOverlay from '@/components/InfoOverlay';
import ResultsModal from '@/components/ResultsModal';
import { M3Colors } from '@/constants/themeConstants';
import { useCameraStream } from '@/hooks/useCameraStream';
import { sendAnalysisData } from '@/services/analysisService';
import { ConcentrationResponse, PlacedCrosshair, TestType } from '@/types';
import { extractZoomedFrame } from '@/utils/zoomUtils';
import { useCallback, useMemo, useRef, useState } from 'react';

// Helper for error message display
const ErrorDisplay: React.FC<{ message: string }> = ({ message }) => (
  <div
    className={`${M3Colors.errorContainer} border-l-4 border-red-500 ${M3Colors.onErrorContainer} px-4 py-3 rounded-lg mb-4 ${M3Colors.shadowMd}`}
    role="alert"
  >
    <div className="flex">
      <div className="py-1">
        <svg className="fill-current h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zM9 5v6h2V5H9zm0 8v2h2v-2H9z" />
        </svg>
      </div>
      <div>
        <p className="font-bold">Error</p>
        <p className="text-sm">{message}</p>
      </div>
    </div>
  </div>
);

/**
 * Main camera application page component
 *
 * @description
 * This component manages the complete workflow for:
 * 1. Displaying a zoomed camera feed (2.5x zoom)
 * 2. Capturing zoomed images for analysis
 * 3. Placing analysis points on captured images
 * 4. Sending images with points to backend for concentration analysis
 * 5. Displaying analysis results
 *
 * The component enforces that the same 2.5x zoom is applied consistently across:
 * - Live camera preview
 * - Captured image
 * - Image sent to server
 *
 * @returns {JSX.Element} The camera application interface
 */
export default function CameraAppPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTestType, setCurrentTestType] = useState<TestType>('ALB');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [capturedImageDataUrl, setCapturedImageDataUrl] = useState<string | null>(null);
  const [showInfoOverlay, setShowInfoOverlay] = useState(true);
  const [placedCrosshairs, setPlacedCrosshairs] = useState<PlacedCrosshair[]>([]);

  const [analysisResult, setAnalysisResult] = useState<ConcentrationResponse[] | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState<boolean>(false);
  const [showResultsModal, setShowResultsModal] = useState<boolean>(false);

  const handleStreamError = useCallback((message: string) => {
    setErrorMessage(message);
  }, []);

  useCameraStream({
    videoRef,
    enabled: !showInfoOverlay && !capturedImageDataUrl && !isLoadingAnalysis, // Disable stream during analysis too
    onStreamError: handleStreamError
  });

  const resetToCaptureState = useCallback(() => {
    setCapturedImageDataUrl(null);
    setPlacedCrosshairs([]);
    setAnalysisResult(null);
    setShowResultsModal(false);
    setErrorMessage('');
    setIsLoadingAnalysis(false);
    setCurrentTestType('ALB'); // Reset test type
    // Camera stream will be re-enabled by useCameraStream hook's `enabled` dependency
  }, []);

  const handleCaptureImage = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.readyState < video.HAVE_METADATA || video.videoWidth === 0 || video.videoHeight === 0) {
      setErrorMessage('Video stream not ready or has no dimensions. Please ensure the camera is active and accessible.');
      return;
    }

    try {
      // Use the shared zoom extraction utility to capture only the zoomed portion
      const dataURL = (await extractZoomedFrame(video, 'dataURL', 0.92)) as string;
      setCapturedImageDataUrl(dataURL);
      setPlacedCrosshairs([]);
      setErrorMessage('');
      setAnalysisResult(null);
      setShowResultsModal(false);
    } catch (e) {
      console.error('Error generating data URL:', e);
      setErrorMessage('Failed to capture image. The canvas might be too large or tainted.');
    }
  }, []); // videoRef is stable

  const handleImageAreaClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!capturedImageDataUrl || isLoadingAnalysis) return;

      const targetElement = event.currentTarget;
      const rect = targetElement.getBoundingClientRect();

      const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));

      setPlacedCrosshairs((prev) => [
        ...prev,
        {
          id: `crosshair-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          x,
          y,
          testType: currentTestType,
          pointIndex: prev.length + 1
        }
      ]);
    },
    [capturedImageDataUrl, currentTestType, isLoadingAnalysis]
  );

  const handleSendData = useCallback(async () => {
    if (!capturedImageDataUrl) {
      setErrorMessage('No image captured to send.');
      return;
    }
    if (placedCrosshairs.length === 0) {
      setErrorMessage('Please place at least one analysis point on the image.');
      return;
    }
    if (!placedCrosshairs.some((ch) => ch.testType === 'WHITE')) {
      setErrorMessage('A WHITE reference point is required for color calibration. Please add one.');
      return;
    }

    setErrorMessage('');
    setIsLoadingAnalysis(true);
    setAnalysisResult(null);
    setShowResultsModal(false);

    const response = await sendAnalysisData({
      imageDataUrl: capturedImageDataUrl,
      crosshairs: placedCrosshairs
    });

    setIsLoadingAnalysis(false);
    if (response.success && response.results) {
      setAnalysisResult(response.results);
      setShowResultsModal(true);
    } else {
      setErrorMessage(response.error || 'An unknown error occurred during analysis.');
    }
  }, [capturedImageDataUrl, placedCrosshairs]);

  const handleClearLastPoint = useCallback(() => setPlacedCrosshairs((prev) => prev.slice(0, -1)), []);
  const handleClearAllPoints = useCallback(() => setPlacedCrosshairs([]), []);

  const hasWhitePoint = useMemo(() => placedCrosshairs.some((ch) => ch.testType === 'WHITE'), [placedCrosshairs]);
  const canAnalyze = useMemo(() => placedCrosshairs.length > 0 && hasWhitePoint, [placedCrosshairs, hasWhitePoint]);

  if (showInfoOverlay) {
    return <InfoOverlay onStartAnalysis={() => setShowInfoOverlay(false)} />;
  }

  return (
    <div className={`min-h-screen ${M3Colors.surfaceContainer} p-2 sm:p-4 flex flex-col items-center`}>
      <main className={`max-w-2xl w-full mx-auto ${M3Colors.surface} rounded-3xl ${M3Colors.shadow} p-4 sm:p-6 my-4`}>
        <header className="mb-6 text-center">
          <h1 className={`text-xl sm:text-2xl font-medium ${M3Colors.onSurface}`}>Image Analysis</h1>
        </header>

        {errorMessage && <ErrorDisplay message={errorMessage} />}

        <CameraDisplay
          videoRef={videoRef}
          capturedImageDataUrl={capturedImageDataUrl}
          placedCrosshairs={placedCrosshairs}
          onImageAreaClick={handleImageAreaClick}
        />

        {!capturedImageDataUrl ? (
          <button
            onClick={handleCaptureImage}
            disabled={isLoadingAnalysis} // Should not be loading analysis if no image captured, but for safety
            className={`w-full ${M3Colors.primary} ${M3Colors.onPrimary} font-semibold py-3.5 px-4 rounded-full ${M3Colors.shadowMd} transition-transform duration-150 ease-in-out hover:scale-[1.03] focus:outline-none focus:ring-4 focus:ring-indigo-300 text-lg disabled:opacity-70 disabled:cursor-not-allowed`}
          >
            Capture Image
          </button>
        ) : (
          <>
            <AnalysisTopControls
              currentTestType={currentTestType}
              onTestTypeChange={setCurrentTestType}
              placedCrosshairsCount={placedCrosshairs.length}
              onClearLastPoint={handleClearLastPoint}
              onClearAllPoints={handleClearAllPoints}
              disabled={isLoadingAnalysis}
            />
            <ActionButtons
              onRetakeImage={resetToCaptureState}
              onSendDataToServer={handleSendData}
              canAnalyze={canAnalyze}
              isLoadingAnalysis={isLoadingAnalysis}
              placedCrosshairsCount={placedCrosshairs.length}
            />
          </>
        )}

        {isLoadingAnalysis && capturedImageDataUrl && (
          <div
            className={`mt-6 p-4 rounded-xl ${M3Colors.secondaryContainer} ${M3Colors.onSecondaryContainer} ${M3Colors.shadowMd} text-center`}
            role="status"
            aria-live="polite"
          >
            <p className="text-lg font-mono animate-pulse">Analyzing, please wait...</p>
          </div>
        )}
      </main>
      {showResultsModal && analysisResult && <ResultsModal results={analysisResult} onClose={() => setShowResultsModal(false)} />}
    </div>
  );
}
