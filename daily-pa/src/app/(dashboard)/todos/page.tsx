'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/lib/i18n';
import { useTodos } from '@/lib/hooks/useTodos';
import { Plus, CheckCircle2, Circle, Trash2, Calendar, Flag, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TodoStatus, TodoPriority } from '@/types/todo';

const priorityColors = {
  low: 'text-gray-400',
  medium: 'text-yellow-500',
  high: 'text-red-500',
};

const priorityBg = {
  low: 'bg-gray-100',
  medium: 'bg-yellow-100',
  high: 'bg-red-100',
};

export default function TodosPage() {
  const { t } = useI18n();
  const [newTodo, setNewTodo] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  
  const { todos, isLoading, createTodo, toggleTodo, deleteTodo } = useTodos({
    filters: { status: filter === 'all' ? 'all' : filter as TodoStatus }
  });

  const priorityLabels = {
    low: t.todos.low,
    medium: t.todos.medium,
    high: t.todos.high,
  };

  const handleAddTodo = async () => {
    if (!newTodo.trim()) return;
    try {
      await createTodo({ title: newTodo.trim(), priority: 'medium' });
      setNewTodo('');
    } catch {
      // Error handled in hook
    }
  };

  const handleToggle = async (id: string) => {
    await toggleTodo(id);
  };

  const handleDelete = async (id: string) => {
    await deleteTodo(id);
  };

  const completedCount = todos.filter((t) => t.status === 'completed').length;
  const activeCount = todos.filter((t) => t.status === 'active').length;

  const formatDate = (date: Date | null) => {
    if (!date) return null;
    return new Date(date).toISOString().split('T')[0];
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header title={t.todos.title} />
      
      <div className="flex-1 p-4 md:p-6 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <GlassCard className="text-center py-4">
            <div className="text-3xl font-bold text-gradient">{todos.length}</div>
            <p className="text-xs text-gray-500 mt-1">{t.todos.total}</p>
          </GlassCard>
          <GlassCard className="text-center py-4">
            <div className="text-3xl font-bold text-orange-500">{activeCount}</div>
            <p className="text-xs text-gray-500 mt-1">{t.todos.active}</p>
          </GlassCard>
          <GlassCard className="text-center py-4">
            <div className="text-3xl font-bold text-green-500">{completedCount}</div>
            <p className="text-xs text-gray-500 mt-1">{t.todos.completedFilter}</p>
          </GlassCard>
        </div>

        {/* Add Todo */}
        <GlassCard>
          <GlassCardContent>
            <div className="flex gap-3">
              <Input
                placeholder={t.todos.addPlaceholder}
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
                className="flex-1 h-12 rounded-xl bg-white/50 border-white/30 focus:bg-white/80"
              />
              <Button 
                onClick={handleAddTodo} 
                size="icon"
                className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg shadow-blue-500/30"
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Filter Tabs */}
        <div className="flex gap-2 p-1 bg-white/50 backdrop-blur-sm rounded-xl">
          {(['all', 'active', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200',
                filter === f
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {f === 'all' ? t.todos.all : f === 'active' ? t.todos.active : t.todos.completedFilter}
            </button>
          ))}
        </div>

        {/* Todo List */}
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>{t.todos.taskList}</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : todos.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-gray-500">{t.todos.noTasks}</p>
              </div>
            ) : (
              todos.map((todo) => (
                <div
                  key={todo.id}
                  className={cn(
                    'flex items-center gap-4 p-4 rounded-xl transition-all duration-200',
                    todo.status === 'completed'
                      ? 'bg-gray-50/50' 
                      : 'bg-white/50 hover:bg-white/80 shadow-sm'
                  )}
                >
                  <button
                    onClick={() => handleToggle(todo.id)}
                    className="flex-shrink-0 transition-transform duration-200 hover:scale-110"
                  >
                    {todo.status === 'completed' ? (
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                    ) : (
                      <Circle className="w-6 h-6 text-gray-300 hover:text-blue-500" />
                    )}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'font-medium truncate',
                      todo.status === 'completed' && 'line-through text-gray-400'
                    )}>
                      {todo.title}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                        priorityBg[todo.priority as TodoPriority],
                        priorityColors[todo.priority as TodoPriority]
                      )}>
                        <Flag className="w-3 h-3" />
                        {priorityLabels[todo.priority as TodoPriority]}
                      </span>
                      {todo.dueDate && (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                          <Calendar className="w-3 h-3" />
                          {formatDate(todo.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(todo.id)}
                    className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </GlassCardContent>
        </GlassCard>
      </div>
    </div>
  );
}
