import React, { useRef, useState, useEffect } from 'react';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  facingMode?: 'environment' | 'user';
}

export default function CameraCapture({ onCapture, facingMode = 'environment' }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const start = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode } });
        if (!mounted) return;
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play().catch(() => {});
        }
      } catch (err) {
        setError('Camera not available');
      }
    };
    start();
    return () => {
      mounted = false;
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [facingMode]);

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `capture-${Date.now()}.jpg`, { type: blob.type });
      onCapture(file);
    }, 'image/jpeg', 0.9);
  };

  return (
    <div className="space-y-2">
      {error ? (
        <div className="text-sm text-red-500">{error}</div>
      ) : (
        <div className="w-full bg-gray-900 rounded overflow-hidden">
          <video ref={videoRef} className="w-full h-64 object-cover" playsInline />
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
      <div className="flex gap-2">
        <button type="button" onClick={handleCapture} className="px-4 py-2 bg-coin-600 hover:bg-coin-700 text-white rounded">
          Capture
        </button>
      </div>
    </div>
  );
}
