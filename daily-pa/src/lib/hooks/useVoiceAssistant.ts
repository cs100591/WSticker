'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface ParsedIntent {
  type: 'create_todo' | 'create_expense' | 'create_calendar' | 'unknown';
  confidence: number;
  data: {
    title?: string;
    priority?: 'low' | 'medium' | 'high';
    dueDate?: string;
    amount?: number;
    category?: string;
    description?: string;
    startTime?: string;
    endTime?: string;
  };
  originalText: string;
}

interface UseVoiceAssistantOptions {
  locale?: 'en' | 'zh';
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

// SpeechRecognition types
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

export function useVoiceAssistant(options?: UseVoiceAssistantOptions): UseVoiceAssistantReturn {
  const locale = options?.locale || 'en';
  
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [parsedIntent, setParsedIntent] = useState<ParsedIntent | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const finalTranscriptRef = useRef('');

  // Check browser support
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
  }, []);

  // Parse intent
  const parseIntent = useCallback(async (text: string) => {
    if (!text.trim()) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const response = await fetch('/api/voice/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language: locale }),
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
  }, [locale]);

  // Get recognition language based on user's locale setting
  const getRecognitionLanguage = useCallback((): string => {
    // Use user's interface language setting
    return locale === 'zh' ? 'zh-CN' : 'en-US';
  }, [locale]);

  // Start listening
  const startListening = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError(locale === 'zh' ? '不支持语音识别' : 'Speech recognition not supported');
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
      if (event.error === 'no-speech') {
        setIsListening(false);
        return;
      }
      
      const errorMessages: Record<string, Record<string, string>> = {
        en: {
          'service-not-allowed': 'Voice input not available. Please use text input.',
          'not-allowed': 'Microphone permission denied. Please allow access.',
          'network': 'Network error. Please check your connection.',
          'aborted': 'Speech recognition was interrupted.',
        },
        zh: {
          'service-not-allowed': '此设备不支持语音输入，请使用文字输入',
          'not-allowed': '麦克风权限被拒绝，请允许访问',
          'network': '网络错误，请检查网络连接',
          'aborted': '语音识别被中断',
        },
      };
      const messages = errorMessages[locale] ?? errorMessages['en'] ?? {};
      const message = messages[event.error] ?? `Speech recognition error: ${event.error}`;
      setError(message);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (finalTranscriptRef.current) {
        parseIntent(finalTranscriptRef.current);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [parseIntent, getRecognitionLanguage, locale]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setTranscript('');
    setError(null);
    setParsedIntent(null);
    setIsProcessing(false);
    finalTranscriptRef.current = '';
  }, []);

  // Parse text input
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
