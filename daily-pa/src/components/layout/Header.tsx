'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Bell, Home } from 'lucide-react';

interface HeaderProps {
  title?: string;
  showHomeButton?: boolean;
}

export function Header({ title, showHomeButton = true }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 glass border-b border-white/20">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        {/* Title */}
        {title && (
          <h1 className="text-xl font-semibold text-gray-900">
            {title}
          </h1>
        )}

        {/* Right actions - outline style */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Home button - mobile only, outline style */}
          {showHomeButton && (
            <Link href="/dashboard" className="md:hidden">
              <Button
                size="icon"
                variant="outline"
                className="w-10 h-10 rounded-full border-2 border-blue-500 text-blue-500 bg-transparent hover:bg-blue-50 transition-all duration-200"
              >
                <Home className="w-5 h-5" strokeWidth={1.5} />
              </Button>
            </Link>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            className="w-10 h-10 rounded-full text-gray-400 hover:bg-white/50"
          >
            <Bell className="w-5 h-5" strokeWidth={1.5} />
          </Button>
        </div>
      </div>
    </header>
  );
}
