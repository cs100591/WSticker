'use client';

import { Header } from '@/components/layout/Header';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Palette } from 'lucide-react';
import Link from 'next/link';
import { ThemePicker } from '@/components/ui/theme-picker';
import { useTheme } from '@/lib/theme-provider';

export default function AppearancePage() {
  const { mode } = useTheme();

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

        {/* Theme Selection - Unified with Mobile App */}
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" style={{ color: 'var(--primary)' }} strokeWidth={1.5} />
              Theme
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <ThemePicker />
            <div className="mt-4 p-3 rounded-xl text-sm" style={{ 
              background: 'var(--border-light)',
              color: 'var(--text-secondary)'
            }}>
              <strong>Current Theme: </strong>
              {mode === 'ocean' && '🌊 Ocean - Deep blue, calm & professional'}
              {mode === 'sage' && '🌿 Sage - Natural, balanced & wellness'}
              {mode === 'sunset' && '🌅 Sunset - Warm, energetic & passionate'}
              {mode === 'minimal' && '⬛ Minimal - Clean B&W, focused & minimal'}
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Sync Note */}
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Cross-Device Sync</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Your theme preference will sync across all devices - 
              mobile app and web. Changes are saved automatically.
            </p>
          </GlassCardContent>
        </GlassCard>
      </div>
    </div>
  );
}
