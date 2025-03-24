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
  const [algorithm, setAlgorithm] = useState('acr')
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setError('Camera access denied');
        console.log("Camera " + err)
      }
    };

    initCamera();
  }, []);

  const handleCapture = async () => {
    const canvas = document.createElement('canvas');
    const video = videoRef.current;

    if (!video) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      if (!blob) return;

      const formData = new FormData();
      formData.append('photo.jpg', blob, 'photo.jpg');

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/process/${algorithm}`, {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();
        setConcentration(data.concentration);
      } catch (err) {
        setError('Failed to calculate concentration');
        console.log("Concentration " + err)
      }
    }, 'image/jpeg');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-4">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">Concentration</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden mb-4">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
        </div>

        <div className="mb-4">
          <select
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value)}
            className="w-full text-black p-2 border rounded"
          >
            <option value="acr">ACR</option>
            <option value="grayscale">GrayScale</option>
            {/* <option value="sha256">SHA-256</option> */}
          </select>
        </div>

        <button
          onClick={handleCapture}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Capture & Calculate
        </button>

        {concentration && (
          <div className="mt-4 p-4 bg-black-50 rounded">
            <p className="text-sm font-mono text-black break-all">{concentration}</p>
          </div>
        )}
      </div>
    </div>
  );
}
