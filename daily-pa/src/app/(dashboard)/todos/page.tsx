'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/lib/i18n';
import { useTodos } from '@/lib/hooks/useTodos';
import { Plus, CheckCircle2, Circle, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TodoStatus } from '@/types/todo';

type TodoColor = 'yellow' | 'blue' | 'green' | 'pink' | 'purple' | 'orange';

const colorClasses = {
  yellow: 'bg-yellow-400 hover:bg-yellow-500',
  blue: 'bg-blue-400 hover:bg-blue-500',
  green: 'bg-green-400 hover:bg-green-500',
  pink: 'bg-pink-400 hover:bg-pink-500',
  purple: 'bg-purple-400 hover:bg-purple-500',
  orange: 'bg-orange-400 hover:bg-orange-500',
};

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
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header title={t.todos.title} />
      
      <div className="flex-1 p-4 md:p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Stats */}
          <div className="flex items-center justify-center gap-12 py-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-800">{activeCount}</div>
              <p className="text-sm text-gray-500 mt-1">{t.todos.active}</p>
            </div>
            <div className="w-px h-12 bg-gray-300" />
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600">{completedCount}</div>
              <p className="text-sm text-gray-500 mt-1">{t.todos.completedFilter}</p>
            </div>
          </div>

          {/* Add Todo Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="space-y-4">
              <div className="flex gap-3">
                <Input
                  placeholder={t.todos.addPlaceholder}
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
                  className="flex-1 h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
                <Button 
                  onClick={handleAddTodo} 
                  size="icon"
                  className="w-12 h-12 rounded-xl bg-blue-500 hover:bg-blue-600"
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
              
              {/* Color Picker */}
              <div className="flex items-center gap-3">
                <div className="flex gap-2">
                  {(['yellow', 'blue', 'green', 'pink', 'purple', 'orange'] as TodoColor[]).map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={cn(
                        'w-8 h-8 rounded-full transition-all',
                        colorClasses[color],
                        selectedColor === color 
                          ? 'ring-2 ring-offset-2 ring-gray-800 scale-110' 
                          : 'opacity-60 hover:opacity-100'
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="space-y-3">
            {/* Status Filter */}
            <div className="flex gap-2 justify-center">
              {(['all', 'active', 'completed'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    'px-6 py-2 rounded-full text-sm font-medium transition-all',
                    filter === f
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
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
                  'px-4 py-1.5 rounded-full text-xs font-medium transition-all',
                  colorFilter === 'all'
                    ? 'bg-gray-800 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                )}
              >
                All Colors
              </button>
              {(['yellow', 'blue', 'green', 'pink', 'purple', 'orange'] as TodoColor[]).map((color) => (
                <button
                  key={color}
                  onClick={() => setColorFilter(color)}
                  className={cn(
                    'w-8 h-8 rounded-full transition-all',
                    colorClasses[color],
                    colorFilter === color 
                      ? 'ring-2 ring-offset-2 ring-gray-800 scale-110' 
                      : 'opacity-40 hover:opacity-70'
                  )}
                />
              ))}
            </div>
          </div>

          {/* Todo List */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : filteredTodos.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-gray-300" />
                </div>
                <p className="text-gray-500">{t.todos.noTasks}</p>
              </div>
            ) : (
              filteredTodos.map((todo) => {
                const todoColor = (todo.color || 'yellow') as TodoColor;
                
                return (
                  <div
                    key={todo.id}
                    className={cn(
                      'group flex items-center gap-4 p-4 rounded-xl bg-white border-2 transition-all duration-200 hover:shadow-md',
                      todo.status === 'completed' ? 'opacity-50 border-gray-200' : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    {/* Color Indicator */}
                    <div className={cn('w-1 h-10 rounded-full', colorClasses[todoColor])} />
                    
                    {/* Checkbox */}
                    <button
                      onClick={() => handleToggle(todo.id)}
                      className="flex-shrink-0 transition-transform hover:scale-110"
                    >
                      {todo.status === 'completed' ? (
                        <CheckCircle2 className="w-6 h-6 text-green-500" strokeWidth={2} />
                      ) : (
                        <Circle className="w-6 h-6 text-gray-300 hover:text-gray-500" strokeWidth={2} />
                      )}
                    </button>
                    
                    {/* Title */}
                    <p className={cn(
                      'flex-1 text-base font-medium',
                      todo.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-800'
                    )}>
                      {todo.title}
                    </p>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDelete(todo.id)}
                      className="flex-shrink-0 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
