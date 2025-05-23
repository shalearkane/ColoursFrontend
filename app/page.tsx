'use client';
import { useEffect, useRef, useState } from 'react';

const videoConstraints = {
  video: {
    facingMode: 'environment'
  }
};

type TestType = 'CREATININE' | 'ALB' | 'ALP' | 'WHITE';

interface PlacedCrosshair {
  id: string;
  x: number; // Relative X (0 to 1)
  y: number; // Relative Y (0 to 1)
  testType: TestType;
  pointIndex: number; // 1-based index
}

const CROSSHAIR_SVG_PATH = '/crosshair2.svg';

// M3 Inspired Colors
const M3Colors = {
  primary: 'bg-indigo-600', // A vibrant primary for actions
  onPrimary: 'text-white',
  secondaryContainer: 'bg-indigo-100',
  onSecondaryContainer: 'text-indigo-800',
  tertiary: 'bg-purple-600',
  onTertiary: 'text-white',
  error: 'bg-red-600',
  onError: 'text-white',
  errorContainer: 'bg-red-100',
  onErrorContainer: 'text-red-700',
  surface: 'bg-white', // Main app surface
  surfaceContainer: 'bg-gray-50', // Slightly off-white for containers on surface
  onSurface: 'text-gray-900',
  onSurfaceVariant: 'text-gray-700',
  outline: 'border-gray-300',
  shadow: 'shadow-lg', // M3 often uses softer, more layered shadows
  shadowMd: 'shadow-md'
};

const TestTypeColorValues: Record<TestType, { bg: string; text: string }> = {
  WHITE: { bg: 'bg-gray-500', text: 'text-white' },
  ALB: { bg: 'bg-green-600', text: 'text-white' },
  ALP: { bg: 'bg-blue-600', text: 'text-white' },
  CREATININE: { bg: 'bg-violet-600', text: 'text-white' }
};

interface ConcentrationResponse {
  pointIndex: number;
  test_type: TestType;
  concentration: number;
  remarks: 'low' | 'normal' | 'high';
}

interface ResultsModalProps {
  results: ConcentrationResponse[];
  onClose: () => void;
}

