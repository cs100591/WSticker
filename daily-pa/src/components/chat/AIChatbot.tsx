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

  const { createTodo } = useTodos();
  const { createExpense } = useExpenses();

  const t = {
    title: locale === 'zh' ? '✨ AI 助手' : '✨ AI Assistant',
    placeholder: locale === 'zh' ? '告诉我你想做什么...' : 'Tell me what you want to do...',
    greeting: locale === 'zh' 
      ? '你好！我是你的 AI 助手 👋\n\n我可以帮你：\n• 创建待办事项\n• 记录消费\n• 添加日历事件\n\n试试说："明天上午9点开会，下午3点见客户"'
      : 'Hi! I\'m your AI assistant 👋\n\nI can help you:\n• Create todos\n• Record expenses\n• Add calendar events\n\nTry: "Meeting at 9am and lunch with client at noon tomorrow"',
    confirm: locale === 'zh' ? '确认' : 'Confirm',
    cancel: locale === 'zh' ? '取消' : 'Cancel',
    confirmAll: locale === 'zh' ? '全部确认' : 'Confirm All',
    created: locale === 'zh' ? '已创建！' : 'Created!',
    cancelled: locale === 'zh' ? '已取消' : 'Cancelled',
  };

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

  const executeAction = async (action: ActionItem): Promise<boolean> => {
    try {
      const { type, data } = action;

      if (type === 'todo') {
        await createTodo({
          title: data.title as string,
          priority: (data.priority as 'low' | 'medium' | 'high') || 'medium',
          dueDate: data.dueDate as string | undefined,
        });
      } else if (type === 'expense') {
        const amount = typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount as number;
        const today = new Date().toISOString().split('T')[0] as string;
        const expenseDate = (data.date as string) || today;
        await createExpense({
          amount: amount,
          category: (data.category as ExpenseCategory) || 'other',
          description: data.description as string || '',
          expenseDate: expenseDate,
        });
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
        if (!res.ok) throw new Error('Failed to create calendar event');
      }
      return true;
    } catch (error) {
      console.error('Action error:', error);
      return false;
    }
  };

  const handleAction = async (messageId: string, actionId: string, confirm: boolean) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== messageId || !m.actions) return m;
      return {
        ...m,
        actions: m.actions.map(a => 
          a.id === actionId ? { ...a, status: confirm ? 'pending' : 'cancelled' as const } : a
        ),
      };
    }));

    if (!confirm) return;

    const message = messages.find(m => m.id === messageId);
    const action = message?.actions?.find(a => a.id === actionId);
    if (!action) return;

    const success = await executeAction(action);
    
    setMessages(prev => prev.map(m => {
      if (m.id !== messageId || !m.actions) return m;
      return {
        ...m,
        actions: m.actions.map(a => 
          a.id === actionId ? { ...a, status: success ? 'confirmed' : 'pending' as const } : a
        ),
      };
    }));

    if (!success) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: locale === 'zh' ? '抱歉，保存失败了。请再试一次。' : 'Sorry, failed to save. Please try again.',
      }]);
    }
  };

  const handleConfirmAll = async (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message?.actions) return;

    const pendingActions = message.actions.filter(a => a.status === 'pending');
    
    for (const action of pendingActions) {
      const success = await executeAction(action);
      setMessages(prev => prev.map(m => {
        if (m.id !== messageId || !m.actions) return m;
        return {
          ...m,
          actions: m.actions.map(a => 
            a.id === action.id ? { ...a, status: success ? 'confirmed' : 'pending' as const } : a
          ),
        };
      }));
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
