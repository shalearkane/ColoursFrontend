"use client"
import { useState, useRef, useEffect } from 'react';

const constraints = {
  video: {
    facingMode: "environment"
  }
};

interface PlacedCrosshair {
  id: string;
  x: number; // Relative X (0 to 1)
  y: number; // Relative Y (0 to 1)
  testType: string;
}

const CROSSHAIR_SVG_PATH = "crosshair2.svg"; // Define once, reuse

export default function CameraApp() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [concentration, setConcentration] = useState<string>('');
  const [algorithm, setAlgorithm] = useState('alb');
  const [error, setError] = useState<string>('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState(true);
  const [placedCrosshairs, setPlacedCrosshairs] = useState<PlacedCrosshair[]>([]);

  useEffect(() => {
    if (showOverlay) return;

    const initCamera = async () => {
      try {
        if (videoRef.current?.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
        }
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(err => console.error("Video play failed:", err));
        }
      } catch (err) {
        setError('Camera access denied. Please check browser permissions.');
        console.error("Camera initialization error:", err);
      }
    };

    if (!capturedImage) {
      initCamera();
    }

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [showOverlay, capturedImage]);

  const handleCapture = () => {
    const canvas = document.createElement('canvas');
    const video = videoRef.current;

    if (!video || video.readyState < video.HAVE_METADATA) {
      setError("Video not ready yet.");
      return;
    }

    if (videoRef.current) {
      videoRef.current.pause();
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setError("Could not get canvas context.");
      return;
    }

    ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    const dataURL = canvas.toDataURL('image/jpeg');

    setCapturedImage(dataURL);
    setPlacedCrosshairs([]); // Reset crosshairs for a new image
    setError('');
    setConcentration('');
  };

  const handleImageClick = (event: React.MouseEvent<HTMLImageElement>) => {
    if (!capturedImage) return;

    const imageElement = event.currentTarget;
    const rect = imageElement.getBoundingClientRect();
    // Calculate click coordinates relative to the image's displayed size
    const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / imageElement.offsetWidth));
    const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / imageElement.offsetHeight));


    setPlacedCrosshairs(prev => [
      ...prev,
      { id: Date.now().toString(), x, y, testType: algorithm }
    ]);
  };

  const handleSendToServer = async () => {
    if (!capturedImage) {
      setError("No image captured to send.");
      return;
    }
    if (placedCrosshairs.length === 0) {
      setError("Please place at least one crosshair/point on the image.");
      return;
    }

    const formData = new FormData();

    const photoBlob = await fetch(capturedImage).then(res => res.blob());
    formData.append('photo.jpg', photoBlob, 'photo.jpg');

    const crosshairsData = placedCrosshairs.map(p => ({ x: p.x, y: p.y, testType: p.testType }));
    const crosshairsJson = JSON.stringify(crosshairsData);
    formData.append('crosshairs.json', new Blob([crosshairsJson], { type: 'application/json' }), 'crosshairs.json');

    // The `test=${algorithm}` query parameter might be redundant if all test info is in crosshairs.json
    // Or, it could indicate a primary test type if your server needs it.
    // For simplicity, let's assume the server primarily uses crosshairs.json
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/process`, { // Removed ?test=${algorithm} assuming server uses JSON
      method: 'POST',
      body: formData,
    }).then((response) => {
      if (response.ok) {
        response.json().then((data) => {
          setConcentration(data.concentration || 'Processing complete. No concentration value returned.');
        }).catch(parseErr => {
          setError('Successfully sent, but failed to parse server response.');
          console.error("Response parsing error:", parseErr);
        });
      } else {
        response.json().then((data) => {
          setError(`Server error: ${data.error || 'Unknown error from server'}`);
        }).catch(parseErr => {
          setError('Failed to send to server and could not parse error response.');
          console.error("Error response parsing error:", parseErr);
        });
      }
    }).catch((error) => {
      setError('Network error or server unavailable. Please try again.');
      console.error("Send to server error:", error);
    });
  };

  const handleRetake = async () => {
    setCapturedImage(null);
    setPlacedCrosshairs([]);
    setConcentration('');
    setError('');
    // useEffect will re-initialize camera
  };

  const clearLastPoint = () => {
    setPlacedCrosshairs(prev => prev.slice(0, -1));
  };

  const clearAllPoints = () => {
    setPlacedCrosshairs([]);
  };


  if (showOverlay) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-700 via-gray-900 to-black bg-opacity-95 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out">
        <div className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-md w-full transform transition-all duration-300 ease-in-out scale-100">
          <div className="mb-5 text-5xl text-blue-600">
            {/* Optional: Icon or Logo */}
          </div>
          <h2 className="text-2xl font-semibold mb-3 text-gray-800">
            Ready to Analyze?
          </h2>
          <p className="text-sm text-gray-600 mb-8 px-4">
            Please allow camera access. Position the test strip within the reference crosshair on screen.
            After capturing, you will place points for each test area.
          </p>
          <button
            onClick={() => setShowOverlay(false)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg w-full transition duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            Get Started
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex flex-col items-center justify-center">
      <div className="max-w-lg w-full mx-auto bg-white rounded-xl shadow-xl p-6">
        <h1 className="text-2xl font-semibold mb-6 text-gray-800 text-center">
          Multi-Test Analyzer
        </h1>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-md mb-4 text-sm shadow-sm" role="alert">
            <p><span className="font-bold">Error:</span> {error}</p>
          </div>
        )}

        <div className="aspect-[4/3] bg-gray-200 rounded-lg overflow-hidden mb-5 relative border border-gray-300 shadow-inner">
          {!capturedImage ? (
            <>
              <video ref={videoRef} disablePictureInPicture autoPlay playsInline muted className="w-full h-full object-cover block" />
              {/* Reference crosshair for aiming during live preview */}
              <img src={CROSSHAIR_SVG_PATH} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none h-1/4 w-1/4 opacity-50" alt="Reference Crosshair" />
            </>
          ) : (
            <div className="w-full h-full relative">
              <img
                ref={imageRef}
                src={capturedImage}
                className="w-full h-full object-cover block"
                alt="Captured Preview"
                onClick={handleImageClick}
                style={{ cursor: 'crosshair' }}
              />
              {/* Placed crosshairs by user */}
              {placedCrosshairs.map(ch => (
                <img
                  key={ch.id}
                  src={CROSSHAIR_SVG_PATH}
                  alt={`Crosshair for ${ch.testType}`}
                  className="absolute pointer-events-none opacity-75 h-10 w-10" // Example fixed size
                  style={{
                    left: `calc(${ch.x * 100}% - 20px)`, // Adjust offset to be half of width (20px for w-10 which is 2.5rem ~ 40px)
                    top: `calc(${ch.y * 100}% - 20px)`,  // Adjust offset to be half of height
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Controls visible only when an image is captured, for placing points */}
        {capturedImage && (
          <div className="mb-5">
            <label htmlFor="algorithm-select" className="block text-sm font-medium text-gray-700 mb-1">
              Select Test Type for Next Point:
            </label>
            <select
              id="algorithm-select"
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
              className="w-full text-black p-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition duration-150 ease-in-out"
            >
              <option value="alb">ALB</option>
              <option value="alp">ALP</option>
              <option value="creatinine">Creatinine</option>
              <option value="white">White Reference Point</option> {/* "white" is now a regular testType for a point */}
            </select>
          </div>
        )}


        {!capturedImage ? (
          <button
            onClick={handleCapture}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow transition duration-200 ease-in-out transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Capture Image
          </button>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <button
                onClick={clearLastPoint}
                disabled={placedCrosshairs.length === 0}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2.5 px-4 rounded-lg shadow transition duration-200 ease-in-out transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 disabled:opacity-50"
              >
                Clear Last Point ({placedCrosshairs.length})
              </button>
              <button
                onClick={clearAllPoints}
                disabled={placedCrosshairs.length === 0}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow transition duration-200 ease-in-out transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50"
              >
                Clear All Points
              </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleRetake}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow transition duration-200 ease-in-out transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Retake Image
              </button>
              <button
                onClick={handleSendToServer}
                disabled={placedCrosshairs.length === 0}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow transition duration-200 ease-in-out transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                Calculate ({placedCrosshairs.length} points)
              </button>
            </div>
          </>
        )}

        {concentration && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              Server Response:
            </p>
            <p className="text-base font-mono text-gray-900 break-all">
              {concentration}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}