'use client';

import { useState } from 'react';
import { useVoiceAssistant } from '@/lib/hooks/useVoiceAssistant';
import { useTodos } from '@/lib/hooks/useTodos';
import { useExpenses } from '@/lib/hooks/useExpenses';
import { useI18n } from '@/lib/i18n';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2, Check, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExpenseCategory } from '@/types/expense';

interface VoiceAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VoiceAssistant({ isOpen, onClose }: VoiceAssistantProps) {
  const { t } = useI18n();
  const {
    isListening,
    isProcessing,
    transcript,
    error,
    parsedIntent,
    isSupported,
    startListening,
    stopListening,
    reset,
  } = useVoiceAssistant();

  const { createTodo } = useTodos();
  const { createExpense } = useExpenses();
  const [isCreating, setIsCreating] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!parsedIntent || parsedIntent.type === 'unknown') return;

    setIsCreating(true);
    try {
      if (parsedIntent.type === 'create_todo') {
        const todoInput: Parameters<typeof createTodo>[0] = {
          title: parsedIntent.data.title || transcript,
          priority: parsedIntent.data.priority || 'medium',
        };
        if (parsedIntent.data.dueDate) {
          todoInput.dueDate = parsedIntent.data.dueDate;
        }
        await createTodo(todoInput);
      } else if (parsedIntent.type === 'create_expense') {
        await createExpense({
          amount: parsedIntent.data.amount || 0,
          category: (parsedIntent.data.category as ExpenseCategory) || 'other',
          description: parsedIntent.data.description ?? transcript,
          expenseDate: new Date().toISOString().split('T')[0] as string,
        });
      }
      setSuccess(true);
      setTimeout(() => {
        onClose();
        reset();
        setSuccess(false);
      }, 1500);
    } catch {
      // Error handled
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    reset();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/50 backdrop-blur-sm">
      <GlassCard className="w-full max-w-md mb-20 animate-in slide-in-from-bottom duration-300">
        <GlassCardHeader className="flex flex-row items-center justify-between">
          <GlassCardTitle>{t.voice?.title || 'Voice Assistant'}</GlassCardTitle>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </GlassCardHeader>
        <GlassCardContent className="space-y-4">
          {!isSupported ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 mx-auto text-yellow-500 mb-4" />
              <p className="text-gray-600">{t.voice?.notSupported || 'Voice input not supported in this browser'}</p>
            </div>
          ) : success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-green-600 font-medium">{t.voice?.success || 'Created successfully!'}</p>
            </div>
          ) : (
            <>
              {/* 录音按钮 */}
              <div className="flex justify-center">
                <button
                  onClick={isListening ? stopListening : startListening}
                  disabled={isProcessing}
                  className={cn(
                    'w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300',
                    isListening
                      ? 'bg-red-500 animate-pulse shadow-lg shadow-red-500/50'
                      : 'bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30 hover:scale-105'
                  )}
                >
                  {isProcessing ? (
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  ) : isListening ? (
                    <MicOff className="w-8 h-8 text-white" />
                  ) : (
                    <Mic className="w-8 h-8 text-white" />
                  )}
                </button>
              </div>

              {/* 状态提示 */}
              <p className="text-center text-sm text-gray-500">
                {isListening
                  ? t.voice?.listening || 'Listening...'
                  : isProcessing
                  ? t.voice?.processing || 'Processing...'
                  : t.voice?.tapToSpeak || 'Tap to speak'}
              </p>

              {/* 转录文本 */}
              {transcript && (
                <div className="p-4 bg-white/50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">{t.voice?.youSaid || 'You said:'}</p>
                  <p className="font-medium">{transcript}</p>
                </div>
              )}

              {/* 错误提示 */}
              {error && (
                <div className="p-4 bg-red-50 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}

              {/* 解析结果 */}
              {parsedIntent && parsedIntent.type !== 'unknown' && (
                <div className="p-4 bg-blue-50 rounded-xl space-y-2">
                  <p className="text-sm text-blue-600 font-medium">
                    {parsedIntent.type === 'create_todo'
                      ? t.voice?.willCreateTodo || 'Will create todo:'
                      : t.voice?.willCreateExpense || 'Will record expense:'}
                  </p>
                  {parsedIntent.type === 'create_todo' && (
                    <div className="text-sm">
                      <p><span className="text-gray-500">{t.todos?.title || 'Title'}:</span> {parsedIntent.data.title}</p>
                      <p><span className="text-gray-500">{t.todos?.priority || 'Priority'}:</span> {parsedIntent.data.priority}</p>
                      {parsedIntent.data.dueDate && (
                        <p><span className="text-gray-500">Due:</span> {parsedIntent.data.dueDate}</p>
                      )}
                    </div>
                  )}
                  {parsedIntent.type === 'create_expense' && (
                    <div className="text-sm">
                      <p><span className="text-gray-500">{t.expenses?.amount || 'Amount'}:</span> ${parsedIntent.data.amount}</p>
                      <p><span className="text-gray-500">{t.expenses?.category || 'Category'}:</span> {parsedIntent.data.category}</p>
                      <p><span className="text-gray-500">{t.expenses?.description || 'Description'}:</span> {parsedIntent.data.description}</p>
                    </div>
                  )}
                </div>
              )}

              {/* 操作按钮 */}
              {parsedIntent && parsedIntent.type !== 'unknown' && (
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 h-12 rounded-xl"
                    onClick={handleCancel}
                    disabled={isCreating}
                  >
                    {t.voice?.cancel || 'Cancel'}
                  </Button>
                  <Button
                    className="flex-1 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500"
                    onClick={handleConfirm}
                    disabled={isCreating}
                  >
                    {isCreating ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      t.voice?.confirm || 'Confirm'
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}
