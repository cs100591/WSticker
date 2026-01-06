'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import {
  CheckSquare,
  Calendar,
  DollarSign,
  Home,
  User,
} from 'lucide-react';

export function MobileNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  const navItems = [
    { href: '/dashboard', label: t.nav.home, icon: Home },
    { href: '/todos', label: t.nav.todos, icon: CheckSquare },
    { href: '/calendar', label: t.nav.calendar, icon: Calendar },
    { href: '/expenses', label: t.nav.expenses, icon: DollarSign },
    { href: '/profile', label: t.nav.profile, icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-nav safe-area-inset-bottom z-50">
      <div className="flex items-center justify-around h-20 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 py-2 transition-all duration-200',
                isActive ? 'text-blue-600' : 'text-gray-400'
              )}
            >
              <div className={cn(
                'p-2 rounded-xl transition-all duration-200',
                isActive && 'bg-blue-500/10'
              )}>
                <Icon className={cn(
                  'w-6 h-6 transition-transform duration-200',
                  isActive && 'scale-110'
                )} />
              </div>
              <span className={cn(
                'text-xs mt-1 font-medium',
                isActive ? 'text-blue-600' : 'text-gray-500'
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
