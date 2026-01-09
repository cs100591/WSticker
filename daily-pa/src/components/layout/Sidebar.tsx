
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
  LayoutDashboard,
  Users,
  Briefcase,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useI18n();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/todos', label: 'Tasks', icon: CheckSquare },
    { href: '/calendar', label: 'Calendar', icon: Calendar },
    { href: '/expenses', label: 'Finances', icon: DollarSign },
    { href: '/reports', label: 'Analytics', icon: BarChart3 },
  ];

  const teamItems = [
    { href: '/team', label: 'Team Space', icon: Users },
    { href: '/projects', label: 'Projects', icon: Briefcase },
  ];

  return (
    <aside className={cn(
      "hidden md:flex flex-col fixed inset-y-0 left-0 bg-slate-900 text-slate-400 transition-all duration-300 z-50",
      isCollapsed ? "w-20" : "w-64"
    )}>
      {/* Sidebar Header */}
      <div className="h-20 flex items-center px-6 border-b border-slate-800/50">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex-shrink-0 w-8 h-8 rounded bg-blue-600 flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <span className="text-lg font-bold text-white tracking-tight whitespace-nowrap">Daily PA</span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-8 px-4 space-y-8 overflow-y-auto">
        {/* Main Nav */}
        <nav className="space-y-1">
          {!isCollapsed && <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Main Menu</p>}
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group',
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                    : 'hover:bg-slate-800 hover:text-white'
                )}
              >
                <Icon className={cn('w-5 h-5 flex-shrink-0', isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300')} />
                {!isCollapsed && <span>{item.label}</span>}
                {isActive && !isCollapsed && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Workspace Nav */}
        <nav className="space-y-1">
          {!isCollapsed && <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Workspace</p>}
          {teamItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group',
                  isActive
                    ? 'bg-slate-800 text-white'
                    : 'hover:bg-slate-800 hover:text-white'
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0 text-slate-500 group-hover:text-slate-300" />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-slate-800/50 space-y-1">
        <Link
          href="/profile"
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-slate-800 hover:text-white group',
            pathname === '/profile' && 'bg-slate-800 text-white'
          )}
        >
          <Settings className="w-5 h-5 flex-shrink-0 text-slate-500 group-hover:text-slate-300" />
          {!isCollapsed && <span>Settings</span>}
        </Link>
        
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-slate-800 hover:text-white group"
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5 mx-auto" /> : (
            <>
              <ChevronLeft className="w-5 h-5 text-slate-500 group-hover:text-slate-300" />
              <span>Collapse Sidebar</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
