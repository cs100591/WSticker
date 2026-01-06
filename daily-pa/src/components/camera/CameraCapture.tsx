'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, X, RotateCcw, Check, Loader2, ImageIcon } from 'lucide-react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [cameraReady, setCameraReady] = useState(false);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraReady(false);
  }, [stream]);

  const startCamera = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setCameraReady(false);
    
    // Stop existing stream first
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode, 
          width: { ideal: 1280 }, 
          height: { ideal: 720 } 
        },
        audio: false,
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().then(() => {
            setCameraReady(true);
            setIsLoading(false);
          }).catch(err => {
            console.error('Video play error:', err);
            setError('Failed to start video preview');
            setIsLoading(false);
          });
        };
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Unable to access camera. Please check permissions or use file upload.');
      setIsLoading(false);
    }
  }, [facingMode, stream]);

  const switchCamera = useCallback(async () => {
    stopCamera();
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, [stopCamera]);

  // Restart camera when facing mode changes
  useEffect(() => {
    if (isOpen && !capturedImage && !error) {
      startCamera();
    }
  }, [facingMode, isOpen]);

  const takePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current && cameraReady) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageData);
        stopCamera();
      }
    }
  }, [stopCamera, cameraReady]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target?.result as string;
        setCapturedImage(imageData);
        stopCamera();
      };
      reader.readAsDataURL(file);
    }
  }, [stopCamera]);

  const retake = useCallback(() => {
    setCapturedImage(null);
    setError(null);
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
    if (isOpen && !capturedImage) {
      startCamera();
    }
    return () => {
      if (!isOpen) {
        stopCamera();
      }
    };
  }, [isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

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
          {capturedImage ? (
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
          ) : error ? (
            <div className="text-center py-8">
              <Camera className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-red-500 mb-4">{error}</p>
              <div className="flex gap-3 justify-center">
                <Button onClick={startCamera} variant="outline">
                  Try Again
                </Button>
                <Button onClick={() => fileInputRef.current?.click()}>
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Upload Photo
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          ) : (
            <>
              <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  </div>
                )}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {!cameraReady && !isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black text-white">
                    <p>Starting camera...</p>
                  </div>
                )}
              </div>
              <canvas ref={canvasRef} className="hidden" />
              <div className="flex gap-3 justify-center items-center">
                <Button variant="outline" size="icon" onClick={switchCamera} className="rounded-full">
                  <RotateCcw className="w-5 h-5" />
                </Button>
                <Button
                  size="lg"
                  onClick={takePhoto}
                  disabled={!cameraReady}
                  className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 disabled:opacity-50"
                >
                  <Camera className="w-6 h-6" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => fileInputRef.current?.click()} 
                  className="rounded-full"
                >
                  <ImageIcon className="w-5 h-5" />
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileUpload}
                className="hidden"
              />
            </>
          )}
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}
