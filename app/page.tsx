"use client"
import { useState, useRef, useEffect } from 'react';

const constraints = {
  video: {
    facingMode: "environment"
  }
};

export default function CameraApp() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [concentration, setConcentration] = useState<string>('');
  const [algorithm, setAlgorithm] = useState('alb');
  const [error, setError] = useState<string>('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState(true);

  useEffect(() => {
    if (showOverlay) return;

    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setError('Camera access denied');
        console.log("Camera " + err);
      }
    };

    initCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [showOverlay]);

  const handleCapture = () => {
    const canvas = document.createElement('canvas');
    const video = videoRef.current;

    if (videoRef.current) {
      videoRef.current.pause();
    }

    if (!video) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const dataURL = canvas.toDataURL('image/jpeg');
    setCapturedImage(dataURL);
  };

  const handleSendToServer = async () => {
    if (!capturedImage) return;

    // Convert data URL to Blob
    const blob = await fetch(capturedImage).then(res => res.blob());

    const formData = new FormData();
    formData.append('photo.jpg', blob, 'photo.jpg');

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/process?test=${algorithm}`, {
      method: 'POST',
      body: formData,
    }).then((response) => {
      if (response.ok) {
        response.json().then((data) => {
          setConcentration(data.concentration);
        });
      } else {
        response.json().then((data) => {
          setError('Failed to calculate concentration as ' + data.error);
        })
      }
    }).catch((error) => {
      setError('Failed to calculate concentration');
      console.log("Concentration " + error);
    });

  };

  const handleRetake = async () => {
    setCapturedImage(null);
    setConcentration('');
    setError('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError('Camera access denied');
      console.log("Camera " + err);
    }
  };

  if (showOverlay) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-700 via-gray-900 to-black bg-opacity-95 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out">
        <div className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-md w-full transform transition-all duration-300 ease-in-out scale-100"> {/* Added scale for potential future animation */}

          <div className="mb-5 text-5xl text-blue-600">
          </div>

          <h2 className="text-2xl font-semibold mb-3 text-gray-800">
            Ready to Calculate Concentration?
          </h2>

          <p className="text-sm text-gray-600 mb-8 px-4">
            Please allow camera access when prompted. Position the test strip within the crosshairs for accurate results.
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
    <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto bg-white rounded-xl shadow-xl p-6"> {/* Increased padding, rounding, shadow */}
        <h1 className="text-2xl font-semibold mb-6 text-gray-800 text-center">
          Colours
        </h1>

        {/* Error Message - Slightly refined */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-md mb-4 text-sm shadow-sm" role="alert"> {/* Left border, rounded-md */}
            <p><span className="font-bold">Error:</span> {error}</p>
          </div>
        )}

        {/* Video/Image Display Area - Added subtle border */}
        <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden mb-5 relative border border-gray-300 shadow-inner"> {/* Slightly more margin-bottom, subtle inner shadow */}
          {capturedImage ? (
            <img src={capturedImage} className="w-full h-full object-cover block" alt="Captured Preview" />
          ) : (
            // Ensure video plays inline and is muted for autoplay compatibility
            <video ref={videoRef} autoPlay muted className="w-full h-full object-cover block" />
          )}
          {/* Crosshair only when video is showing */}
          {!capturedImage && (
            <img src="crosshair2.svg" className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none h-2/5 w-2/5 opacity-60" alt="Crosshair" />
          )}
        </div>

        {/* Controls Area - Improved select styling */}
        <div className="mb-5"> {/* Adjusted margin */}
          <label htmlFor="algorithm-select" className="block text-sm font-medium text-gray-700 mb-1">
            Select Test Type:
          </label>
          <select
            id="algorithm-select"
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value)}
            // Modern select styling: better border, focus ring, padding, rounding
            className="w-full text-black p-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition duration-150 ease-in-out"
            disabled={!!capturedImage} // Disable when image is captured
          >
            <option value="alb">ALB</option>
            <option value="alp">ALP</option>
            <option value="creatinine">Creatinine</option>
          </select>
        </div>

        {/* Action Buttons - Styling consistent with overlay button */}
        {!capturedImage ? (
          <button
            onClick={handleCapture}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow transition duration-200 ease-in-out transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Capture Image
          </button>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleRetake}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow transition duration-200 ease-in-out transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Retake
            </button>
            <button
              onClick={handleSendToServer}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow transition duration-200 ease-in-out transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Calculate
            </button>
          </div>
        )}

        {/* Concentration Result Display - Cleaner look */}
        {concentration && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm"> {/* Increased margin-top, padding, rounding */}
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1"> {/* Label styling */}
              Calculated Result:
            </p>
            <p className="text-base font-mono text-gray-900 break-all"> {/* Result styling */}
              {concentration}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