const ResultsModal: React.FC<ResultsModalProps> = ({ results, onClose }) => {
  return (
    <div className={`fixed inset-0 ${M3Colors.surfaceContainer} bg-opacity-75 flex items-center justify-center z-50 p-4`}>
      <div className={`${M3Colors.surface} rounded-2xl ${M3Colors.shadow} max-w-xl w-full flex flex-col ${M3Colors.onSurface} overflow-hidden`}>
        <div className={`p-6 border-b ${M3Colors.outline}`}>
          <h2 className={`text-2xl font-semibold ${M3Colors.onSurface}`}>Analysis Results</h2>
        </div>
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <table className="w-full min-w-full divide-y divide-gray-200">
            <thead className={`${M3Colors.secondaryContainer}`}>
              <tr>
                <th scope="col" className={`px-4 py-3.5 text-left text-sm font-semibold ${M3Colors.onSecondaryContainer}`}>
                  Point #
                </th>
                <th scope="col" className={`px-4 py-3.5 text-left text-sm font-semibold ${M3Colors.onSecondaryContainer}`}>
                  Test Type
                </th>
                <th scope="col" className={`px-4 py-3.5 text-left text-sm font-semibold ${M3Colors.onSecondaryContainer}`}>
                  Concentration
                </th>
                <th scope="col" className={`px-4 py-3.5 text-left text-sm font-semibold ${M3Colors.onSecondaryContainer}`}>
                  Remark
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${M3Colors.outline} ${M3Colors.surface}`}>
              {results.map((result) => (
                <tr key={result.pointIndex}>
                  <td className={`whitespace-nowrap px-4 py-3 text-sm ${M3Colors.onSurfaceVariant}`}>{result.pointIndex}</td>
                  <td className={`whitespace-nowrap px-4 py-3 text-sm ${M3Colors.onSurfaceVariant}`}>{result.test_type}</td>
                  <td className={`whitespace-nowrap px-4 py-3 text-sm ${M3Colors.onSurfaceVariant}`}>{result.concentration.toFixed(2)}</td>
                  <td className={`whitespace-nowrap px-4 py-3 text-sm ${M3Colors.onSurfaceVariant}`}>{result.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={`p-6 border-t ${M3Colors.outline} flex justify-end`}>
          <button
            onClick={onClose}
            className={`${M3Colors.primary} ${M3Colors.onPrimary} font-medium py-2.5 px-6 rounded-full text-sm transition-transform duration-150 ease-in-out hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-300`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default function CameraApp() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTestType, setCurrentTestType] = useState<TestType>('ALB');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [capturedImageDataUrl, setCapturedImageDataUrl] = useState<string | null>(null);
  const [showInfoOverlay, setShowInfoOverlay] = useState(true);
  const [placedCrosshairs, setPlacedCrosshairs] = useState<PlacedCrosshair[]>([]);

  const [analysisResult, setAnalysisResult] = useState<ConcentrationResponse[] | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState<boolean>(false);
  const [showResultsModal, setShowResultsModal] = useState<boolean>(false);

  useEffect(() => {
    if (showInfoOverlay || capturedImageDataUrl) {
      // Stop camera if overlay is shown or if we already have a captured image
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      return;
    }

    let stream: MediaStream | null = null;
    const initCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia(videoConstraints);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err) {
        console.error('Camera initialization error:', err);
        setErrorMessage('Camera access denied or unavailable. Please check permissions.');
      }
    };

    initCamera();

    return () => {
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [showInfoOverlay, capturedImageDataUrl]);

  const handleCaptureImage = () => {
    const video = videoRef.current;
    if (!video || video.readyState < video.HAVE_METADATA || video.videoWidth === 0) {
      setErrorMessage('Video stream not ready. Please wait or try again.');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth; // Use actual video resolution for capture
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      setErrorMessage('Could not prepare image for capture (canvas error).');
      return;
    }

    ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    const dataURL = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImageDataUrl(dataURL);
    setPlacedCrosshairs([]);
    setErrorMessage('');
    setAnalysisResult(null);
    setShowResultsModal(false);
  };

  const handleImageAreaClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!capturedImageDataUrl) return;

    const targetElement = event.currentTarget; // This is the div wrapping the image
    const rect = targetElement.getBoundingClientRect();

    const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / targetElement.offsetWidth));
    const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / targetElement.offsetHeight));

    setPlacedCrosshairs((prev) => {
      const newPointIndex = prev.length + 1;
      return [
        ...prev,
        {
          id: `crosshair-${Date.now()}${Math.random().toString(36).substr(2, 5)}`,
          x,
          y,
          testType: currentTestType,
          pointIndex: newPointIndex
        }
      ];
    });
  };

  const handleSendDataToServer = async () => {
    if (!capturedImageDataUrl) {
      setErrorMessage('No image captured to send.');
      return;
    }
    if (placedCrosshairs.length === 0) {
      setErrorMessage('Please place at least one analysis point on the image.');
      return;
    }

    // Ensure there's at least one WHITE point:
    if (!placedCrosshairs.some((ch) => ch.testType === 'WHITE')) {
      setErrorMessage('You must place at least one WHITE point for color calibration before analyzing.');
      return;
    }

    setErrorMessage('');
    setIsLoadingAnalysis(true);
    setAnalysisResult(null);
    setShowResultsModal(false);

    const formData = new FormData();
    try {
      const photoBlob = await fetch(capturedImageDataUrl).then((res) => res.blob());
      formData.append('photo.jpeg', photoBlob, 'photo.jpeg');
      const crosshairsData = placedCrosshairs.map(({ x, y, testType, pointIndex }) => ({ x, y, testType, pointIndex }));
      formData.append('points.json', new Blob([JSON.stringify(crosshairsData)], { type: 'application/json' }), 'points.json');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/process`, { method: 'POST', body: formData });
      const responseData = await response.json();
      setIsLoadingAnalysis(false);

      if (response.ok) {
        setAnalysisResult(responseData.results as ConcentrationResponse[]);
        setShowResultsModal(true);
      } else {
        setErrorMessage(`Server error: ${responseData.error || response.statusText || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Client-side error during send or parsing response:', error);
      setErrorMessage('Failed to send data or interpret server response. Check network or console.');
      setIsLoadingAnalysis(false);
    }
  };

  const handleRetakeImage = () => {
    setCapturedImageDataUrl(null);
    setPlacedCrosshairs([]);
    setAnalysisResult(null);
    setShowResultsModal(false);
    setErrorMessage('');
    setIsLoadingAnalysis(false);
  };

  const handleClearLastPoint = () => setPlacedCrosshairs((prev) => prev.slice(0, -1));
  const handleClearAllPoints = () => setPlacedCrosshairs([]);

  if (showInfoOverlay) {
    return (
      <div className={`fixed inset-0 ${M3Colors.surfaceContainer} flex items-center justify-center z-50 p-4 sm:p-6`}>
        <div className={`${M3Colors.surface} p-6 sm:p-8 rounded-2xl ${M3Colors.shadow} max-w-md w-full text-center`}>
          <h2 className={`text-2xl sm:text-3xl font-semibold mb-4 ${M3Colors.onSurface}`}>Test Analyzer</h2>
          <p className={`${M3Colors.onSurfaceVariant} mb-8 text-sm sm:text-base`}>
            Allow camera access. Align the test strip using the on-screen guide. After capturing, tap on the image to place points for each test
            area.
          </p>
          <button
            onClick={() => setShowInfoOverlay(false)}
            className={`${M3Colors.primary} ${M3Colors.onPrimary} font-medium py-3 px-8 rounded-full text-base sm:text-lg transition-transform duration-150 ease-in-out hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-300`}
          >
            Start Analysis
          </button>
        </div>
      </div>
    );
  }

  const hasWhitePoint = placedCrosshairs.some((ch) => ch.testType === 'WHITE');

  return (
    <div className={`min-h-screen ${M3Colors.surfaceContainer} p-2 sm:p-4 flex flex-col items-center`}>
      <div className={`max-w-2xl w-full mx-auto ${M3Colors.surface} rounded-3xl ${M3Colors.shadow} p-4 sm:p-6 mt-4 mb-4`}>
        {/* App Bar / Header */}
        <div className="mb-6 text-center">
          <h1 className={`text-xl sm:text-2xl font-medium ${M3Colors.onSurface}`}>Image Analysis</h1>
        </div>
        {errorMessage && (
          <div
            className={`${M3Colors.errorContainer} border-l-4 border-red-500 ${M3Colors.onErrorContainer} px-4 py-3 rounded-lg mb-4 ${M3Colors.shadowMd}`}
            role="alert"
          >
            <p className="font-medium">Error:</p>
            <p className="text-sm">{errorMessage}</p>
          </div>
        )}
        {/* Video/Image Display Area */}
        <div
          className={`aspect-[4/3] ${M3Colors.surfaceContainer} rounded-xl overflow-hidden mb-6 relative border ${M3Colors.outline} ${M3Colors.shadowMd}`}
        >
          {!capturedImageDataUrl ? (
            <>
              <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
              <img
                src={CROSSHAIR_SVG_PATH}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-50"
                style={{
                  maxHeight: '33%', // 1/3 of container height
                  maxWidth: '33%', // 1/3 of container width
                  objectFit: 'contain'
                }}
                alt="Aiming Guide"
              />
            </>
          ) : (
            <div className="w-full h-full relative cursor-crosshair" onClick={handleImageAreaClick}>
              <img src={capturedImageDataUrl} className="w-full h-full object-cover" alt="Captured Test Strip" />
              {placedCrosshairs.map((ch) => (
                <div
                  key={ch.id}
                  className="absolute flex flex-col items-center justify-center"
                  style={{
                    height: '33%',
                    width: '33%',
                    left: `${ch.x * 100}%`,
                    top: `${ch.y * 100}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <img
                    src={CROSSHAIR_SVG_PATH}
                    alt={`Point for ${ch.testType}`}
                    className="pointer-events-none opacity-60"
                    style={{ height: '100%', width: '100%', objectFit: 'contain', filter: `drop-shadow(0 1px 2px rgba(0,0,0,0.3))` }}
                  />
                  <div
                    className={`absolute font-bold text-sm ${TestTypeColorValues[ch.testType].text} ${TestTypeColorValues[ch.testType].bg} rounded-full px-1`}
                    style={{ pointerEvents: 'none' }}
                  >
                    {ch.pointIndex}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Controls Area */}
        {!capturedImageDataUrl ? (
          <button
            onClick={handleCaptureImage}
            className={`w-full ${M3Colors.primary} ${M3Colors.onPrimary} font-semibold py-3.5 px-4 rounded-full ${M3Colors.shadowMd} transition-transform duration-150 ease-in-out hover:scale-[1.03] focus:outline-none focus:ring-4 focus:ring-indigo-300 text-lg`} // Rounded-full for FAB-like feel
          >
            Capture Image
          </button>
        ) : (
          <>
            <div className="mb-5">
              <label htmlFor="test-type-select" className={`block text-sm font-medium ${M3Colors.onSurfaceVariant} mb-1.5`}>
                Select Test Type:
              </label>
              <select
                id="test-type-select"
                value={currentTestType}
                onChange={(e) => setCurrentTestType(e.target.value as TestType)}
                className={`w-full ${TestTypeColorValues[currentTestType].bg} ${TestTypeColorValues[currentTestType].text} p-3.5 border ${M3Colors.outline} rounded-lg ${M3Colors.shadowMd} focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base`}
              >
                <option value="ALB">ALB</option>
                <option value="ALP">ALP</option>
                <option value="CREATININE">Creatinine</option>
                <option value="WHITE">White Reference Point</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <button
                onClick={handleClearLastPoint}
                disabled={placedCrosshairs.length === 0}
                className={`bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-3 px-4 rounded-full ${M3Colors.shadowMd} transition disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-300`}
              >
                Clear Last ({placedCrosshairs.length})
              </button>
              <button
                onClick={handleClearAllPoints}
                disabled={placedCrosshairs.length === 0}
                className={`bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-3 px-4 rounded-full ${M3Colors.shadowMd} transition disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-300`}
              >
                Clear All
              </button>
            </div>

            {/* Main Action Buttons - M3 emphasizes prominent actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button // Secondary action: Outlined or Tonal button style
                onClick={handleRetakeImage}
                className={`flex-1 ${M3Colors.secondaryContainer} ${M3Colors.onSecondaryContainer} font-medium py-3 px-4 rounded-full ${M3Colors.shadowMd} transition hover:bg-indigo-200`}
              >
                Retake Image
              </button>
              <button // Primary action: Filled button style
                onClick={handleSendDataToServer}
                disabled={placedCrosshairs.length === 0 || !hasWhitePoint || isLoadingAnalysis}
                className={`flex-1 ${M3Colors.primary} ${M3Colors.onPrimary} font-semibold py-3 px-4 rounded-full ${M3Colors.shadowMd} transition hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400`}
              >
                {isLoadingAnalysis ? 'Analyzing...' : `Analyze ${placedCrosshairs.length > 0 ? `(${placedCrosshairs.length} Points)` : ''}`}
              </button>
            </div>
          </>
        )}
        {isLoadingAnalysis &&
          capturedImageDataUrl && ( // Show specific loading message when "Analyze" button was pressed
            <div
              className={`mt-6 p-4 rounded-xl ${M3Colors.secondaryContainer} ${M3Colors.onSecondaryContainer} ${M3Colors.shadowMd} text-center`}
            >
              <p className="text-lg font-mono animate-pulse">Analyzing, please wait...</p>
            </div>
          )}
      </div>
      {showResultsModal && analysisResult && <ResultsModal results={analysisResult} onClose={() => setShowResultsModal(false)} />}
    </div>
  );
}
