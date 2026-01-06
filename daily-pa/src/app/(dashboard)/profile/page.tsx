'use client';

import { Header } from '@/components/layout/Header';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { useI18n, Locale } from '@/lib/i18n';
import { User, Mail, Bell, Moon, Globe, Shield, LogOut, ChevronRight, Smartphone, Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  const { t, locale, setLocale } = useI18n();

  const settingsGroups = [
    {
      title: t.profile.account,
      items: [
        { icon: User, label: t.profile.profileLabel, description: t.profile.profileDesc, gradient: 'from-blue-500 to-cyan-500' },
        { icon: Mail, label: t.profile.email, description: 'dev@example.com', gradient: 'from-green-500 to-emerald-500' },
        { icon: Shield, label: t.profile.security, description: t.profile.securityDesc, gradient: 'from-orange-500 to-red-500' },
      ],
    },
    {
      title: t.profile.preferences,
      items: [
        { icon: Bell, label: t.profile.notifications, description: t.profile.notificationsDesc, gradient: 'from-purple-500 to-violet-500' },
        { icon: Moon, label: t.profile.appearance, description: t.profile.lightMode, gradient: 'from-indigo-500 to-blue-500' },
      ],
    },
    {
      title: t.profile.other,
      items: [
        { icon: Smartphone, label: t.profile.devices, description: t.profile.devicesDesc, gradient: 'from-gray-500 to-slate-500' },
      ],
    },
  ];

  const languages: { code: Locale; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'zh', label: '中文', flag: '🇨🇳' },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Header title={t.profile.title} showVoiceButton={false} />
      
      <div className="flex-1 p-4 md:p-6 space-y-4">
        {/* User Info Card */}
        <GlassCard className="overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-cyan-500/10" />
          <GlassCardContent className="relative">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-blue-500/30">
                D
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">Developer</h2>
                <p className="text-gray-500">dev@example.com</p>
                <span className="inline-flex items-center gap-1 px-2 py-1 mt-2 text-xs font-medium text-orange-600 bg-orange-100 rounded-full">
                  <Sparkles className="w-3 h-3" />
                  Dev Mode
                </span>
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Language Selection */}
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-500" />
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
                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Settings Groups */}
        {settingsGroups.map((group) => (
          <GlassCard key={group.title}>
            <GlassCardHeader>
              <GlassCardTitle>{group.title}</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent className="space-y-2">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-white/50 transition-all duration-200"
                  >
                    <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md', item.gradient)}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-900">{item.label}</p>
                      <p className="text-sm text-gray-500">{item.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
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
        >
          <LogOut className="w-5 h-5 mr-2" />
          {t.profile.signOut}
        </Button>

        {/* App Info */}
        <div className="text-center text-sm text-gray-400 py-6">
          <p className="font-medium">Daily PA v1.0.0</p>
          <p className="mt-1">© 2026 Daily PA Team</p>
        </div>
      </div>
    </div>
  );
}
