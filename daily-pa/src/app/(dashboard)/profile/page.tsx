'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { useI18n, Locale } from '@/lib/i18n';
import { User, Mail, Bell, Moon, Globe, Shield, LogOut, ChevronRight, Smartphone, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { signOut } from '@/lib/auth/actions';

interface UserProfile {
  email: string;
  fullName?: string;
  avatarUrl?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { t, locale, setLocale } = useI18n();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const res = await fetch('/api/user/profile');
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
      setIsSigningOut(false);
    }
  };

  const getInitials = (email: string, name?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email[0].toUpperCase();
  };

  const settingsGroups = [
    {
      title: t.profile.account,
      items: [
        { icon: User, label: t.profile.profileLabel, description: t.profile.profileDesc, color: 'blue', href: '/profile/edit' },
        { icon: Mail, label: t.profile.email, description: user?.email || 'Loading...', color: 'green', href: null },
        { icon: Shield, label: t.profile.security, description: t.profile.securityDesc, color: 'orange', href: '/profile/security' },
      ],
    },
    {
      title: t.profile.preferences,
      items: [
        { icon: Bell, label: t.profile.notifications, description: t.profile.notificationsDesc, color: 'purple', href: '/profile/notifications' },
        { icon: Moon, label: t.profile.appearance, description: t.profile.lightMode, color: 'indigo', href: '/profile/appearance' },
      ],
    },
    {
      title: t.profile.other,
      items: [
        { icon: Smartphone, label: t.profile.devices, description: t.profile.devicesDesc, color: 'gray', href: '/profile/devices' },
      ],
    },
  ];

  const colorMap: Record<string, string> = {
    blue: 'border-blue-500 text-blue-500',
    green: 'border-green-500 text-green-500',
    orange: 'border-orange-500 text-orange-500',
    purple: 'border-purple-500 text-purple-500',
    indigo: 'border-indigo-500 text-indigo-500',
    gray: 'border-gray-400 text-gray-400',
  };

  const languages: { code: Locale; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'zh', label: '中文', flag: '🇨🇳' },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Header title={t.profile.title} showHomeButton={false} />
      
      <div className="flex-1 p-4 md:p-6 space-y-4">
        {/* User Info Card */}
        <GlassCard className="overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-cyan-500/10" />
          <GlassCardContent className="relative">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" strokeWidth={1.5} />
              </div>
            ) : user ? (
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl border-2 border-blue-500 flex items-center justify-center text-blue-500 text-3xl font-bold bg-blue-50">
                  {getInitials(user.email, user.fullName)}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {user.fullName || 'User'}
                  </h2>
                  <p className="text-gray-500">{user.email}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                Failed to load profile
              </div>
            )}
          </GlassCardContent>
        </GlassCard>

        {/* Language Selection */}
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-500" strokeWidth={1.5} />
              {t.profile.language}
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="grid grid-cols-2 gap-3">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLocale(lang.code)}
                  className={cn(
                    'flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200',
                    locale === lang.code
                      ? 'border-blue-500 bg-blue-50 scale-[1.02]'
                      : 'border-white/30 bg-white/30 hover:bg-white/50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{lang.flag}</span>
                    <span className="font-medium">{lang.label}</span>
                  </div>
                  {locale === lang.code && (
                    <div className="w-6 h-6 rounded-full border-2 border-blue-500 flex items-center justify-center">
                      <Check className="w-4 h-4 text-blue-500" strokeWidth={2} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Settings Groups - Outline Icons */}
        {settingsGroups.map((group) => (
          <GlassCard key={group.title}>
            <GlassCardHeader>
              <GlassCardTitle>{group.title}</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent className="space-y-2">
              {group.items.map((item) => {
                const Icon = item.icon;
                const content = (
                  <>
                    <div className={cn('w-12 h-12 rounded-xl border-2 flex items-center justify-center', colorMap[item.color])}>
                      <Icon className="w-6 h-6" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-900">{item.label}</p>
                      <p className="text-sm text-gray-500">{item.description}</p>
                    </div>
                    {item.href && <ChevronRight className="w-5 h-5 text-gray-400" strokeWidth={1.5} />}
                  </>
                );

                return item.href ? (
                  <Link key={item.label} href={item.href}>
                    <button className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-white/50 transition-all duration-200">
                      {content}
                    </button>
                  </Link>
                ) : (
                  <button
                    key={item.label}
                    className="w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200 opacity-50 cursor-not-allowed"
                    disabled
                  >
                    {content}
                  </button>
                );
              })}
            </GlassCardContent>
          </GlassCard>
        ))}

        {/* Logout Button */}
        <Button 
          variant="outline" 
          className="w-full h-14 rounded-2xl text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
          onClick={handleSignOut}
          disabled={isSigningOut}
        >
          {isSigningOut ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" strokeWidth={1.5} />
              Signing out...
            </>
          ) : (
            <>
              <LogOut className="w-5 h-5 mr-2" strokeWidth={1.5} />
              {t.profile.signOut}
            </>
          )}
        </Button>

        {/* App Info */}
        <div className="text-center text-sm text-gray-400 py-6">
          <p className="font-medium">CLASP v1.0.0</p>
          <p className="mt-1">© 2026 CLASP Team</p>
        </div>
      </div>
    </div>
  );
}
