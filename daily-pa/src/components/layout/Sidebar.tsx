'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import {
  CheckSquare,
  Calendar,
  DollarSign,
  BarChart3,
  Settings,
  Home,
  Sparkles,
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useI18n();

  const navItems = [
    { href: '/dashboard', label: t.nav.home, icon: Home },
    { href: '/todos', label: t.nav.todos, icon: CheckSquare },
    { href: '/calendar', label: t.nav.calendar, icon: Calendar },
    { href: '/expenses', label: t.nav.expenses, icon: DollarSign },
    { href: '/reports', label: t.nav.reports, icon: BarChart3 },
  ];

  const bottomNavItems = [
    { href: '/profile', label: t.nav.settings, icon: Settings },
  ];

  return (
    <aside className="hidden md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 glass-sidebar">
      {/* Logo */}
      <div className="flex items-center h-20 px-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold text-gradient">CLASP</span>
            <p className="text-xs text-gray-400">Your AI Assistant</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-white/80 text-blue-600 shadow-lg shadow-blue-500/10 backdrop-blur-sm'
                  : 'text-gray-600 hover:bg-white/50 hover:text-gray-900'
              )}
            >
              <Icon className={cn('w-5 h-5', isActive && 'text-blue-500')} />
              {item.label}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="px-4 py-6 border-t border-white/20">
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-white/80 text-blue-600 shadow-lg backdrop-blur-sm'
                  : 'text-gray-600 hover:bg-white/50 hover:text-gray-900'
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
