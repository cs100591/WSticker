'use client';

import { Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIAssistantFABProps {
  onClick: () => void;
  isOpen: boolean;
}

export function AIAssistantFAB({ onClick, isOpen }: AIAssistantFABProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'hidden sm:flex', // Hide on mobile, show on tablet+
        'fixed bottom-6 right-6 z-40',
        'w-14 h-14 rounded-full',
        'items-center justify-center',
        'bg-white/80 backdrop-blur-xl',
        'border border-white/20',
        'shadow-lg shadow-black/10',
        'transition-all duration-300 ease-out',
        'hover:scale-105 hover:shadow-xl hover:shadow-black/15',
        'active:scale-95',
        isOpen && 'bg-gray-100/90'
      )}
      aria-label={isOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
    >
      <div className={cn(
        'transition-all duration-300',
        isOpen ? 'rotate-90' : 'rotate-0'
      )}>
        {isOpen ? (
          <X className="w-6 h-6 text-gray-600" strokeWidth={1.5} />
        ) : (
          <Sparkles className="w-6 h-6 text-blue-500" strokeWidth={1.5} />
        )}
      </div>
    </button>
  );
}
