'use client';
import ActionButtons from '@/components/ActionButtons';
import AnalysisTopControls from '@/components/AnalysisTopControls';
import CameraDisplay from '@/components/CameraDisplay';
import InfoOverlay from '@/components/InfoOverlay';
import ResultsModal from '@/components/ResultsModal';
import Toast from '@/components/Toast';
import TouchButton from '@/components/TouchButton';
import { M3Colors, TypographyScale } from '@/constants/themeConstants';
import { useCameraStream } from '@/hooks/useCameraStream';
import { sendAnalysisData } from '@/services/analysisService';
import { ConcentrationResponse, PlacedCrosshair, TestType } from '@/types';
import { extractZoomedFrame } from '@/utils/zoomUtils';
import { useCallback, useMemo, useRef, useState } from 'react';

/**
 * Biomedical Device Analysis Interface
 *
 * Captures test strip images for colorimetric analysis of:
 * - Albumin (ALB): Protein levels in urine
 * - Alkaline Phosphatase (ALP): Liver enzyme levels
 * - Creatinine: Kidney function marker
 *
 * CRITICAL REQUIREMENTS:
 * - Exactly ONE white reference point (for color calibration)
 * - At least ONE analysis point (ALB, ALP, or CREATININE)
 * - Consistent 2.5x zoom for accurate color measurement
 * - High-quality image capture (92% JPEG quality)
 *
 * Point IDs are preserved throughout the workflow to match
 * backend results with frontend crosshair positions.
 */
