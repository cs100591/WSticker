/**
 * AI Assistant service
 * Handles chat interactions and AI-powered action suggestions
 * Updated to use Supabase Edge Functions
 */

import { supabase } from './supabase';
import { ENV } from '@/config/env';

export type IntentType = 'task' | 'expense' | 'calendar' | 'unknown';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  action?: AIAction;
}

export interface AIAction {
  id: string;
  type: IntentType;
  confidence: number;
  data: {
    title?: string;
    priority?: 'low' | 'medium' | 'high';
    dueDate?: string;
    amount?: number;
    category?: string;
    description?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
    allDay?: boolean;
    merchant?: string;
  };
}

export interface AIResponse {
  message: string;
  action?: AIAction;
}

export interface VoiceParseResult {
  message: string;
  action?: {
    type: IntentType;
    data: any;
  };
}

class AIService {
  private functionUrl: string;

  constructor() {
    this.functionUrl = `${ENV.SUPABASE_URL}/functions/v1/api`;
  }

  /**
   * Send a text message to the AI assistant
   */
  async sendMessage(message: string, history: any[] = []): Promise<AIResponse> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`${this.functionUrl}?route=/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ENV.SUPABASE_ANON_KEY}`,
          'apikey': ENV.SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          message,
          history: history.map(m => ({
            role: m.isUser ? 'user' : 'assistant',
            content: m.text
          })),
          date: new Date().toISOString().split('T')[0]
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to communicate with AI');
      }

      const result = await response.json();

      // Map Supabase response to AIResponse format
      return {
        message: result.message || "I'm not sure how to respond to that.",
        action: result.action ? {
          id: this.generateActionId(),
          type: result.action.type,
          confidence: 1.0, // Edge function returns definitive actions
          data: result.action.data
        } : undefined
      };
    } catch (error) {
      console.error('AIService.sendMessage error:', error);
      throw error;
    }
  }

  /**
   * Transcribe audio using the Edge Function
   */
  async transcribeAudio(base64Audio: string, language: string = 'en'): Promise<string> {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`${this.functionUrl}?route=/transcribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ENV.SUPABASE_ANON_KEY}`,
          'apikey': ENV.SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          audio: base64Audio,
          language: language === 'zh' ? 'zh' : 'en',
          targetLanguage: language === 'zh' ? 'zh' : 'en',
        })
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const result = await response.json();
      return result.text || '';
    } catch (error) {
      console.error('AIService.transcribeAudio error:', error);
      throw error;
    }
  }

  /**
   * Generate a unique action ID
   */
  private generateActionId(): string {
    return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const aiService = new AIService();
