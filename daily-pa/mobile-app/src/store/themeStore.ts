import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'ocean' | 'sage' | 'sunset' | 'minimal';

// Unified theme structure - all themes share same UI, only colors differ
export interface ThemeColors {
  // Primary palette
  primary: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;  // Main action color
    600: string;
    700: string;
    800: string;
    900: string;
  };
  // Backgrounds
  background: {
    page: string;
    card: string;
    cardHover: string;
  };
  // Gradient (top to bottom)
  gradient: {
    start: string;
    middle: string;
    end: string;
  };
  // Text
  text: {
    primary: string;
    secondary: string;
    muted: string;
    inverse: string;
  };
  // Borders
  border: {
    default: string;
    light: string;
    card: string;
  };
  // Navigation
  nav: {
    background: string;
    active: string;
    inactive: string;
    aiButtonBg: string;
    aiButtonBorder: string;
  };
  // Status (shared across themes)
  status: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  // Shadows
  shadow: {
    color: string;
    cardOpacity: number;
    fabOpacity: number;
  };
}

// 🌊 Ocean Theme - Soft, gentle blue (updated for better aesthetics)
const oceanColors: ThemeColors = {
  primary: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },
  background: {
    page: '#F8FAFC',
    card: 'rgba(255, 255, 255, 0.95)',
    cardHover: 'rgba(255, 255, 255, 1)',
  },
  gradient: {
    start: '#E0F2FE',
    middle: '#F0F9FF',
    end: '#F8FAFC',
  },
  text: {
    primary: '#1E293B',
    secondary: '#475569',
    muted: '#94A3B8',
    inverse: '#FFFFFF',
  },
  border: {
    default: '#E2E8F0',
    light: '#F1F5F9',
    card: 'rgba(100, 116, 139, 0.1)',
  },
  nav: {
    background: 'rgba(248, 250, 252, 0.95)',
    active: '#3B82F6',
    inactive: '#94A3B8',
    aiButtonBg: '#3B82F6',
    aiButtonBorder: '#2563EB',
  },
  status: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
  shadow: {
    color: '#64748B',
    cardOpacity: 0.06,
    fabOpacity: 0.2,
  },
};

// 🌿 Sage Theme - Natural, balanced, wellness
const sageColors: ThemeColors = {
  primary: {
    50: '#F5F9F8',
    100: '#E8F3F0',
    200: '#C3E0D8',
    300: '#A7D3C7',
    400: '#6BBF9E',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },
  background: {
    page: '#F9F6F0',
    card: 'rgba(255, 255, 255, 0.92)',
    cardHover: 'rgba(255, 255, 255, 1)',
  },
  gradient: {
    start: '#C3E0D8',
    middle: '#D6E8E2',
    end: '#F9F6F0',
  },
  text: {
    primary: '#064E3B',
    secondary: '#047857',
    muted: '#6BBF9E',
    inverse: '#FFFFFF',
  },
  border: {
    default: '#C3E0D8',
    light: '#E8F3F0',
    card: 'rgba(16, 185, 129, 0.12)',
  },
  nav: {
    background: 'rgba(249, 246, 240, 0.95)',
    active: '#10B981',
    inactive: '#A7D3C7',
    aiButtonBg: '#10B981',
    aiButtonBorder: '#059669',
  },
  status: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
  shadow: {
    color: '#10B981',
    cardOpacity: 0.06,
    fabOpacity: 0.25,
  },
};

// 🌅 Sunset Theme - Warm, energetic, passionate
const sunsetColors: ThemeColors = {
  primary: {
    50: '#FFF1F2',
    100: '#FFE4E6',
    200: '#FECDD3',
    300: '#FDA4AF',
    400: '#FB7185',
    500: '#F43F5E',
    600: '#E11D48',
    700: '#BE123C',
    800: '#9F1239',
    900: '#881337',
  },
  background: {
    page: '#FFF5F5',
    card: 'rgba(255, 255, 255, 0.92)',
    cardHover: 'rgba(255, 255, 255, 1)',
  },
  gradient: {
    start: '#FECDD3',
    middle: '#FFE4E6',
    end: '#FFF5F5',
  },
  text: {
    primary: '#881337',
    secondary: '#BE123C',
    muted: '#FDA4AF',
    inverse: '#FFFFFF',
  },
  border: {
    default: '#FECDD3',
    light: '#FFE4E6',
    card: 'rgba(244, 63, 94, 0.12)',
  },
  nav: {
    background: 'rgba(255, 245, 245, 0.95)',
    active: '#F43F5E',
    inactive: '#FDA4AF',
    aiButtonBg: '#F43F5E',
    aiButtonBorder: '#E11D48',
  },
  status: {
    success: '#10B981',
    warning: '#FB923C',
    error: '#EF4444',
    info: '#F43F5E',
  },
  shadow: {
    color: '#F43F5E',
    cardOpacity: 0.08,
    fabOpacity: 0.3,
  },
};

// ⬛ Minimal Theme - Clean B&W, focused, professional
const minimalColors: ThemeColors = {
  primary: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#171717',
    600: '#0A0A0A',
    700: '#000000',
    800: '#000000',
    900: '#000000',
  },
  background: {
    page: '#FFFFFF',
    card: '#FFFFFF',
    cardHover: '#FAFAFA',
  },
  gradient: {
    start: '#FAFAFA',
    middle: '#FFFFFF',
    end: '#FFFFFF',
  },
  text: {
    primary: '#171717',
    secondary: '#525252',
    muted: '#A3A3A3',
    inverse: '#FFFFFF',
  },
  border: {
    default: '#E5E5E5',
    light: '#F5F5F5',
    card: 'rgba(0, 0, 0, 0.06)',
  },
  nav: {
    background: 'rgba(255, 255, 255, 0.98)',
    active: '#171717',
    inactive: '#A3A3A3',
    aiButtonBg: '#171717',
    aiButtonBorder: '#000000',
  },
  status: {
    success: '#22C55E',
    warning: '#EAB308',
    error: '#EF4444',
    info: '#3B82F6',
  },
  shadow: {
    color: '#000000',
    cardOpacity: 0.04,
    fabOpacity: 0.12,
  },
};

// Theme name to colors mapping
const themeColorMap: Record<ThemeMode, ThemeColors> = {
  ocean: oceanColors,
  sage: sageColors,
  sunset: sunsetColors,
  minimal: minimalColors,
};

// Theme display info
export const themeInfo: Record<ThemeMode, { name: string; emoji: string; description: string }> = {
  ocean: { name: 'Ocean', emoji: '🌊', description: 'Deep blue, calm & professional' },
  sage: { name: 'Sage', emoji: '🌿', description: 'Natural, balanced & wellness' },
  sunset: { name: 'Sunset', emoji: '🌅', description: 'Warm, energetic & passionate' },
  minimal: { name: 'Minimal', emoji: '⬛', description: 'Clean B&W, focused & minimal' },
};

interface ThemeState {
  mode: ThemeMode;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'ocean',
      colors: oceanColors,
      setMode: (mode) => {
        set({
          mode,
          colors: themeColorMap[mode],
        });
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Hook to get current theme colors
export const useThemeColors = () => {
  return useThemeStore((state) => state.colors);
};

// Hook to get current theme mode
export const useThemeMode = () => {
  return useThemeStore((state) => state.mode);
};
