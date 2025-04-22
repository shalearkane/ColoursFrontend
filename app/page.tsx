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

  useEffect(() => {
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
  }, []);

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

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-4">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">Concentration</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden mb-4" style={{ position: "relative" }}>
          {capturedImage ? (
            <img src={capturedImage} className="w-full h-full object-cover" alt="Captured preview" />
          ) : (
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          )}

          <img src="crosshair2.svg" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", pointerEvents: "none", height: "40%", width: "40%" }} alt="Crosshair" />

        </div>

        <div className="mb-4">
          <select
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value)}
            className="w-full text-black p-2 border rounded"
          >
            <option value="alb">ALB</option>
            <option value="alp">ALP</option>
            <option value="creatinine">Creatinine</option>
          </select>
        </div>

        {!capturedImage ? (
          <button
            onClick={handleCapture}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Capture
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleRetake}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
            >
              Retake
            </button>
            <button
              onClick={handleSendToServer}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Calculate
            </button>
          </div>
        )}

        {concentration && (
          <div className="mt-4 p-4 bg-black-50 rounded">
            <p className="text-sm font-mono text-black break-all">{concentration}</p>
          </div>
        )}
      </div>
    </div>
  );
}
