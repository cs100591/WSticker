'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sun, Moon, Monitor, Palette, Check, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type Theme = 'light' | 'dark' | 'system';
type AccentColor = 'blue' | 'purple' | 'green' | 'orange' | 'pink';

interface AppearanceSettings {
  theme: Theme;
  accentColor: AccentColor;
}

export default function AppearancePage() {
  const [settings, setSettings] = useState<AppearanceSettings>({
    theme: 'light',
    accentColor: 'blue',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/user/appearance');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Failed to fetch appearance settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSuccess(false);

    try {
      const res = await fetch('/api/user/appearance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Failed to save appearance settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const themes: { value: Theme; icon: typeof Sun; label: string; description: string }[] = [
    { value: 'light', icon: Sun, label: 'Light Mode', description: 'Clean and bright interface' },
    { value: 'dark', icon: Moon, label: 'Dark Mode', description: 'Easy on the eyes' },
    { value: 'system', icon: Monitor, label: 'System', description: 'Follow system preference' },
  ];

  const accentColors: { value: AccentColor; color: string; gradient: string }[] = [
    { value: 'blue', color: 'bg-blue-500', gradient: 'from-blue-500 to-cyan-500' },
    { value: 'purple', color: 'bg-purple-500', gradient: 'from-purple-500 to-violet-500' },
    { value: 'green', color: 'bg-green-500', gradient: 'from-green-500 to-emerald-500' },
    { value: 'orange', color: 'bg-orange-500', gradient: 'from-orange-500 to-amber-500' },
    { value: 'pink', color: 'bg-pink-500', gradient: 'from-pink-500 to-rose-500' },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Header 
        title="Appearance" 
        showHomeButton={false}
      />
      
      <div className="flex-1 p-4 md:p-6 space-y-4">
        {/* Back Button */}
        <Link href="/profile">
          <Button variant="ghost" size="sm" className="rounded-xl -ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" strokeWidth={1.5} />
            Back to Profile
          </Button>
        </Link>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" strokeWidth={1.5} />
          </div>
        ) : (
          <>
            {/* Theme Selection */}
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle className="flex items-center gap-2">
                  <Moon className="w-5 h-5 text-indigo-500" strokeWidth={1.5} />
                  Theme
                </GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent className="space-y-3">
                {themes.map((theme) => {
                  const Icon = theme.icon;
                  const isSelected = settings.theme === theme.value;
                  return (
                    <button
                      key={theme.value}
                      onClick={() => setSettings(prev => ({ ...prev, theme: theme.value }))}
                      className={cn(
                        'w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200',
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50 scale-[1.02]'
                          : 'border-white/30 bg-white/30 hover:bg-white/50'
                      )}
                    >
                      <div className={cn(
                        'w-12 h-12 rounded-xl border-2 flex items-center justify-center',
                        isSelected ? 'border-indigo-500 text-indigo-500' : 'border-gray-300 text-gray-400'
                      )}>
                        <Icon className="w-6 h-6" strokeWidth={1.5} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-gray-900">{theme.label}</p>
                        <p className="text-sm text-gray-500">{theme.description}</p>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" strokeWidth={2} />
                        </div>
                      )}
                    </button>
                  );
                })}
                <div className="p-3 bg-yellow-50 rounded-xl">
                  <p className="text-sm text-yellow-700">
                    <strong>Note:</strong> Dark mode is coming soon! Currently only Light mode is available.
                  </p>
                </div>
              </GlassCardContent>
            </GlassCard>

            {/* Accent Color */}
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-purple-500" strokeWidth={1.5} />
                  Accent Color
                </GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="grid grid-cols-5 gap-3">
                  {accentColors.map((color) => {
                    const isSelected = settings.accentColor === color.value;
                    return (
                      <button
                        key={color.value}
                        onClick={() => setSettings(prev => ({ ...prev, accentColor: color.value }))}
                        className={cn(
                          'aspect-square rounded-xl transition-all duration-200',
                          `bg-gradient-to-br ${color.gradient}`,
                          isSelected ? 'ring-4 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'
                        )}
                      >
                        {isSelected && (
                          <div className="w-full h-full flex items-center justify-center">
                            <Check className="w-6 h-6 text-white" strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  Choose your preferred accent color for buttons and highlights
                </p>
              </GlassCardContent>
            </GlassCard>

            {success && (
              <div className="p-3 text-sm text-green-500 bg-green-50 rounded-xl text-center">
                Appearance settings saved successfully!
              </div>
            )}

            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" strokeWidth={1.5} />
                  Saving...
                </>
              ) : (
                <>
                  <Palette className="w-5 h-5 mr-2" strokeWidth={1.5} />
                  Save Appearance Settings
                </>
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
