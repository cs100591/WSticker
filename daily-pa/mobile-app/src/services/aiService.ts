/**
 * AI Assistant service
 * Handles chat interactions and AI-powered action suggestions
 */

import { supabase } from './supabase';

export type IntentType = 'create_todo' | 'create_expense' | 'unknown';

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
  };
}

export interface AIResponse {
  message: string;
  action?: AIAction;
}

export interface VoiceParseResult {
  type: IntentType;
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

class AIService {
  private apiBaseUrl: string;

  constructor() {
    // Use the Next.js API endpoint
    this.apiBaseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
  }

  /**
   * Send a text message to the AI assistant
   */
  async sendMessage(message: string, language: 'en' | 'zh' = 'en'): Promise<AIResponse> {
    try {
      // Get current session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Call the voice parse API to extract intent
      const response = await fetch(`${this.apiBaseUrl}/api/voice/parse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          text: message,
          language,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to parse message');
      }

      const result: VoiceParseResult = await response.json();

      // Generate response message based on intent
      const responseMessage = this.generateResponseMessage(result, language);

      // Create action if intent is recognized
      let action: AIAction | undefined;
      if (result.type !== 'unknown' && result.confidence > 0.5) {
        action = {
          id: this.generateActionId(),
          type: result.type,
          confidence: result.confidence,
          data: result.data,
        };
      }

      return {
        message: responseMessage,
        action,
      };
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  /**
   * Send a voice message to the AI assistant
   * This would integrate with speech-to-text, then call sendMessage
   */
  async sendVoiceMessage(audioUri: string, language: 'en' | 'zh' = 'en'): Promise<AIResponse> {
    try {
      // TODO: Implement speech-to-text conversion
      // For now, this is a placeholder that would:
      // 1. Convert audio to text using Expo Speech or cloud service
      // 2. Call sendMessage with the transcribed text
      
      throw new Error('Voice message not yet implemented');
    } catch (error) {
      console.error('Failed to send voice message:', error);
      throw error;
    }
  }

  /**
   * Confirm an AI-suggested action
   * This will create the actual todo or expense
   */
  async confirmAction(action: AIAction): Promise<void> {
    try {
      if (action.type === 'create_todo') {
        await this.createTodoFromAction(action);
      } else if (action.type === 'create_expense') {
        await this.createExpenseFromAction(action);
      }
    } catch (error) {
      console.error('Failed to confirm action:', error);
      throw error;
    }
  }

  /**
   * Create a todo from an AI action
   */
  private async createTodoFromAction(action: AIAction): Promise<void> {
    const { todoService } = await import('./TodoService');
    
    // Get current user ID
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    await todoService.createTodo({
      userId: session.user.id,
      title: action.data.title || 'Untitled',
      color: this.priorityToColor(action.data.priority),
      dueDate: action.data.dueDate ? new Date(action.data.dueDate) : undefined,
    });
  }

  /**
   * Create an expense from an AI action
   */
  private async createExpenseFromAction(action: AIAction): Promise<void> {
    const { expenseService } = await import('./ExpenseService');
    
    // Get current user ID
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    await expenseService.createExpense({
      userId: session.user.id,
      amount: action.data.amount || 0,
      category: (action.data.category as 'food' | 'transport' | 'shopping' | 'entertainment' | 'bills' | 'health' | 'education' | 'other') || 'other',
      description: action.data.description || action.data.title || '',
      expenseDate: new Date(),
    });
  }

  /**
   * Generate a response message based on the parsed intent
   */
  private generateResponseMessage(result: VoiceParseResult, language: 'en' | 'zh'): string {
    if (result.type === 'unknown' || result.confidence < 0.5) {
      return language === 'zh' 
        ? '抱歉，我没有理解您的意思。您可以说"提醒我买牛奶"或"午饭花了50块"。'
        : "I'm sorry, I didn't understand that. You can say things like 'remind me to buy milk' or 'spent $50 on lunch'.";
    }

    if (result.type === 'create_todo') {
      const title = result.data.title || 'task';
      const dueDate = result.data.dueDate ? ` for ${result.data.dueDate}` : '';
      
      return language === 'zh'
        ? `好的，我可以帮您创建待办事项"${title}"${dueDate ? `，截止日期${dueDate}` : ''}。请确认？`
        : `I can create a todo "${title}"${dueDate} for you. Would you like me to proceed?`;
    }

    if (result.type === 'create_expense') {
      const amount = result.data.amount || 0;
      const category = result.data.category || 'other';
      const description = result.data.description || '';
      
      return language === 'zh'
        ? `好的，我可以帮您记录一笔${amount}元的${category}消费${description ? `（${description}）` : ''}。请确认？`
        : `I can record an expense of $${amount} for ${category}${description ? ` (${description})` : ''}. Would you like me to proceed?`;
    }

    return language === 'zh' ? '我能帮您什么？' : 'How can I help you?';
  }

  /**
   * Convert priority to color for todos
   */
  private priorityToColor(priority?: 'low' | 'medium' | 'high'): 'yellow' | 'blue' | 'pink' | 'green' | 'purple' | 'orange' {
    switch (priority) {
      case 'high':
        return 'orange';
      case 'medium':
        return 'yellow';
      case 'low':
        return 'green';
      default:
        return 'blue';
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
