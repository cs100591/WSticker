'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface ParsedIntent {
  type: 'create_todo' | 'create_expense' | 'unknown';
  confidence: number;
  data: {
    title?: string;
    priority?: 'low' | 'medium' | 'high';
    dueDate?: string;
    amount?: number;
    category?: string;
    description?: string;
  };
  originalText: string;
}

type VoiceLanguage = 'auto' | 'zh-CN' | 'en-US';

interface UseVoiceAssistantReturn {
  isListening: boolean;
  isProcessing: boolean;
  transcript: string;
  error: string | null;
  parsedIntent: ParsedIntent | null;
  isSupported: boolean;
  language: VoiceLanguage;
  setLanguage: (lang: VoiceLanguage) => void;
  startListening: () => void;
  stopListening: () => void;
  reset: () => void;
  parseText: (text: string) => Promise<void>;
}

// SpeechRecognition 类型定义
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

// 检测文本语言
function detectLanguage(text: string): 'zh' | 'en' {
  // 检测是否包含中文字符
  const chineseRegex = /[\u4e00-\u9fa5]/;
  const hasChineseChars = chineseRegex.test(text);
  
  // 如果包含中文字符，认为是中文
  if (hasChineseChars) {
    return 'zh';
  }
  
  return 'en';
}

// 获取浏览器语言
function getBrowserLanguage(): 'zh-CN' | 'en-US' {
  if (typeof navigator === 'undefined') return 'zh-CN';
  const lang = navigator.language || 'zh-CN';
  // 默认优先中文，因为大部分用户是中文
  if (lang.startsWith('en')) return 'en-US';
  return 'zh-CN';
}

export function useVoiceAssistant(): UseVoiceAssistantReturn {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [parsedIntent, setParsedIntent] = useState<ParsedIntent | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [language, setLanguage] = useState<VoiceLanguage>('auto');
  
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const finalTranscriptRef = useRef('');

  // 检查浏览器支持
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
  }, []);

  // 解析意图
  const parseIntent = useCallback(async (text: string) => {
    if (!text.trim()) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // 检测语言用于 API 解析
      const detectedLang = detectLanguage(text);
      
      const response = await fetch('/api/voice/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language: detectedLang }),
      });

      if (!response.ok) {
        throw new Error('Failed to parse intent');
      }

      const intent = await response.json();
      setParsedIntent(intent);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // 获取实际使用的语言
  const getRecognitionLanguage = useCallback((): string => {
    if (language === 'auto') {
      return getBrowserLanguage();
    }
    return language;
  }, [language]);

  // 开始监听
  const startListening = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError('Speech recognition not supported');
      return;
    }

    const recognition = new SpeechRecognition() as SpeechRecognitionInstance;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = getRecognitionLanguage();

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      setTranscript('');
      setParsedIntent(null);
      finalTranscriptRef.current = '';
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result) {
          if (result.isFinal) {
            finalTranscript += result[0]?.transcript || '';
          } else {
            interimTranscript += result[0]?.transcript || '';
          }
        }
      }

      if (finalTranscript) {
        finalTranscriptRef.current = finalTranscript;
      }
      setTranscript(finalTranscript || interimTranscript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // Handle iOS-specific errors
      const errorMessages: Record<string, string> = {
        'service-not-allowed': 'Voice input not available on this device. Please use text input.',
        'not-allowed': 'Microphone permission denied. Please allow microphone access or use text input.',
        'no-speech': 'No speech detected. Please try again.',
        'network': 'Network error. Please check your connection.',
      };
      const message = errorMessages[event.error] || `Speech recognition error: ${event.error}`;
      setError(message);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      // 自动解析最终结果
      if (finalTranscriptRef.current) {
        parseIntent(finalTranscriptRef.current);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [parseIntent, getRecognitionLanguage]);

  // 停止监听
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  // 重置状态
  const reset = useCallback(() => {
    setTranscript('');
    setError(null);
    setParsedIntent(null);
    setIsProcessing(false);
    finalTranscriptRef.current = '';
  }, []);

  // 解析文本输入（用于手动输入）
  const parseText = useCallback(async (text: string) => {
    setTranscript(text);
    await parseIntent(text);
  }, [parseIntent]);

  return {
    isListening,
    isProcessing,
    transcript,
    error,
    parsedIntent,
    isSupported,
    language,
    setLanguage,
    startListening,
    stopListening,
    reset,
    parseText,
  };
}
