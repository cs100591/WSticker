'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, X, RotateCcw, Check, Loader2, ImageIcon, DollarSign, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { useExpenses } from '@/lib/hooks/useExpenses';
import { cn } from '@/lib/utils';
import type { ExpenseCategory } from '@/types/expense';

interface ReceiptScannerProps {
  isOpen: boolean;
  onClose: () => void;
}

const categories: { value: ExpenseCategory; label: string; emoji: string }[] = [
  { value: 'food', label: 'Food', emoji: '🍔' },
  { value: 'transport', label: 'Transport', emoji: '🚗' },
  { value: 'shopping', label: 'Shopping', emoji: '🛍️' },
  { value: 'entertainment', label: 'Entertainment', emoji: '🎬' },
  { value: 'bills', label: 'Bills', emoji: '📄' },
  { value: 'health', label: 'Health', emoji: '💊' },
  { value: 'education', label: 'Education', emoji: '📚' },
  { value: 'other', label: 'Other', emoji: '📦' },
];

export function ReceiptScanner({ isOpen, onClose }: ReceiptScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [cameraReady, setCameraReady] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [quickDescription, setQuickDescription] = useState('');

  // Form state
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('food');
  const [description, setDescription] = useState('');

  const { createExpense } = useExpenses();

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
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
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
      setError('Unable to access camera. Please use file upload.');
      setIsLoading(false);
    }
  }, [facingMode, stream]);

  const switchCamera = useCallback(async () => {
    stopCamera();
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, [stopCamera]);

  useEffect(() => {
    if (isOpen && !capturedImage && !error && !showForm) {
      startCamera();
    }
  }, [facingMode, isOpen]);

  // AI parse description
  const parseDescription = async (desc: string) => {
    if (!desc.trim()) return;
    
    setIsParsing(true);
    try {
      const response = await fetch('/api/voice/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: desc }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.type === 'create_expense' && result.data) {
          if (result.data.amount) setAmount(result.data.amount.toString());
          if (result.data.category) setCategory(result.data.category as ExpenseCategory);
          if (result.data.description) setDescription(result.data.description);
        }
      }
    } catch (err) {
      console.error('Parse error:', err);
    } finally {
      setIsParsing(false);
    }
  };

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
        setShowForm(true);
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
        setShowForm(true);
      };
      reader.readAsDataURL(file);
    }
  }, [stopCamera]);

  const retake = useCallback(() => {
    setCapturedImage(null);
    setShowForm(false);
    setError(null);
    setAmount('');
    setDescription('');
    setQuickDescription('');
    startCamera();
  }, [startCamera]);

  const handleSubmit = async () => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setIsCreating(true);
    try {
      await createExpense({
        amount: amountNum,
        category,
        description: description || 'Receipt scan',
        expenseDate: new Date().toISOString().split('T')[0] as string,
      });
      setSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      setError('Failed to save expense');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = useCallback(() => {
    stopCamera();
    setCapturedImage(null);
    setShowForm(false);
    setError(null);
    setSuccess(false);
    setAmount('');
    setDescription('');
    setQuickDescription('');
    setCategory('food');
    onClose();
  }, [stopCamera, onClose]);

  useEffect(() => {
    if (isOpen && !capturedImage && !showForm) {
      startCamera();
    }
    return () => {
      if (!isOpen) {
        stopCamera();
      }
    };
  }, [isOpen]);

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
      <GlassCard className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <GlassCardHeader className="flex flex-row items-center justify-between">
          <GlassCardTitle>Scan Receipt</GlassCardTitle>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </GlassCardHeader>
        <GlassCardContent className="space-y-4">
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-green-600 font-medium">Expense saved!</p>
            </div>
          ) : showForm ? (
            <>
              {/* Show captured image */}
              {capturedImage && (
                <div className="relative rounded-xl overflow-hidden bg-black">
                  <img src={capturedImage} alt="Receipt" className="w-full max-h-40 object-contain" />
                </div>
              )}

              {/* AI Quick Parse */}
              <div className="p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-blue-700">AI Auto-fill</span>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Describe: 'lunch $15' or '午饭50块'"
                    value={quickDescription}
                    onChange={(e) => setQuickDescription(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && parseDescription(quickDescription)}
                    className="flex-1 h-10 rounded-lg text-sm"
                  />
                  <Button
                    size="sm"
                    onClick={() => parseDescription(quickDescription)}
                    disabled={isParsing || !quickDescription.trim()}
                    className="h-10 px-3 rounded-lg bg-blue-500"
                  >
                    {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Parse'}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Type what you see on the receipt, AI will fill the form
                </p>
              </div>

              {/* Expense form */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Amount *</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="h-12 pl-10 rounded-xl text-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Category</label>
                  <div className="grid grid-cols-4 gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat.value}
                        onClick={() => setCategory(cat.value)}
                        className={cn(
                          'p-2 rounded-xl text-center transition-all',
                          category === cat.value
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 hover:bg-gray-200'
                        )}
                      >
                        <span className="text-xl">{cat.emoji}</span>
                        <p className="text-xs mt-1">{cat.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
                  <Input
                    placeholder="What was this for?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="h-12 rounded-xl"
                  />
                </div>

                {error && (
                  <p className="text-red-500 text-sm">{error}</p>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={retake}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Retake
                  </Button>
                  <Button
                    className="flex-1 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500"
                    onClick={handleSubmit}
                    disabled={isCreating || !amount}
                  >
                    {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Expense'}
                  </Button>
                </div>
              </div>
            </>
          ) : error ? (
            <div className="text-center py-8">
              <Camera className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-red-500 mb-4">{error}</p>
              <div className="flex gap-3 justify-center">
                <Button onClick={startCamera} variant="outline">Try Again</Button>
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
              <p className="text-center text-sm text-gray-500">
                Take a photo of your receipt
              </p>
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
