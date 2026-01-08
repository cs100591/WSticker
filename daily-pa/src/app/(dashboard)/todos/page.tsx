'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { GlassCard, GlassCardContent } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/lib/i18n';
import { useTodos } from '@/lib/hooks/useTodos';
import { Plus, CheckCircle2, Circle, Trash2, Loader2, StickyNote } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TodoStatus } from '@/types/todo';

type TodoColor = 'yellow' | 'blue' | 'green' | 'pink' | 'purple' | 'orange';

const colorStyles = {
  yellow: {
    bg: 'bg-yellow-100',
    border: 'border-yellow-200',
    text: 'text-yellow-900',
    shadow: 'shadow-yellow-200/50',
    hover: 'hover:shadow-yellow-300/60',
  },
  blue: {
    bg: 'bg-blue-100',
    border: 'border-blue-200',
    text: 'text-blue-900',
    shadow: 'shadow-blue-200/50',
    hover: 'hover:shadow-blue-300/60',
  },
  green: {
    bg: 'bg-green-100',
    border: 'border-green-200',
    text: 'text-green-900',
    shadow: 'shadow-green-200/50',
    hover: 'hover:shadow-green-300/60',
  },
  pink: {
    bg: 'bg-pink-100',
    border: 'border-pink-200',
    text: 'text-pink-900',
    shadow: 'shadow-pink-200/50',
    hover: 'hover:shadow-pink-300/60',
  },
  purple: {
    bg: 'bg-purple-100',
    border: 'border-purple-200',
    text: 'text-purple-900',
    shadow: 'shadow-purple-200/50',
    hover: 'hover:shadow-purple-300/60',
  },
  orange: {
    bg: 'bg-orange-100',
    border: 'border-orange-200',
    text: 'text-orange-900',
    shadow: 'shadow-orange-200/50',
    hover: 'hover:shadow-orange-300/60',
  },
};

const colorOptions: { value: TodoColor; label: string; emoji: string }[] = [
  { value: 'yellow', label: 'Yellow', emoji: '🟡' },
  { value: 'blue', label: 'Blue', emoji: '🔵' },
  { value: 'green', label: 'Green', emoji: '🟢' },
  { value: 'pink', label: 'Pink', emoji: '🩷' },
  { value: 'purple', label: 'Purple', emoji: '🟣' },
  { value: 'orange', label: 'Orange', emoji: '🟠' },
];

export default function TodosPage() {
  const { t } = useI18n();
  const [newTodo, setNewTodo] = useState('');
  const [selectedColor, setSelectedColor] = useState<TodoColor>('yellow');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [colorFilter, setColorFilter] = useState<TodoColor | 'all'>('all');
  
  const { todos, isLoading, createTodo, toggleTodo, deleteTodo } = useTodos({
    filters: { status: filter === 'all' ? 'all' : filter as TodoStatus }
  });

  const handleAddTodo = async () => {
    if (!newTodo.trim()) return;
    try {
      await createTodo({ 
        title: newTodo.trim(), 
        priority: 'medium',
        color: selectedColor 
      });
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

  // Filter by color
  const filteredTodos = colorFilter === 'all' 
    ? todos 
    : todos.filter(t => (t.color || 'yellow') === colorFilter);

  const completedCount = filteredTodos.filter((t) => t.status === 'completed').length;
  const activeCount = filteredTodos.filter((t) => t.status === 'active').length;

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header title={t.todos.title} />
      
      <div className="flex-1 p-4 md:p-6 space-y-6">
        {/* Simple Stats */}
        <div className="flex items-center justify-center gap-8 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-700">{activeCount}</div>
            <p className="text-gray-500">{t.todos.active}</p>
          </div>
          <div className="w-px h-8 bg-gray-300" />
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{completedCount}</div>
            <p className="text-gray-500">{t.todos.completedFilter}</p>
          </div>
        </div>

        {/* Add Todo - Simplified */}
        <GlassCard className="max-w-2xl mx-auto">
          <GlassCardContent className="p-4">
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder={t.todos.addPlaceholder}
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
                  className="flex-1 h-11 rounded-xl bg-white border-gray-200"
                />
                <Button 
                  onClick={handleAddTodo} 
                  size="icon"
                  className="w-11 h-11 rounded-xl bg-blue-500 hover:bg-blue-600"
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
              
              {/* Color Picker */}
              <div className="flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-gray-400" />
                <div className="flex gap-1.5">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setSelectedColor(color.value)}
                      className={cn(
                        'w-8 h-8 rounded-lg border-2 transition-all flex items-center justify-center text-lg',
                        colorStyles[color.value].bg,
                        selectedColor === color.value 
                          ? 'border-gray-800 scale-110' 
                          : 'border-transparent hover:scale-105'
                      )}
                      title={color.label}
                    >
                      {color.emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Filters */}
        <div className="max-w-2xl mx-auto space-y-3">
          {/* Status Filter */}
          <div className="flex gap-2 justify-center">
            {(['all', 'active', 'completed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'px-4 py-1.5 rounded-full text-sm font-medium transition-all',
                  filter === f
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                )}
              >
                {f === 'all' ? t.todos.all : f === 'active' ? t.todos.active : t.todos.completedFilter}
              </button>
            ))}
          </div>

          {/* Color Filter */}
          <div className="flex gap-2 justify-center items-center">
            <button
              onClick={() => setColorFilter('all')}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium transition-all',
                colorFilter === 'all'
                  ? 'bg-gray-700 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              )}
            >
              All Colors
            </button>
            {colorOptions.map((color) => (
              <button
                key={color.value}
                onClick={() => setColorFilter(color.value)}
                className={cn(
                  'w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center',
                  colorStyles[color.value].bg,
                  colorFilter === color.value 
                    ? 'border-gray-800 scale-110' 
                    : 'border-gray-300 hover:scale-105'
                )}
                title={color.label}
              >
                {colorFilter === color.value && <span className="text-xs">✓</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Sticky Notes Grid */}
        <div className="max-w-6xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : filteredTodos.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                <StickyNote className="w-10 h-10 text-gray-300" />
              </div>
              <p className="text-gray-500">{t.todos.noTasks}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredTodos.map((todo) => {
                const todoColor = (todo.color || 'yellow') as TodoColor;
                const styles = colorStyles[todoColor];
                
                return (
                  <div
                    key={todo.id}
                    className={cn(
                      'group relative p-4 rounded-lg border-2 shadow-md transition-all duration-200',
                      'hover:-translate-y-1',
                      styles.bg,
                      styles.border,
                      styles.shadow,
                      styles.hover,
                      todo.status === 'completed' && 'opacity-60'
                    )}
                    style={{
                      transform: `rotate(${Math.random() * 2 - 1}deg)`,
                    }}
                  >
                    {/* Sticky Note Top Shadow */}
                    <div className="absolute -top-2 left-4 right-4 h-4 bg-gray-400/20 rounded-t-lg -z-10" />
                    
                    {/* Content */}
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <button
                          onClick={() => handleToggle(todo.id)}
                          className="flex-shrink-0 mt-0.5 transition-transform hover:scale-110"
                        >
                          {todo.status === 'completed' ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" strokeWidth={2} />
                          ) : (
                            <Circle className="w-5 h-5 text-gray-400 hover:text-gray-600" strokeWidth={2} />
                          )}
                        </button>
                        
                        <p className={cn(
                          'flex-1 text-sm font-medium leading-snug',
                          styles.text,
                          todo.status === 'completed' && 'line-through opacity-60'
                        )}>
                          {todo.title}
                        </p>
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDelete(todo.id)}
                        className="absolute top-2 right-2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 hover:bg-red-50 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
