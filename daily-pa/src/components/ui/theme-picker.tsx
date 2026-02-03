'use client';

import { useTheme, themeInfo, ThemeMode } from '@/lib/theme-provider';
import { Check } from 'lucide-react';

export function ThemePicker() {
  const { mode, setMode } = useTheme();
  const themes: ThemeMode[] = ['ocean', 'sage', 'sunset', 'minimal'];

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-[var(--text-secondary)]">Choose Theme</h3>
      <div className="grid grid-cols-2 gap-3">
        {themes.map((theme) => {
          const info = themeInfo[theme];
          const isActive = mode === theme;
          
          return (
            <button
              key={theme}
              onClick={() => setMode(theme)}
              className={`
                relative p-4 rounded-xl border-2 transition-all duration-200 text-left
                ${isActive 
                  ? 'border-[var(--primary)] shadow-lg' 
                  : 'border-[var(--border-card)] hover:border-[var(--border-default)]'
                }
              `}
              style={{ background: 'var(--card)' }}
            >
              {/* Preview Gradient */}
              <div 
                className="h-12 rounded-lg mb-3"
                style={{ 
                  background: `linear-gradient(135deg, ${getPreviewGradient(theme).join(', ')})`,
                }}
              />
              
              {/* Theme Info */}
              <div className="flex items-center gap-2">
                <span className="text-xl">{info.emoji}</span>
                <div>
                  <p className="font-semibold text-sm text-[var(--text-primary)]">{info.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{info.description}</p>
                </div>
              </div>
              
              {/* Active Indicator */}
              {isActive && (
                <div 
                  className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--primary)' }}
                >
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function getPreviewGradient(theme: ThemeMode): string[] {
  switch (theme) {
    case 'ocean': return ['#0EA5E9', '#38BDF8', '#F0F9FF'];
    case 'sage': return ['#C3E0D8', '#D6E8E2', '#F9F6F0'];
    case 'sunset': return ['#FECDD3', '#FFE4E6', '#FFF5F5'];
    case 'minimal': return ['#FAFAFA', '#FFFFFF', '#FFFFFF'];
    default: return ['#F0F9FF', '#FFFFFF'];
  }
}
