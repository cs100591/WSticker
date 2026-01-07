'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Loader2, Bot, User, Check, Calendar, ListTodo, Receipt, Sparkles, Camera, ImageIcon, RotateCcw, Scan, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { ExpenseCategory } from '@/types/expense';

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: Event) => void) | null;
  start(): void;
  stop(): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface ActionItem {
  id: string;
  type: 'todo' | 'expense' | 'calendar';
  data: Record<string, unknown>;
  status: 'pending' | 'confirmed' | 'cancelled';
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  actions?: ActionItem[];
}

interface AIChatbotProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AIChatbot({ isOpen, onClose }: AIChatbotProps) {
  const { locale } = useI18n();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Camera states
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ amount?: number; category?: string; description?: string } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice recognition states
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Check speech recognition support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = locale === 'zh' ? 'zh-CN' : 'en-US';
      
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0]?.transcript || '')
          .join('');
        setInput(transcript);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognition.onerror = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
    }
  }, [locale]);

  const toggleVoice = () => {
    if (!recognitionRef.current) return;
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.lang = locale === 'zh' ? 'zh-CN' : 'en-US';
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const categories: { value: ExpenseCategory; label: string; emoji: string }[] = locale === 'zh' 
    ? [
        { value: 'food', label: '餐饮', emoji: '🍔' },
        { value: 'transport', label: '交通', emoji: '🚗' },
        { value: 'shopping', label: '购物', emoji: '🛍️' },
        { value: 'entertainment', label: '娱乐', emoji: '🎬' },
        { value: 'bills', label: '账单', emoji: '📄' },
        { value: 'health', label: '医疗', emoji: '💊' },
        { value: 'education', label: '教育', emoji: '📚' },
        { value: 'other', label: '其他', emoji: '📦' },
      ]
    : [
        { value: 'food', label: 'Food', emoji: '🍔' },
        { value: 'transport', label: 'Transport', emoji: '🚗' },
        { value: 'shopping', label: 'Shopping', emoji: '🛍️' },
        { value: 'entertainment', label: 'Fun', emoji: '🎬' },
        { value: 'bills', label: 'Bills', emoji: '📄' },
        { value: 'health', label: 'Health', emoji: '💊' },
        { value: 'education', label: 'Education', emoji: '📚' },
        { value: 'other', label: 'Other', emoji: '📦' },
      ];

  const t = {
    title: locale === 'zh' ? '✨ AI 助手' : '✨ AI Assistant',
    placeholder: locale === 'zh' ? '告诉我你想做什么...' : 'Tell me what you want to do...',
    greeting: locale === 'zh' 
      ? '你好！我是你的 AI 助手 👋\n\n我可以帮你：\n• 创建待办事项\n• 记录消费\n• 添加日历事件\n• 📸 扫描收据\n• 🎤 语音输入\n\n试试说："明天上午9点开会，下午3点见客户"'
      : 'Hi! I\'m your AI assistant 👋\n\nI can help you:\n• Create todos\n• Record expenses\n• Add calendar events\n• 📸 Scan receipts\n• 🎤 Voice input\n\nTry: "Meeting at 9am and lunch with client at noon tomorrow"',
    confirm: locale === 'zh' ? '确认' : 'Confirm',
    cancel: locale === 'zh' ? '取消' : 'Cancel',
    confirmAll: locale === 'zh' ? '全部确认' : 'Confirm All',
    created: locale === 'zh' ? '已创建！' : 'Created!',
    cancelled: locale === 'zh' ? '已取消' : 'Cancelled',
    scanReceipt: locale === 'zh' ? '扫描收据' : 'Scan Receipt',
    scanning: locale === 'zh' ? 'AI 正在识别...' : 'AI scanning...',
    retake: locale === 'zh' ? '重拍' : 'Retake',
    amount: locale === 'zh' ? '金额' : 'Amount',
    category: locale === 'zh' ? '分类' : 'Category',
    description: locale === 'zh' ? '描述' : 'Description',
    save: locale === 'zh' ? '保存' : 'Save',
  };

  // Camera functions
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraReady(false);
  }, [stream]);

  const startCamera = useCallback(async () => {
    setCameraReady(false);
    if (stream) stream.getTracks().forEach(track => track.stop());
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().then(() => setCameraReady(true)).catch(() => {});
        };
      }
    } catch {
      // Camera not available
    }
  }, [stream]);

  const openCamera = () => {
    setShowCamera(true);
    setCapturedImage(null);
    setScanResult(null);
    setTimeout(() => startCamera(), 100);
  };

  const closeCamera = () => {
    stopCamera();
    setShowCamera(false);
    setCapturedImage(null);
    setScanResult(null);
  };

  const scanImage = async (imageData: string) => {
    setIsScanning(true);
    try {
      const response = await fetch('/api/ocr/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData, language: locale }),
      });
      const result = await response.json();
      if (result.success && result.data) {
        setScanResult({
          amount: result.data.amount,
          category: result.data.category,
          description: result.data.description,
        });
      }
    } catch {
      // Scan failed
    } finally {
      setIsScanning(false);
    }
  };

  const takePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current && cameraReady) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(imageData);
        stopCamera();
        scanImage(imageData);
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
        setShowCamera(true);
        scanImage(imageData);
      };
      reader.readAsDataURL(file);
    }
  }, [stopCamera]);

  const saveScannedExpense = async () => {
    if (!scanResult?.amount) return;
    
    const action: ActionItem = {
      id: `scan-${Date.now()}`,
      type: 'expense',
      data: {
        amount: scanResult.amount,
        category: scanResult.category || 'other',
        description: scanResult.description || 'Receipt',
        date: new Date().toISOString().split('T')[0],
      },
      status: 'pending',
    };

    const result = await executeAction(action);
    
    if (result.success) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: locale === 'zh' 
          ? `✅ 已保存收据消费：¥${scanResult.amount} (${scanResult.category || 'other'})`
          : `✅ Receipt saved: ¥${scanResult.amount} (${scanResult.category || 'other'})`,
      }]);
      closeCamera();
    } else {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: locale === 'zh' ? `❌ 保存失败：${result.error}` : `❌ Save failed: ${result.error}`,
      }]);
    }
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, []);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{ id: '1', role: 'assistant', content: t.greeting }]);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage.content,
          language: locale,
          history: messages.slice(-6).map(m => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await response.json();
      
      // Handle both single action and multiple actions
      let actions: ActionItem[] | undefined;
      if (data.actions && Array.isArray(data.actions)) {
        actions = data.actions.map((a: { type: string; data: Record<string, unknown> }, i: number) => ({
          id: `${Date.now()}-${i}`,
          type: a.type,
          data: a.data,
          status: 'pending' as const,
        }));
      } else if (data.action && data.action.type) {
        actions = [{
          id: `${Date.now()}-0`,
          type: data.action.type,
          data: data.action.data,
          status: 'pending' as const,
        }];
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message || (locale === 'zh' ? '好的！' : 'Got it!'),
        actions,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: locale === 'zh' ? '抱歉，出了点问题。请再试一次。' : 'Sorry, something went wrong. Please try again.',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const executeAction = async (action: ActionItem): Promise<{ success: boolean; error?: string }> => {
    try {
      const { type, data } = action;

      if (type === 'todo') {
        const res = await fetch('/api/todos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: data.title as string,
            priority: (data.priority as 'low' | 'medium' | 'high') || 'medium',
            dueDate: data.dueDate as string | undefined,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to create todo');
        }
      } else if (type === 'expense') {
        const amount = typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount as number;
        const today = new Date().toISOString().split('T')[0] as string;
        const expenseDate = (data.date as string) || today;
        
        const res = await fetch('/api/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: amount,
            category: (data.category as ExpenseCategory) || 'other',
            description: data.description as string || '',
            expenseDate: expenseDate,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to create expense');
        }
      } else if (type === 'calendar') {
        const eventDate = data.date as string || new Date().toISOString().split('T')[0];
        const startTime = data.startTime as string || '09:00';
        const endTime = data.endTime as string || '10:00';
        
        const res = await fetch('/api/calendar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: data.title as string,
            description: data.description as string || '',
            startTime: `${eventDate}T${startTime}:00`,
            endTime: `${eventDate}T${endTime}:00`,
            allDay: data.allDay || false,
            color: 'from-blue-500 to-blue-600',
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to create calendar event');
        }
      }
      return { success: true };
    } catch (error) {
      console.error('Action error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  const handleAction = async (messageId: string, actionId: string, confirm: boolean) => {
    if (!confirm) {
      setMessages(prev => prev.map(m => {
        if (m.id !== messageId || !m.actions) return m;
        return {
          ...m,
          actions: m.actions.map(a => 
            a.id === actionId ? { ...a, status: 'cancelled' as const } : a
          ),
        };
      }));
      return;
    }

    const message = messages.find(m => m.id === messageId);
    const action = message?.actions?.find(a => a.id === actionId);
    if (!action) return;

    const result = await executeAction(action);
    
    setMessages(prev => prev.map(m => {
      if (m.id !== messageId || !m.actions) return m;
      return {
        ...m,
        actions: m.actions.map(a => 
          a.id === actionId ? { ...a, status: result.success ? 'confirmed' : 'pending' as const } : a
        ),
      };
    }));

    if (!result.success) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: locale === 'zh' 
          ? `抱歉，保存失败：${result.error || '未知错误'}` 
          : `Sorry, failed to save: ${result.error || 'Unknown error'}`,
      }]);
    }
  };

  const handleConfirmAll = async (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message?.actions) return;

    const pendingActions = message.actions.filter(a => a.status === 'pending');
    const errors: string[] = [];
    
    for (const action of pendingActions) {
      const result = await executeAction(action);
      setMessages(prev => prev.map(m => {
        if (m.id !== messageId || !m.actions) return m;
        return {
          ...m,
          actions: m.actions.map(a => 
            a.id === action.id ? { ...a, status: result.success ? 'confirmed' : 'pending' as const } : a
          ),
        };
      }));
      if (!result.success && result.error) {
        errors.push(result.error);
      }
    }

    if (errors.length > 0) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: locale === 'zh' 
          ? `部分保存失败：${errors[0]}` 
          : `Some items failed to save: ${errors[0]}`,
      }]);
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'todo': return <ListTodo className="w-4 h-4" />;
      case 'expense': return <Receipt className="w-4 h-4" />;
      case 'calendar': return <Calendar className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  const getActionLabel = (type: string) => {
    if (locale === 'zh') {
      switch (type) {
        case 'todo': return '待办';
        case 'expense': return '消费';
        case 'calendar': return '日历';
        default: return '操作';
      }
    }
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const renderActionCard = (action: ActionItem, messageId: string) => (
    <div
      key={action.id}
      className={cn(
        'rounded-xl p-3 border',
        action.status === 'confirmed' ? 'bg-green-50 border-green-200' :
        action.status === 'cancelled' ? 'bg-gray-50 border-gray-200 opacity-50' :
        'bg-blue-50 border-blue-200'
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        {getActionIcon(action.type)}
        <span className="text-sm font-medium">{getActionLabel(action.type)}</span>
        {action.status === 'confirmed' && <Check className="w-4 h-4 text-green-500 ml-auto" />}
      </div>

      <div className="text-sm text-gray-600 space-y-1">
        {action.type === 'todo' && (
          <>
            <p>📝 {String(action.data.title)}</p>
            {action.data.dueDate && <p>📅 {String(action.data.dueDate)}</p>}
          </>
        )}
        {action.type === 'expense' && (
          <>
            <p>💰 ¥{String(action.data.amount)}</p>
            <p>📁 {String(action.data.category)}</p>
            {action.data.description && <p>📝 {String(action.data.description)}</p>}
          </>
        )}
        {action.type === 'calendar' && (
          <>
            <p>📅 {String(action.data.title)}</p>
            {action.data.date && <p>🗓️ {String(action.data.date)}</p>}
            {action.data.startTime && <p>⏰ {String(action.data.startTime)} - {String(action.data.endTime || '')}</p>}
          </>
        )}
      </div>

      {action.status === 'pending' && (
        <div className="flex gap-2 mt-3">
          <Button size="sm" variant="outline" className="flex-1 h-8 rounded-lg"
            onClick={() => handleAction(messageId, action.id, false)}>{t.cancel}</Button>
          <Button size="sm" className="flex-1 h-8 rounded-lg bg-blue-500"
            onClick={() => handleAction(messageId, action.id, true)}>{t.confirm}</Button>
        </div>
      )}
      {action.status === 'confirmed' && <p className="text-green-600 text-sm mt-2">{t.created}</p>}
      {action.status === 'cancelled' && <p className="text-gray-500 text-sm mt-2">{t.cancelled}</p>}
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <GlassCard className="w-full max-w-md h-[80vh] sm:h-[600px] flex flex-col animate-in slide-in-from-bottom duration-300">
        <GlassCardHeader className="flex flex-row items-center justify-between border-b border-white/10 pb-4">
          <GlassCardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-500" />
            {t.title}
          </GlassCardTitle>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </GlassCardHeader>

        <GlassCardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={cn('flex gap-3', message.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
              )}>
                {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className={cn('max-w-[80%] space-y-2', message.role === 'user' ? 'items-end' : 'items-start')}>
                <div className={cn(
                  'rounded-2xl px-4 py-2 whitespace-pre-wrap',
                  message.role === 'user' ? 'bg-blue-500 text-white rounded-br-md' : 'bg-white/80 text-gray-800 rounded-bl-md shadow-sm'
                )}>
                  {message.content}
                </div>

                {message.actions && message.actions.length > 0 && (
                  <div className="space-y-2">
                    {message.actions.map(action => renderActionCard(action, message.id))}
                    
                    {message.actions.filter(a => a.status === 'pending').length > 1 && (
                      <Button
                        size="sm"
                        className="w-full h-10 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500"
                        onClick={() => handleConfirmAll(message.id)}
                      >
                        {t.confirmAll} ({message.actions.filter(a => a.status === 'pending').length})
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white/80 rounded-2xl rounded-bl-md px-4 py-2 shadow-sm">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </GlassCardContent>

        <div className="p-4 border-t border-white/10">
          {showCamera ? (
            <div className="space-y-3">
              {capturedImage ? (
                <>
                  <div className="relative rounded-xl overflow-hidden bg-black">
                    <img src={capturedImage} alt="Receipt" className="w-full max-h-48 object-contain" />
                    {isScanning && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                        <Scan className="w-8 h-8 text-blue-400 animate-pulse mb-2" />
                        <p className="text-white text-sm">{t.scanning}</p>
                      </div>
                    )}
                  </div>
                  {scanResult && !isScanning && (
                    <div className="p-3 bg-green-50 rounded-xl space-y-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-medium">AI 识别结果</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="bg-white rounded-lg p-2 text-center">
                          <p className="text-gray-500 text-xs">{t.amount}</p>
                          <p className="font-bold text-green-600">¥{scanResult.amount}</p>
                        </div>
                        <div className="bg-white rounded-lg p-2 text-center">
                          <p className="text-gray-500 text-xs">{t.category}</p>
                          <p className="font-medium">{categories.find(c => c.value === scanResult.category)?.emoji} {scanResult.category}</p>
                        </div>
                        <div className="bg-white rounded-lg p-2 text-center">
                          <p className="text-gray-500 text-xs">{t.description}</p>
                          <p className="font-medium truncate">{scanResult.description || '-'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 h-10 rounded-xl" onClick={() => { setCapturedImage(null); setScanResult(null); startCamera(); }}>
                      <RotateCcw className="w-4 h-4 mr-2" />{t.retake}
                    </Button>
                    <Button className="flex-1 h-10 rounded-xl bg-green-500" onClick={saveScannedExpense} disabled={isScanning || !scanResult?.amount}>
                      <Check className="w-4 h-4 mr-2" />{t.save}
                    </Button>
                  </div>
                  <Button variant="ghost" className="w-full h-8 text-gray-500" onClick={closeCamera}>
                    <X className="w-4 h-4 mr-1" />{t.cancel}
                  </Button>
                </>
              ) : (
                <>
                  <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    {!cameraReady && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                      </div>
                    )}
                  </div>
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} className="rounded-full h-12 w-12">
                      <ImageIcon className="w-5 h-5" />
                    </Button>
                    <Button size="lg" onClick={takePhoto} disabled={!cameraReady} className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500">
                      <Camera className="w-6 h-6" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={closeCamera} className="rounded-full h-12 w-12">
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileUpload} className="hidden" />
                </>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={openCamera}
                className="h-12 w-12 rounded-xl"
                title={t.scanReceipt}
              >
                <Camera className="w-5 h-5" />
              </Button>
              {speechSupported && (
                <Button
                  variant={isListening ? "default" : "outline"}
                  onClick={toggleVoice}
                  className={cn(
                    "h-12 w-12 rounded-xl transition-all",
                    isListening && "bg-red-500 hover:bg-red-600 animate-pulse"
                  )}
                  title={locale === 'zh' ? '语音输入' : 'Voice input'}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </Button>
              )}
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder={isListening ? (locale === 'zh' ? '正在听...' : 'Listening...') : t.placeholder}
                className={cn(
                  "flex-1 h-12 rounded-xl bg-white/50",
                  isListening && "border-red-300 bg-red-50/50"
                )}
                disabled={isLoading}
              />
              <Button
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                className="h-12 w-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </Button>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
