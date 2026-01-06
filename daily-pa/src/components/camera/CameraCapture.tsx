'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, X, RotateCcw, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';

interface CameraCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageData: string) => void;
  title?: string;
}

export function CameraCapture({ isOpen, onClose, onCapture, title = 'Take Photo' }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  const startCamera = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError('Unable to access camera. Please check permissions.');
      console.error('Camera error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const switchCamera = useCallback(() => {
    stopCamera();
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, [stopCamera]);

  const takePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageData);
        stopCamera();
      }
    }
  }, [stopCamera]);

  const retake = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  const confirmPhoto = useCallback(() => {
    if (capturedImage) {
      onCapture(capturedImage);
      handleClose();
    }
  }, [capturedImage, onCapture]);

  const handleClose = useCallback(() => {
    stopCamera();
    setCapturedImage(null);
    setError(null);
    onClose();
  }, [stopCamera, onClose]);

  // Start camera when modal opens
  useEffect(() => {
    if (isOpen && !stream && !capturedImage) {
      startCamera();
    }
    return () => {
      if (!isOpen) {
        stopCamera();
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <GlassCard className="w-full max-w-lg">
        <GlassCardHeader className="flex flex-row items-center justify-between">
          <GlassCardTitle>{title}</GlassCardTitle>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </GlassCardHeader>
        <GlassCardContent className="space-y-4">
          {error ? (
            <div className="text-center py-8">
              <Camera className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={startCamera}>Try Again</Button>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : capturedImage ? (
            <>
              <div className="relative rounded-xl overflow-hidden bg-black">
                <img src={capturedImage} alt="Captured" className="w-full" />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={retake}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Retake
                </Button>
                <Button className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500" onClick={confirmPhoto}>
                  <Check className="w-4 h-4 mr-2" />
                  Use Photo
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  onLoadedMetadata={() => videoRef.current?.play()}
                />
              </div>
              <canvas ref={canvasRef} className="hidden" />
              <div className="flex gap-3 justify-center">
                <Button variant="outline" size="icon" onClick={switchCamera} className="rounded-full">
                  <RotateCcw className="w-5 h-5" />
                </Button>
                <Button
                  size="lg"
                  onClick={takePhoto}
                  className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
                >
                  <Camera className="w-6 h-6" />
                </Button>
                <div className="w-10" /> {/* Spacer for alignment */}
              </div>
            </>
          )}
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}
