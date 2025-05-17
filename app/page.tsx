"use client"
import { useState, useRef, useEffect } from 'react';

const videoConstraints = {
  video: {
    facingMode: "environment"
    // You might want to add ideal width/height constraints here if needed
    // width: { ideal: 1280 },
    // height: { ideal: 720 }
  }
};

interface PlacedCrosshair {
  id: string;
  x: number; // Relative X (0 to 1)
  y: number; // Relative Y (0 to 1)
  testType: string;
}

const CROSSHAIR_SVG_PATH = "/crosshair2.svg"; // Ensure this is in your /public folder

export default function CameraApp() {
  const videoRef = useRef<HTMLVideoElement>(null);
  // const imageRef = useRef<HTMLImageElement>(null); // imageRef not strictly needed with current approach
  const [currentTestType, setCurrentTestType] = useState('ALB');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [capturedImageDataUrl, setCapturedImageDataUrl] = useState<string | null>(null);
  const [showInfoOverlay, setShowInfoOverlay] = useState(true);
  const [placedCrosshairs, setPlacedCrosshairs] = useState<PlacedCrosshair[]>([]);
  const [analysisResult, setAnalysisResult] = useState<string>('');

  useEffect(() => {
    if (showInfoOverlay || capturedImageDataUrl) {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
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
        console.error("Camera initialization error:", err);
        setErrorMessage('Camera access denied or unavailable. Please check permissions.');
      }
    };

    initCamera();

    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, [showInfoOverlay, capturedImageDataUrl]);

  const handleCaptureImage = () => {
    const video = videoRef.current;
    if (!video || video.readyState < video.HAVE_METADATA || video.videoWidth === 0) {
      setErrorMessage("Video stream not ready. Please wait or try again.");
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth; // Use actual video resolution for capture
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      setErrorMessage("Could not prepare image for capture (canvas error).");
      return;
    }

    ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    const dataURL = canvas.toDataURL('image/jpeg', 0.9); // Quality 0.9
    setCapturedImageDataUrl(dataURL);
    setPlacedCrosshairs([]);
    setErrorMessage('');
    setAnalysisResult('');
  };

  const handleImageAreaClick = (event: React.MouseEvent<HTMLDivElement>) => { // Changed to HTMLDivElement
    if (!capturedImageDataUrl) return;

    const targetElement = event.currentTarget; // This is the div wrapping the image
    const rect = targetElement.getBoundingClientRect();

    const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / targetElement.offsetWidth));
    const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / targetElement.offsetHeight));

    setPlacedCrosshairs(prev => [
      ...prev,
      { id: `crosshair-${Date.now()}${Math.random().toString(36).substr(2, 5)}`, x, y, testType: currentTestType }
    ]);
  };

  const handleSendDataToServer = async () => {
    if (!capturedImageDataUrl) {
      setErrorMessage("No image captured to send.");
      return;
    }
    if (placedCrosshairs.length === 0) {
      setErrorMessage("Please place at least one analysis point on the image.");
      return;
    }

    setErrorMessage('');
    setAnalysisResult('Analyzing...');

    const formData = new FormData();
    try {
      const photoBlob = await fetch(capturedImageDataUrl).then(res => res.blob());
      formData.append('photo.jpeg', photoBlob, 'photo.jpeg');

      const crosshairsData = placedCrosshairs.map(({ x, y, testType }) => ({ x, y, testType }));
      formData.append('points.json', new Blob([JSON.stringify(crosshairsData)], { type: 'application/json' }), 'points.json');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/process`, {
        method: 'POST',
        body: formData,
      });
      const responseData = await response.json();

      if (response.ok) {
        setAnalysisResult(responseData.concentration || 'Analysis complete. No specific result value.');
      } else {
        setErrorMessage(`Server error: ${responseData.error || response.statusText || 'Unknown error'}`);
        setAnalysisResult('');
      }
    } catch (error) {
      console.error("Client-side error during send or parsing response:", error);
      setErrorMessage('Failed to send data or interpret server response. Check network or console.');
      setAnalysisResult('');
    }
  };

  const handleRetakeImage = () => {
    setCapturedImageDataUrl(null);
    setPlacedCrosshairs([]);
    setAnalysisResult('');
    setErrorMessage('');
  };

  const handleClearLastPoint = () => setPlacedCrosshairs(prev => prev.slice(0, -1));
  const handleClearAllPoints = () => setPlacedCrosshairs([]);

  if (showInfoOverlay) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-800 via-gray-900 to-black flex items-center justify-center z-50 p-6">
        <div className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-lg w-full">
          <h2 className="text-3xl font-bold mb-4 text-gray-800">Test Analyzer</h2>
          <p className="text-gray-600 mb-8">
            Allow camera access. Align the test strip using the on-screen guide.
            After capturing, tap on the image to place points for each test area.
          </p>
          <button
            onClick={() => setShowInfoOverlay(false)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition duration-150 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            Start Analysis
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex flex-col items-center justify-center">
      <div className="max-w-2xl w-full mx-auto bg-white rounded-xl shadow-2xl p-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800 text-center">
          Image Analysis
        </h1>

        {errorMessage && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-md mb-4 shadow" role="alert">
            <p><span className="font-semibold">Error:</span> {errorMessage}</p>
          </div>
        )}

        <div className="aspect-[4/3] bg-gray-300 rounded-lg overflow-hidden mb-6 relative border-2 border-gray-200 shadow-inner">
          {!capturedImageDataUrl ? (
            <>
              <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
              <img
                src={CROSSHAIR_SVG_PATH}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-50"
                style={{
                  maxHeight: '33%', // 1/4th of container height
                  maxWidth: '33%',  // 1/4th of container width
                  objectFit: 'contain', // Ensures it fits and maintains aspect ratio
                }}
                alt="Aiming Guide"
              />
            </>
          ) : (
            <div className="w-full h-full relative cursor-crosshair" onClick={handleImageAreaClick}>
              <img
                src={capturedImageDataUrl}
                className="w-full h-full object-cover" // object-cover ensures the image fills the space, cropping if necessary
                alt="Captured Test Strip"
              />
              {placedCrosshairs.map(ch => (
                <img
                  key={ch.id}
                  src={CROSSHAIR_SVG_PATH}
                  alt={`Point for ${ch.testType}`}
                  className="absolute pointer-events-none opacity-80"
                  style={{
                    maxHeight: '33%', // Consistent sizing with the reference
                    maxWidth: '33%',
                    objectFit: 'contain',
                    left: `${ch.x * 100}%`,
                    top: `${ch.y * 100}%`,
                    transform: 'translate(-50%, -50%)',
                    filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.6))' // Slightly stronger shadow
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {!capturedImageDataUrl ? (
          <button
            onClick={handleCaptureImage}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md transition duration-150 ease-in-out transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 text-lg"
          >
            Capture Image
          </button>
        ) : (
          <>
            <div className="mb-4">
              <label htmlFor="test-type-select" className="block text-sm font-medium text-gray-700 mb-1">
                Select Test Type for Next Point:
              </label>
              <select
                id="test-type-select"
                value={currentTestType}
                onChange={(e) => setCurrentTestType(e.target.value)}
                className="w-full text-black p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              >
                <option value="ALB">ALB</option>
                <option value="ALP">ALP</option>
                <option value="CREATININE">Creatinine</option>
                <option value="WHITE">White Reference Point</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={handleClearLastPoint}
                disabled={placedCrosshairs.length === 0}
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2.5 px-4 rounded-lg shadow transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Clear Last ({placedCrosshairs.length})
              </button>
              <button
                onClick={handleClearAllPoints}
                disabled={placedCrosshairs.length === 0}
                className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Clear All
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleRetakeImage}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg shadow transition"
              >
                Retake Image
              </button>
              <button
                onClick={handleSendDataToServer}
                disabled={placedCrosshairs.length === 0}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg shadow disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Analyze {placedCrosshairs.length > 0 ? `(${placedCrosshairs.length} Points)` : ''}
              </button>
            </div>
          </>
        )}

        {analysisResult && (
          <div className={`mt-6 p-4 rounded-lg border shadow-sm ${analysisResult === 'Analyzing...' ? 'bg-yellow-50 border-yellow-300 text-yellow-800' : 'bg-green-50 border-green-300 text-green-800'}`}>
            <p className="text-xs font-medium uppercase tracking-wider mb-1">
              {analysisResult === 'Analyzing...' ? 'Status' : 'Analysis Result:'}
            </p>
            <p className="text-base font-mono break-words">
              {analysisResult}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}