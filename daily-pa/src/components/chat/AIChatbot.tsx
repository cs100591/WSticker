'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, Bot, User, Check, Calendar, ListTodo, Receipt, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { useTodos } from '@/lib/hooks/useTodos';
import { useExpenses } from '@/lib/hooks/useExpenses';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { ExpenseCategory } from '@/types/expense';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  action?: {
    type: 'todo' | 'expense' | 'calendar';
    data: Record<string, unknown>;
    status: 'pending' | 'confirmed' | 'cancelled';
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

  const { createTodo } = useTodos();
  const { createExpense } = useExpenses();

  const t = {
    title: locale === 'zh' ? '✨ AI 助手' : '✨ AI Assistant',
    placeholder: locale === 'zh' ? '告诉我你想做什么...' : 'Tell me what you want to do...',
    greeting: locale === 'zh' 
      ? '你好！我是你的 AI 助手 👋\n\n我可以帮你：\n• 创建待办事项\n• 记录消费\n• 添加日历事件\n\n试试说："明天下午3点开会" 或 "午饭花了50块"'
      : 'Hi! I\'m your AI assistant 👋\n\nI can help you:\n• Create todos\n• Record expenses\n• Add calendar events\n\nTry: "Meeting tomorrow at 3pm" or "Lunch $15"',
    confirm: locale === 'zh' ? '确认' : 'Confirm',
    cancel: locale === 'zh' ? '取消' : 'Cancel',
    created: locale === 'zh' ? '已创建！' : 'Created!',
    cancelled: locale === 'zh' ? '已取消' : 'Cancelled',
  };

  // Initialize with greeting
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: '1',
        role: 'assistant',
        content: t.greeting,
      }]);
    }
  }, [isOpen]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
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

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        action: data.action ? { ...data.action, status: 'pending' } : undefined,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: locale === 'zh' ? '抱歉，出了点问题。请再试一次。' : 'Sorry, something went wrong. Please try again.',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (messageId: string, confirm: boolean) => {
    const message = messages.find(m => m.id === messageId);
    if (!message?.action) return;

    if (!confirm) {
      setMessages(prev => prev.map(m => 
        m.id === messageId 
          ? { ...m, action: { ...m.action!, status: 'cancelled' } }
          : m
      ));
      return;
    }

    try {
      const { type, data } = message.action;

      if (type === 'todo') {
        await createTodo({
          title: data.title as string,
          priority: (data.priority as 'low' | 'medium' | 'high') || 'medium',
          dueDate: data.dueDate as string | undefined,
        });
      } else if (type === 'expense') {
        await createExpense({
          amount: data.amount as number,
          category: (data.category as ExpenseCategory) || 'other',
          description: data.description as string || '',
          expenseDate: new Date().toISOString().split('T')[0] as string,
        });
      }
      // Calendar would be similar

      setMessages(prev => prev.map(m => 
        m.id === messageId 
          ? { ...m, action: { ...m.action!, status: 'confirmed' } }
          : m
      ));
    } catch (error) {
      console.error('Action error:', error);
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
        case 'todo': return '待办事项';
        case 'expense': return '消费记录';
        case 'calendar': return '日历事件';
        default: return '操作';
      }
    }
    switch (type) {
      case 'todo': return 'Todo';
      case 'expense': return 'Expense';
      case 'calendar': return 'Calendar Event';
      default: return 'Action';
    }
  };

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
            <div
              key={message.id}
              className={cn(
                'flex gap-3',
                message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              )}
            >
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                message.role === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
              )}>
                {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className={cn(
                'max-w-[80%] space-y-2',
                message.role === 'user' ? 'items-end' : 'items-start'
              )}>
                <div className={cn(
                  'rounded-2xl px-4 py-2 whitespace-pre-wrap',
                  message.role === 'user'
                    ? 'bg-blue-500 text-white rounded-br-md'
                    : 'bg-white/80 text-gray-800 rounded-bl-md shadow-sm'
                )}>
                  {message.content}
                </div>

                {message.action && (
                  <div className={cn(
                    'rounded-xl p-3 border',
                    message.action.status === 'confirmed' 
                      ? 'bg-green-50 border-green-200'
                      : message.action.status === 'cancelled'
                      ? 'bg-gray-50 border-gray-200 opacity-50'
                      : 'bg-blue-50 border-blue-200'
                  )}>
                    <div className="flex items-center gap-2 mb-2">
                      {getActionIcon(message.action.type)}
                      <span className="text-sm font-medium">{getActionLabel(message.action.type)}</span>
                      {message.action.status === 'confirmed' && (
                        <Check className="w-4 h-4 text-green-500 ml-auto" />
                      )}
                    </div>

                    <div className="text-sm text-gray-600 space-y-1">
                      {message.action.type === 'todo' && (
                        <>
                          <p>📝 {String(message.action.data.title)}</p>
                          {message.action.data.dueDate && (
                            <p>📅 {String(message.action.data.dueDate)}</p>
                          )}
                        </>
                      )}
                      {message.action.type === 'expense' && (
                        <>
                          <p>💰 ${String(message.action.data.amount)}</p>
                          <p>📁 {String(message.action.data.category)}</p>
                          {message.action.data.description && (
                            <p>📝 {String(message.action.data.description)}</p>
                          )}
                        </>
                      )}
                    </div>

                    {message.action.status === 'pending' && (
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-8 rounded-lg"
                          onClick={() => handleAction(message.id, false)}
                        >
                          {t.cancel}
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 h-8 rounded-lg bg-blue-500"
                          onClick={() => handleAction(message.id, true)}
                        >
                          {t.confirm}
                        </Button>
                      </div>
                    )}

                    {message.action.status === 'confirmed' && (
                      <p className="text-green-600 text-sm mt-2">{t.created}</p>
                    )}
                    {message.action.status === 'cancelled' && (
                      <p className="text-gray-500 text-sm mt-2">{t.cancelled}</p>
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
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder={t.placeholder}
              className="flex-1 h-12 rounded-xl bg-white/50"
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
        </div>
      </GlassCard>
    </div>
  );
}
