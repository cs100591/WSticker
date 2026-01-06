'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, X, RotateCcw, Check, Loader2, ImageIcon, DollarSign, Sparkles, Scan } from 'lucide-react';
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
  { value: 'food', label: '餐饮', emoji: '🍔' },
  { value: 'transport', label: '交通', emoji: '🚗' },
  { value: 'shopping', label: '购物', emoji: '🛍️' },
  { value: 'entertainment', label: '娱乐', emoji: '🎬' },
  { value: 'bills', label: '账单', emoji: '📄' },
  { value: 'health', label: '医疗', emoji: '💊' },
  { value: 'education', label: '教育', emoji: '📚' },
  { value: 'other', label: '其他', emoji: '📦' },
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
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [ocrText, setOcrText] = useState('');

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
            setError('无法启动视频预览');
            setIsLoading(false);
          });
        };
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('无法访问相机，请使用文件上传');
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

  // OCR 扫描图片
  const scanImage = async (imageData: string) => {
    setIsScanning(true);
    setScanProgress(0);
    setOcrText('');
    
    try {
      // 动态导入 Tesseract.js
      const Tesseract = await import('tesseract.js');
      
      // 使用更好的 OCR 设置
      const result = await Tesseract.recognize(
        imageData,
        'chi_sim+eng', // 中文简体 + 英文
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setScanProgress(Math.round(m.progress * 100));
            }
          },
        }
      );
      
      const text = result.data.text;
      setOcrText(text);
      
      // 用 AI 解析 OCR 结果
      if (text.trim()) {
        await parseOcrResult(text);
      } else {
        // OCR 没有识别到文字，提示用户手动输入
        setError('未能识别收据内容，请手动输入金额');
      }
    } catch (err) {
      console.error('OCR error:', err);
      // OCR 失败提示用户手动输入
      setError('识别失败，请手动输入金额');
    } finally {
      setIsScanning(false);
      setScanProgress(0);
    }
  };

  // AI 解析 OCR 文本
  const parseOcrResult = async (text: string) => {
    try {
      const response = await fetch('/api/ocr/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          if (result.data.amount) setAmount(result.data.amount.toString());
          if (result.data.category) setCategory(result.data.category as ExpenseCategory);
          if (result.data.description) setDescription(result.data.description);
        }
      }
    } catch (err) {
      console.error('Parse error:', err);
    }
  };

  const takePhoto = useCallback(async () => {
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
        // 自动开始 OCR 扫描
        scanImage(imageData);
      }
    }
  }, [stopCamera, cameraReady]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const imageData = event.target?.result as string;
        setCapturedImage(imageData);
        stopCamera();
        setShowForm(true);
        // 自动开始 OCR 扫描
        scanImage(imageData);
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
    setOcrText('');
    startCamera();
  }, [startCamera]);

  const handleSubmit = async () => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('请输入有效金额');
      return;
    }

    setIsCreating(true);
    try {
      await createExpense({
        amount: amountNum,
        category,
        description: description || '收据扫描',
        expenseDate: new Date().toISOString().split('T')[0] as string,
      });
      setSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      setError('保存失败，请重试');
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
    setOcrText('');
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
          <GlassCardTitle>📸 扫描收据</GlassCardTitle>
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
              <p className="text-green-600 font-medium">消费已保存！</p>
            </div>
          ) : showForm ? (
            <>
              {/* Show captured image */}
              {capturedImage && (
                <div className="relative rounded-xl overflow-hidden bg-black">
                  <img src={capturedImage} alt="Receipt" className="w-full max-h-40 object-contain" />
                  {isScanning && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                      <Scan className="w-8 h-8 text-blue-400 animate-pulse mb-2" />
                      <p className="text-white text-sm">AI 正在识别... {scanProgress}%</p>
                      <div className="w-32 h-1 bg-gray-600 rounded-full mt-2">
                        <div 
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${scanProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* OCR 识别结果 */}
              {ocrText && !isScanning && (
                <div className="p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium text-gray-700">AI 识别结果</span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-3">{ocrText}</p>
                </div>
              )}

              {/* 快捷输入提示 */}
              {!isScanning && !amount && (
                <div className="p-3 bg-blue-50 rounded-xl">
                  <p className="text-sm text-blue-600">
                    💡 如果识别不准确，可以直接在下方输入金额
                  </p>
                </div>
              )}

              {/* Expense form */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">金额 *</label>
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
                  <label className="text-sm font-medium text-gray-700 mb-2 block">分类</label>
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
                  <label className="text-sm font-medium text-gray-700 mb-1 block">描述</label>
                  <Input
                    placeholder="这笔消费是什么？"
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
                    重拍
                  </Button>
                  <Button
                    className="flex-1 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500"
                    onClick={handleSubmit}
                    disabled={isCreating || !amount || isScanning}
                  >
                    {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : '保存'}
                  </Button>
                </div>
              </div>
            </>
          ) : error ? (
            <div className="text-center py-8">
              <Camera className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-red-500 mb-4">{error}</p>
              <div className="flex gap-3 justify-center">
                <Button onClick={startCamera} variant="outline">重试</Button>
                <Button onClick={() => fileInputRef.current?.click()}>
                  <ImageIcon className="w-4 h-4 mr-2" />
                  上传图片
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
                    <p>正在启动相机...</p>
                  </div>
                )}
              </div>
              <canvas ref={canvasRef} className="hidden" />
              <p className="text-center text-sm text-gray-500">
                拍摄收据，AI 自动识别金额
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
