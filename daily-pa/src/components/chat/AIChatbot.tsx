'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Bot, Check, Calendar, ListTodo, Receipt, Camera, Mic, MicOff } from 'lucide-react';
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
  status: 'pending' | 'confirmed' | 'cancelled' | 'follow-up';
  todoId?: string; // Store created todo ID for follow-up
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  actions?: ActionItem[];
  followUp?: {
    type: 'todo-calendar-color';
    todoId: string;
    todoTitle: string;
  };
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
  const [voiceLang, setVoiceLang] = useState<'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR'>('zh-CN');
  const [showVoiceLangMenu, setShowVoiceLangMenu] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const voiceLanguages = [
    { code: 'zh-CN' as const, label: '中文', flag: '🇨🇳' },
    { code: 'en-US' as const, label: 'English', flag: '🇺🇸' },
    { code: 'ja-JP' as const, label: '日本語', flag: '🇯🇵' },
    { code: 'ko-KR' as const, label: '한국어', flag: '�🇷}' },
  ];

  const t = {
    placeholder: locale === 'zh' ? '输入消息...' : 'Message...',
    greeting: locale === 'zh' 
      ? '你好！有什么可以帮你的？'
      : 'Hi! How can I help you?',
  };


  // Speech recognition setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = voiceLang;
      
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0]?.transcript || '')
          .join('');
        setInput(transcript);
      };
      
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, [voiceLang]);

  const toggleVoice = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.lang = voiceLang;
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const selectVoiceLang = (lang: typeof voiceLang) => {
    setVoiceLang(lang);
    setShowVoiceLangMenu(false);
    if (recognitionRef.current) recognitionRef.current.lang = lang;
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
    } catch { /* Camera not available */ }
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
    } catch { /* Scan failed */ }
    finally { setIsScanning(false); }
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

  const executeAction = async (action: ActionItem): Promise<{ success: boolean; error?: string; todoId?: string }> => {
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
            color: data.color || 'yellow',
          }),
        });
        if (!res.ok) throw new Error((await res.json()).error || 'Failed');
        const createdTodo = await res.json();
        return { success: true, todoId: createdTodo.id };
      } else if (type === 'expense') {
        const amount = typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount as number;
        const res = await fetch('/api/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount,
            category: (data.category as ExpenseCategory) || 'other',
            description: data.description as string || '',
            expenseDate: (data.date as string) || new Date().toISOString().split('T')[0],
          }),
        });
        if (!res.ok) throw new Error((await res.json()).error || 'Failed');
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
            color: '#3B82F6',
          }),
        });
        if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

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
          ? `✓ 已保存 ¥${scanResult.amount}`
          : `✓ Saved ¥${scanResult.amount}`,
      }]);
      closeCamera();
    }
  };


  // Cleanup camera on unmount
  useEffect(() => {
    return () => { if (stream) stream.getTracks().forEach(track => track.stop()); };
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
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input.trim() };
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
      
      let actions: ActionItem[] | undefined;
      if (data.actions && Array.isArray(data.actions)) {
        actions = data.actions.map((a: { type: string; data: Record<string, unknown> }, i: number) => ({
          id: `${Date.now()}-${i}`, type: a.type, data: a.data, status: 'pending' as const,
        }));
      } else if (data.action && data.action.type) {
        actions = [{ id: `${Date.now()}-0`, type: data.action.type, data: data.action.data, status: 'pending' as const }];
      }

      // All actions now require confirmation - no auto-execution
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message || (locale === 'zh' ? '好的！' : 'Got it!'),
        actions,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: locale === 'zh' ? '出错了，请重试' : 'Error, please retry',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (messageId: string, actionId: string, confirm: boolean) => {
    if (!confirm) {
      setMessages(prev => prev.map(m => {
        if (m.id !== messageId || !m.actions) return m;
        return { ...m, actions: m.actions.map(a => a.id === actionId ? { ...a, status: 'cancelled' as const } : a) };
      }));
      return;
    }
    const message = messages.find(m => m.id === messageId);
    const action = message?.actions?.find(a => a.id === actionId);
    if (!action) return;

    const result = await executeAction(action);
    
    // Update action status
    setMessages(prev => prev.map(m => {
      if (m.id !== messageId || !m.actions) return m;
      return { 
        ...m, 
        actions: m.actions.map(a => 
          a.id === actionId 
            ? { ...a, status: result.success ? 'confirmed' : 'pending' as const, todoId: result.todoId } 
            : a
        ) 
      };
    }));

    // If it's a todo and successfully created, ask follow-up questions
    if (result.success && action.type === 'todo' && result.todoId) {
      const todoId = result.todoId;
      const todoTitle = action.data.title as string;
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: locale === 'zh' 
            ? `✓ 待办已创建！要添加到日历吗？选择一个颜色吧 🎨`
            : `✓ Todo created! Add to calendar? Choose a color 🎨`,
          followUp: {
            type: 'todo-calendar-color',
            todoId,
            todoTitle,
          },
        }]);
      }, 500);
    }
  };

  const handleConfirmAll = async (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message?.actions) return;
    for (const action of message.actions.filter(a => a.status === 'pending')) {
      const result = await executeAction(action);
      setMessages(prev => prev.map(m => {
        if (m.id !== messageId || !m.actions) return m;
        return { ...m, actions: m.actions.map(a => a.id === action.id ? { ...a, status: result.success ? 'confirmed' : 'pending' as const } : a) };
      }));
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'todo': return <ListTodo className="w-3.5 h-3.5" />;
      case 'expense': return <Receipt className="w-3.5 h-3.5" />;
      case 'calendar': return <Calendar className="w-3.5 h-3.5" />;
      default: return <Bot className="w-3.5 h-3.5" />;
    }
  };

  const getActionSummary = (action: ActionItem) => {
    const { type, data } = action;
    if (type === 'todo') return String(data.title);
    if (type === 'expense') return `¥${data.amount} · ${data.category}`;
    if (type === 'calendar') return `${data.title} · ${data.startTime}`;
    return '';
  };

  // Action card with inline color selection for todos
  const renderActionCard = (action: ActionItem, messageId: string) => {
    const isTodo = action.type === 'todo';
    const colors = ['yellow', 'blue', 'pink'] as const;
    const colorEmojis = {
      yellow: '🟡',
      blue: '🔵',
      pink: '🩷',
    };

    return (
      <div
        key={action.id}
        className={cn(
          'rounded-xl transition-all duration-200 overflow-hidden',
          action.status === 'confirmed' && 'bg-green-50',
          action.status === 'cancelled' && 'bg-gray-50',
          action.status === 'pending' && 'bg-gray-50 border border-gray-200'
        )}
      >
        {/* Main action row */}
        <div className={cn(
          'flex items-center gap-2 px-3 py-2 text-sm',
          action.status === 'confirmed' && 'text-green-700',
          action.status === 'cancelled' && 'text-gray-400 line-through',
          action.status === 'pending' && 'text-gray-700'
        )}>
          <span className={cn(
            'flex-shrink-0',
            action.status === 'confirmed' && 'text-green-500',
            action.status === 'cancelled' && 'text-gray-300',
            action.status === 'pending' && 'text-gray-400'
          )}>
            {getActionIcon(action.type)}
          </span>
          <span className="flex-1 truncate">{getActionSummary(action)}</span>
          {action.status === 'pending' && (
            <div className="flex gap-1">
              <button
                onClick={() => handleAction(messageId, action.id, false)}
                className="p-1 rounded-md hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleAction(messageId, action.id, true)}
                className="p-1 rounded-md hover:bg-blue-100 text-blue-500 hover:text-blue-600 transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {action.status === 'confirmed' && <Check className="w-3.5 h-3.5 text-green-500" />}
        </div>

        {/* Color picker for todos */}
        {isTodo && action.status === 'pending' && (
          <div className="px-3 py-2 border-t border-gray-200 bg-white/50 flex gap-1.5 items-center">
            <span className="text-xs text-gray-500 font-medium">Color:</span>
            <div className="flex gap-1">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={async () => {
                    // Update action data with selected color
                    const updatedAction = { ...action, data: { ...action.data, color } };
                    // Update the action in the message
                    setMessages(prev => prev.map(m => {
                      if (m.id !== messageId || !m.actions) return m;
                      return {
                        ...m,
                        actions: m.actions.map(a => a.id === action.id ? updatedAction : a)
                      };
                    }));
                  }}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-sm hover:scale-110 transition-transform"
                  title={color}
                >
                  {colorEmojis[color]}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };


  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={cn(
        'fixed z-50',
        'inset-4 sm:inset-auto sm:bottom-24 sm:right-6',
        'w-auto sm:w-[360px]',
        'max-h-[calc(100vh-8rem)] sm:max-h-[70vh]',
        'bg-white/95 backdrop-blur-xl',
        'rounded-2xl shadow-2xl shadow-black/10',
        'border border-gray-200/50',
        'flex flex-col overflow-hidden',
        'animate-in fade-in slide-in-from-bottom-4 duration-200'
      )}>
        {/* Minimal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-gray-700">
              {locale === 'zh' ? 'AI 助手' : 'Assistant'}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={cn(
                'flex flex-col gap-1.5',
                message.role === 'user' ? 'items-end' : 'items-start'
              )}
            >
              <div className={cn(
                'max-w-[85%] px-3.5 py-2 text-[15px] leading-relaxed',
                message.role === 'user' 
                  ? 'bg-blue-500 text-white rounded-2xl rounded-br-md' 
                  : 'bg-gray-100 text-gray-800 rounded-2xl rounded-bl-md'
              )}>
                {message.content}
              </div>
              
              {message.actions && message.actions.length > 0 && (
                <div className="w-full max-w-[85%] space-y-1.5 mt-1">
                  {message.actions.map(action => renderActionCard(action, message.id))}
                  {message.actions.filter(a => a.status === 'pending').length > 1 && (
                    <button
                      onClick={() => handleConfirmAll(message.id)}
                      className="w-full py-1.5 text-xs font-medium text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      {locale === 'zh' ? '全部确认' : 'Confirm All'} ({message.actions.filter(a => a.status === 'pending').length})
                    </button>
                  )}
                </div>
              )}

              {/* Follow-up UI for todo */}
              {message.followUp && message.followUp.type === 'todo-calendar-color' && (
                <div className="w-full max-w-[85%] space-y-2 mt-1">
                  {/* Color Selection */}
                  <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                    <p className="text-xs text-gray-500 mb-2">{locale === 'zh' ? '选择颜色' : 'Choose Color'}</p>
                    <div className="flex gap-1.5">
                      {[
                        { value: 'yellow', emoji: '🟡' },
                        { value: 'blue', emoji: '🔵' },
                        { value: 'pink', emoji: '🩷' },
                      ].map((color) => (
                        <button
                          key={color.value}
                          onClick={async () => {
                            await fetch(`/api/todos/${message.followUp!.todoId}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ color: color.value }),
                            });
                            setMessages(prev => prev.map(m => 
                              m.id === message.id ? { ...m, followUp: undefined } : m
                            ));
                          }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-lg hover:scale-110 transition-transform"
                        >
                          {color.emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Add to Calendar */}
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        // Add to calendar logic here
                        const today = new Date().toISOString().split('T')[0];
                        await fetch('/api/calendar', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            title: message.followUp!.todoTitle,
                            startTime: `${today}T09:00:00`,
                            endTime: `${today}T10:00:00`,
                            allDay: false,
                            color: '#3B82F6',
                          }),
                        });
                        setMessages(prev => [...prev, {
                          id: Date.now().toString(),
                          role: 'assistant',
                          content: locale === 'zh' ? '✓ 已添加到日历！' : '✓ Added to calendar!',
                        }]);
                        setMessages(prev => prev.map(m => 
                          m.id === message.id ? { ...m, followUp: undefined } : m
                        ));
                      }}
                      className="flex-1 py-2 text-sm font-medium text-blue-500 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      {locale === 'zh' ? '📅 添加到日历' : '📅 Add to Calendar'}
                    </button>
                    <button
                      onClick={() => {
                        setMessages(prev => prev.map(m => 
                          m.id === message.id ? { ...m, followUp: undefined } : m
                        ));
                      }}
                      className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {locale === 'zh' ? '跳过' : 'Skip'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex items-start">
              <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-2.5">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 border-t border-gray-100">
          {showCamera ? (
            <div className="space-y-2">
              {capturedImage ? (
                <>
                  <div className="relative rounded-xl overflow-hidden bg-gray-900 aspect-video">
                    <img src={capturedImage} alt="Receipt" className="w-full h-full object-contain" />
                    {isScanning && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    )}
                  </div>
                  {scanResult && !isScanning && (
                    <div className="flex items-center justify-between px-3 py-2 bg-green-50 rounded-xl text-sm">
                      <span className="text-green-700">¥{scanResult.amount} · {scanResult.category}</span>
                      <div className="flex gap-1">
                        <button onClick={() => { setCapturedImage(null); setScanResult(null); startCamera(); }} className="p-1.5 rounded-lg hover:bg-green-100 text-green-600">
                          <X className="w-4 h-4" />
                        </button>
                        <button onClick={saveScannedExpense} className="p-1.5 rounded-lg hover:bg-green-100 text-green-600">
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                  <button onClick={closeCamera} className="w-full py-1.5 text-xs text-gray-400 hover:text-gray-600">
                    {locale === 'zh' ? '取消' : 'Cancel'}
                  </button>
                </>
              ) : (
                <>
                  <div className="relative rounded-xl overflow-hidden bg-gray-900 aspect-video">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    {!cameraReady && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-white rounded-full animate-bounce" />
                          <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    )}
                  </div>
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="flex gap-2">
                    <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">
                      {locale === 'zh' ? '选择图片' : 'Choose'}
                    </button>
                    <button onClick={takePhoto} disabled={!cameraReady} className="flex-1 py-2 text-sm text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50 rounded-xl transition-colors">
                      {locale === 'zh' ? '拍照' : 'Capture'}
                    </button>
                    <button onClick={closeCamera} className="flex-1 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">
                      {locale === 'zh' ? '取消' : 'Cancel'}
                    </button>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileUpload} className="hidden" />
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {/* Camera button */}
              <button
                onClick={openCamera}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <Camera className="w-5 h-5" />
              </button>

              {/* Voice button */}
              {speechSupported && (
                <div className="relative">
                  <button
                    onClick={toggleVoice}
                    onContextMenu={(e) => { e.preventDefault(); setShowVoiceLangMenu(!showVoiceLangMenu); }}
                    className={cn(
                      'p-2 rounded-xl transition-all',
                      isListening 
                        ? 'text-red-500 bg-red-50 animate-pulse' 
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                    )}
                  >
                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                  {showVoiceLangMenu && (
                    <div className="absolute bottom-12 left-0 bg-white rounded-xl shadow-lg border border-gray-100 py-1 min-w-[100px] z-10">
                      {voiceLanguages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => selectVoiceLang(lang.code)}
                          className={cn(
                            'w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-50',
                            voiceLang === lang.code && 'text-blue-500'
                          )}
                        >
                          <span>{lang.flag}</span>
                          <span>{lang.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Input */}
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder={isListening ? (locale === 'zh' ? '正在听...' : 'Listening...') : t.placeholder}
                className={cn(
                  'flex-1 px-3 py-2 text-[15px] bg-gray-100 rounded-xl',
                  'border-0 outline-none focus:ring-2 focus:ring-blue-500/20',
                  'placeholder:text-gray-400',
                  isListening && 'bg-red-50'
                )}
                disabled={isLoading}
              />

              {/* Send button - only show when has input */}
              {input.trim() && (
                <button
                  onClick={sendMessage}
                  disabled={isLoading}
                  className="p-2 rounded-xl text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50 transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