export default function CameraAppPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTestType, setCurrentTestType] = useState<TestType>('WHITE');
  const [toastMessage, setToastMessage] = useState<string>('');
  const [capturedImageDataUrl, setCapturedImageDataUrl] = useState<string | null>(null);
  const [showInfoOverlay, setShowInfoOverlay] = useState(true);
  const [placedCrosshairs, setPlacedCrosshairs] = useState<PlacedCrosshair[]>([]);

  const [analysisResult, setAnalysisResult] = useState<ConcentrationResponse[] | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState<boolean>(false);
  const [showResultsModal, setShowResultsModal] = useState<boolean>(false);
  const [isPostAnalysis, setIsPostAnalysis] = useState<boolean>(false);

  const handleStreamError = useCallback((message: string) => {
    setToastMessage(message);
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
    setToastMessage('');
    setIsLoadingAnalysis(false);
    setCurrentTestType('ALB');
    setIsPostAnalysis(false);
  }, []);

  const handleEditPoints = useCallback(() => {
    setAnalysisResult(null);
    setShowResultsModal(false);
    setToastMessage('');
    setIsPostAnalysis(false);
    // Keep placedCrosshairs and capturedImageDataUrl intact
  }, []);

  const handleCaptureImage = useCallback(async () => {
    const video = videoRef.current;
    if (!video?.readyState || video.videoWidth === 0) {
      setToastMessage('Video stream not ready. Please ensure camera access is granted.');
      return;
    }

    try {
      // High-quality capture for accurate medical analysis (0.98 JPEG quality)
      const dataURL = (await extractZoomedFrame(video, 'dataURL', 0.98)) as string;
      setCapturedImageDataUrl(dataURL);
      setPlacedCrosshairs([]);
      setToastMessage('');
      setAnalysisResult(null);
      setShowResultsModal(false);
    } catch (error) {
      console.error('Capture error:', error);
      setToastMessage('Failed to capture image. Please try again.');
    }
  }, []);

  const handleImageAreaClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!capturedImageDataUrl || isLoadingAnalysis) return;

      // Prevent adding points in post-analysis mode (after closing modal)
      if (isPostAnalysis && !showResultsModal) return;

      const rect = event.currentTarget.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));

      // Prevent multiple white reference points
      if (currentTestType === 'WHITE' && placedCrosshairs.some((ch) => ch.testType === 'WHITE')) {
        setToastMessage('Only ONE white reference point allowed.');
        return;
      }

      const pointId = `point-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      setPlacedCrosshairs((prev) => [
        ...prev,
        {
          id: pointId,
          x,
          y,
          testType: currentTestType,
          pointIndex: prev.length + 1
        }
      ]);
      setToastMessage('');
    },
    [capturedImageDataUrl, currentTestType, isLoadingAnalysis, placedCrosshairs, isPostAnalysis, showResultsModal]
  );

  // Validation: exactly 1 white point + at least 1 analysis point
  const whitePointCount = useMemo(() => placedCrosshairs.filter((ch) => ch.testType === 'WHITE').length, [placedCrosshairs]);
  const analysisPointCount = useMemo(() => placedCrosshairs.filter((ch) => ch.testType !== 'WHITE').length, [placedCrosshairs]);
  const canAnalyze = useMemo(() => whitePointCount === 1 && analysisPointCount > 0, [whitePointCount, analysisPointCount]);

  const handleSendData = useCallback(async () => {
    if (!capturedImageDataUrl) {
      setToastMessage('No image captured.');
      return;
    }

    if (!canAnalyze) {
      setToastMessage('Exactly one WHITE reference point and at least one analysis point required.');
      return;
    }

    setToastMessage('');
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
      setIsPostAnalysis(true);
    } else {
      setToastMessage(response.error || 'Analysis failed.');
    }
  }, [capturedImageDataUrl, placedCrosshairs, canAnalyze]);

  const handleClearLastPoint = useCallback(() => setPlacedCrosshairs((prev) => prev.slice(0, -1)), []);
  const handleClearAllPoints = useCallback(() => setPlacedCrosshairs([]), []);

  if (showInfoOverlay) {
    return <InfoOverlay onStartAnalysis={() => setShowInfoOverlay(false)} />;
  }

  return (
    <main
      className={`${M3Colors.surfaceContainer} flex flex-col overflow-hidden`}
      style={{ height: '100dvh' }}
    >
      <header className="flex-shrink-0 text-center px-4 py-3 bg-gradient-to-b from-black/10 to-transparent">
        <h1 className={`${TypographyScale.headlineSmall} font-bold ${M3Colors.onSurface} drop-shadow-sm`}>Medical Analysis</h1>
      </header>

      <div className="overflow-hidden px-4 py-2" style={{ height: '60vh' }}>
        <CameraDisplay
          videoRef={videoRef}
          capturedImageDataUrl={capturedImageDataUrl}
          placedCrosshairs={placedCrosshairs}
          analysisResults={isPostAnalysis ? analysisResult : null}
          onImageAreaClick={handleImageAreaClick}
        />
      </div>

      <div className="flex-shrink-0 px-4 flex flex-col justify-end" style={{ height: '40vh', paddingBottom: 'max(1rem, env(safe-area-inset-bottom) + 0.5rem)' }}>
        {!capturedImageDataUrl ? (
          <TouchButton onClick={handleCaptureImage} disabled={isLoadingAnalysis} variant="primary" size="large" className="w-full">
            Capture Image
          </TouchButton>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {!isPostAnalysis && (
              <AnalysisTopControls
                currentTestType={currentTestType}
                onTestTypeChange={setCurrentTestType}
                placedCrosshairsCount={placedCrosshairs.length}
                onClearLastPoint={handleClearLastPoint}
                onClearAllPoints={handleClearAllPoints}
                disabled={isLoadingAnalysis}
              />
            )}
            {isPostAnalysis && !showResultsModal && (
              <div className={`p-3 rounded-2xl ${M3Colors.primaryContainer} ${M3Colors.onPrimaryContainer} ${M3Colors.shadowMd} text-center`}>
                <p className={`${TypographyScale.titleSmall} font-medium`}>Analysis Complete</p>
                <p className={`${TypographyScale.bodySmall} mt-1`}>
                  Choose &quot;Edit Points&quot; to modify crosshairs or &quot;Retake Image&quot; to start over
                </p>
              </div>
            )}
            <ActionButtons
              onRetakeImage={resetToCaptureState}
              onSendDataToServer={handleSendData}
              onEditPoints={handleEditPoints}
              canAnalyze={canAnalyze}
              isLoadingAnalysis={isLoadingAnalysis}
              placedCrosshairsCount={placedCrosshairs.length}
              isPostAnalysis={isPostAnalysis && !showResultsModal}
            />
          </div>
        )}
      </div>

      {isLoadingAnalysis && capturedImageDataUrl && (
        <div
          className={`absolute inset-x-4 bottom-20 p-4 rounded-2xl ${M3Colors.secondaryContainer} ${M3Colors.onSecondaryContainer} ${M3Colors.shadowMd} text-center`}
          role="status"
          aria-live="polite"
        >
          <p className={`${TypographyScale.titleMedium} animate-pulse`}>Analyzing, please wait...</p>
        </div>
      )}
      
      {showResultsModal && analysisResult && <ResultsModal results={analysisResult} onClose={() => setShowResultsModal(false)} />}
      {toastMessage && <Toast message={toastMessage} type="error" onClose={() => setToastMessage('')} />}
    </main>
  );
}
