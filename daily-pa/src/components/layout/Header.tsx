'use client';

import { Button } from '@/components/ui/button';
import { Bell, Mic } from 'lucide-react';

interface HeaderProps {
  title?: string;
  showVoiceButton?: boolean;
}

export function Header({ title, showVoiceButton = true }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 glass border-b border-white/20">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        {/* Title */}
        {title && (
          <h1 className="text-xl font-semibold text-gray-900">
            {title}
          </h1>
        )}

        {/* Right actions */}
        <div className="flex items-center gap-3 ml-auto">
          {showVoiceButton && (
            <Button
              size="icon"
              className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white border-0 shadow-lg shadow-blue-500/30 transition-all duration-200 hover:scale-105"
            >
              <Mic className="w-5 h-5" />
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            className="w-10 h-10 rounded-full text-gray-500 hover:bg-white/50"
          >
            <Bell className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
