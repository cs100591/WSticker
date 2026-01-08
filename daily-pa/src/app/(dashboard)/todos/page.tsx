'use client';

import { useState, useRef } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/lib/i18n';
import { useTodos } from '@/lib/hooks/useTodos';
import { Plus, CheckCircle2, Circle, Trash2, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TodoColor, TodoPriority } from '@/types/todo';

const priorityColors = {
  high: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-400', label: '高' },
  medium: { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-400', label: '中' },
  low: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-400', label: '低' },
};

const colorEmojis = {
  yellow: '🟡',
  blue: '🔵',
  pink: '🩷',
};

export default function TodosPage() {
  const { t, locale } = useI18n();
  const [newTodo, setNewTodo] = useState('');
  const [selectedColor, setSelectedColor] = useState<TodoColor>('yellow');
  const [selectedPriority, setSelectedPriority] = useState<TodoPriority>('medium');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    high: true,
    medium: true,
    low: false,
    completed: false,
  });
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { todos, isLoading, createTodo, toggleTodo, deleteTodo } = useTodos({});

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    
    try {
      await createTodo({ 
        title: newTodo.trim(), 
        priority: selectedPriority,
        color: selectedColor 
      });
      setNewTodo('');
      inputRef.current?.focus();
    } catch (error) {
      console.error('Failed to create todo:', error);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await toggleTodo(id);
    } catch (error) {
      console.error('Failed to toggle todo:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTodo(id);
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  // Group todos by priority and status
  const activeTodos = todos.filter(t => t.status === 'active');
  const completedTodos = todos.filter(t => t.status === 'completed');
  
  const todosByPriority = {
    high: activeTodos.filter(t => t.priority === 'high'),
    medium: activeTodos.filter(t => t.priority === 'medium'),
    low: activeTodos.filter(t => t.priority === 'low'),
  };

  const totalActive = activeTodos.length;
  const totalCompleted = completedTodos.length;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header title={t.todos.title} />
      
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="max-w-2xl mx-auto p-4 space-y-4">
          {/* Count Header */}
          <div className="flex items-center justify-between px-4 py-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>📋</span>
              <span>{totalActive}/{totalActive + totalCompleted}</span>
            </div>
            <Button 
              onClick={() => setExpandedGroups(prev => ({ ...prev, high: !prev.high, medium: !prev.medium, low: !prev.low }))}
              size="icon"
              variant="ghost"
              className="h-8 w-8"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-center text-gray-800 py-2">
            {t.todos.title}
          </h1>

          {/* Add Todo Form */}
          <form onSubmit={handleAddTodo} className="space-y-3 px-4">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                placeholder={t.todos.addPlaceholder}
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                className="flex-1 h-10 rounded-lg border border-gray-300 text-sm"
              />
              <Button 
                type="submit"
                size="icon"
                className="h-10 w-10 rounded-lg bg-blue-500 hover:bg-blue-600"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Priority and Color Selection */}
            <div className="flex gap-2 items-center">
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value as TodoPriority)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white"
              >
                <option value="high">{priorityColors.high.label}</option>
                <option value="medium">{priorityColors.medium.label}</option>
                <option value="low">{priorityColors.low.label}</option>
              </select>

              <div className="flex gap-1.5">
                {(['yellow', 'blue', 'pink'] as TodoColor[]).map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={cn(
                      'w-8 h-8 rounded-full text-lg transition-all',
                      selectedColor === color ? 'ring-2 ring-offset-1 ring-gray-800 scale-110' : 'opacity-60'
                    )}
                  >
                    {colorEmojis[color]}
                  </button>
                ))}
              </div>
            </div>
          </form>

          {/* Todo Groups */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="space-y-2 px-4">
              {/* High Priority */}
              {todosByPriority.high.length > 0 && (
                <div className="space-y-2">
                  <button
                    onClick={() => toggleGroup('high')}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      priorityColors.high.bg,
                      priorityColors.high.text
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn('w-2 h-2 rounded-full', priorityColors.high.dot)} />
                      <span>{priorityColors.high.label} ({todosByPriority.high.length})</span>
                    </div>
                    {expandedGroups.high ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {expandedGroups.high && (
                    <div className="space-y-1 pl-2">
                      {todosByPriority.high.map(todo => (
                        <TodoItem key={todo.id} todo={todo} onToggle={handleToggle} onDelete={handleDelete} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Medium Priority */}
              {todosByPriority.medium.length > 0 && (
                <div className="space-y-2">
                  <button
                    onClick={() => toggleGroup('medium')}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      priorityColors.medium.bg,
                      priorityColors.medium.text
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn('w-2 h-2 rounded-full', priorityColors.medium.dot)} />
                      <span>{priorityColors.medium.label} ({todosByPriority.medium.length})</span>
                    </div>
                    {expandedGroups.medium ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {expandedGroups.medium && (
                    <div className="space-y-1 pl-2">
                      {todosByPriority.medium.map(todo => (
                        <TodoItem key={todo.id} todo={todo} onToggle={handleToggle} onDelete={handleDelete} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Low Priority */}
              {todosByPriority.low.length > 0 && (
                <div className="space-y-2">
                  <button
                    onClick={() => toggleGroup('low')}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      priorityColors.low.bg,
                      priorityColors.low.text
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn('w-2 h-2 rounded-full', priorityColors.low.dot)} />
                      <span>{priorityColors.low.label} ({todosByPriority.low.length})</span>
                    </div>
                    {expandedGroups.low ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {expandedGroups.low && (
                    <div className="space-y-1 pl-2">
                      {todosByPriority.low.map(todo => (
                        <TodoItem key={todo.id} todo={todo} onToggle={handleToggle} onDelete={handleDelete} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Completed Section */}
              {completedTodos.length > 0 && (
                <div className="space-y-2 mt-4">
                  <button
                    onClick={() => toggleGroup('completed')}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 transition-colors"
                  >
                    <span>{locale === 'zh' ? '已完成' : 'Completed'} ({completedTodos.length})</span>
                    {expandedGroups.completed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {expandedGroups.completed && (
                    <div className="space-y-1 pl-2">
                      {completedTodos.map(todo => (
                        <TodoItem key={todo.id} todo={todo} onToggle={handleToggle} onDelete={handleDelete} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Empty State */}
              {totalActive === 0 && totalCompleted === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">{t.todos.noTasks}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TodoItem({ 
  todo, 
  onToggle, 
  onDelete 
}: { 
  todo: any; 
  onToggle: (id: string) => void; 
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors">
      <button
        onClick={() => onToggle(todo.id)}
        className="flex-shrink-0 flex items-center justify-center"
      >
        {todo.status === 'completed' ? (
          <CheckCircle2 className="w-5 h-5 text-green-600" strokeWidth={2} />
        ) : (
          <Circle className="w-5 h-5 text-gray-400 group-hover:text-gray-600" strokeWidth={2} />
        )}
      </button>
      
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm truncate',
          todo.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-800'
        )}>
          {todo.title}
        </p>
      </div>

      <span className="text-lg flex-shrink-0">
        {colorEmojis[todo.color as TodoColor] || '🟡'}
      </span>

      <button
        onClick={() => onDelete(todo.id)}
        className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-red-600"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
