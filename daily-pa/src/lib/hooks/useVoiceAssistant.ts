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

interface UseVoiceAssistantReturn {
  isListening: boolean;
  isProcessing: boolean;
  transcript: string;
  error: string | null;
  parsedIntent: ParsedIntent | null;
  isSupported: boolean;
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

export function useVoiceAssistant(): UseVoiceAssistantReturn {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [parsedIntent, setParsedIntent] = useState<ParsedIntent | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  
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
      const response = await fetch('/api/voice/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
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
    recognition.lang = 'zh-CN'; // 支持中文

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
      setError(`Speech recognition error: ${event.error}`);
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
  }, [parseIntent]);

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
    startListening,
    stopListening,
    reset,
    parseText,
  };
}
