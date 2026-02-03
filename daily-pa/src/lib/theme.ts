/**
 * Theme System - Unified with Mobile App
 * Four themes: Ocean, Sage, Sunset, Minimal
 */

export type ThemeMode = 'ocean' | 'sage' | 'sunset' | 'minimal';

export interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  background: string;
  backgroundGradient: string[];
  card: string;
  cardHover: string;
  text: {
    primary: string;
    secondary: string;
    muted: string;
    inverse: string;
  };
  border: {
    default: string;
    light: string;
    card: string;
  };
  nav: {
    background: string;
    active: string;
    inactive: string;
  };
  status: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  shadow: {
    card: string;
    button: string;
  };
}

export const themes: Record<ThemeMode, ThemeColors> = {
  ocean: {
    primary: '#0EA5E9',
    primaryLight: '#38BDF8',
    primaryDark: '#0284C7',
    background: '#F0F9FF',
    backgroundGradient: ['#0EA5E9', '#38BDF8', '#F0F9FF'],
    card: 'rgba(255, 255, 255, 0.9)',
    cardHover: 'rgba(255, 255, 255, 1)',
    text: {
      primary: '#0C4A6E',
      secondary: '#0369A1',
      muted: '#7DD3FC',
      inverse: '#FFFFFF',
    },
    border: {
      default: '#BAE6FD',
      light: '#E0F2FE',
      card: 'rgba(14, 165, 233, 0.15)',
    },
    nav: {
      background: 'rgba(240, 249, 255, 0.95)',
      active: '#0EA5E9',
      inactive: '#7DD3FC',
    },
    status: {
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#0EA5E9',
    },
    shadow: {
      card: '0 4px 20px rgba(14, 165, 233, 0.08)',
      button: '0 4px 14px rgba(14, 165, 233, 0.25)',
    },
  },
  sage: {
    primary: '#10B981',
    primaryLight: '#34D399',
    primaryDark: '#059669',
    background: '#F9F6F0',
    backgroundGradient: ['#C3E0D8', '#D6E8E2', '#F9F6F0'],
    card: 'rgba(255, 255, 255, 0.92)',
    cardHover: 'rgba(255, 255, 255, 1)',
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
    },
    status: {
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
    },
    shadow: {
      card: '0 4px 20px rgba(16, 185, 129, 0.06)',
      button: '0 4px 14px rgba(16, 185, 129, 0.25)',
    },
  },
  sunset: {
    primary: '#F43F5E',
    primaryLight: '#FB7185',
    primaryDark: '#E11D48',
    background: '#FFF5F5',
    backgroundGradient: ['#FECDD3', '#FFE4E6', '#FFF5F5'],
    card: 'rgba(255, 255, 255, 0.92)',
    cardHover: 'rgba(255, 255, 255, 1)',
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
    },
    status: {
      success: '#10B981',
      warning: '#FB923C',
      error: '#EF4444',
      info: '#F43F5E',
    },
    shadow: {
      card: '0 4px 20px rgba(244, 63, 94, 0.08)',
      button: '0 4px 14px rgba(244, 63, 94, 0.25)',
    },
  },
  minimal: {
    primary: '#171717',
    primaryLight: '#525252',
    primaryDark: '#000000',
    background: '#FFFFFF',
    backgroundGradient: ['#FAFAFA', '#FFFFFF', '#FFFFFF'],
    card: '#FFFFFF',
    cardHover: '#FAFAFA',
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
    },
    status: {
      success: '#22C55E',
      warning: '#EAB308',
      error: '#EF4444',
      info: '#3B82F6',
    },
    shadow: {
      card: '0 2px 8px rgba(0, 0, 0, 0.04)',
      button: '0 2px 8px rgba(0, 0, 0, 0.12)',
    },
  },
};

export const themeInfo: Record<ThemeMode, { name: string; emoji: string; description: string }> = {
  ocean: { name: 'Ocean', emoji: '🌊', description: 'Deep blue, calm & professional' },
  sage: { name: 'Sage', emoji: '🌿', description: 'Natural, balanced & wellness' },
  sunset: { name: 'Sunset', emoji: '🌅', description: 'Warm, energetic & passionate' },
  minimal: { name: 'Minimal', emoji: '⬛', description: 'Clean B&W, focused & minimal' },
};

// CSS Variable generator for Tailwind
export function generateCSSVariables(mode: ThemeMode): Record<string, string> {
  const t = themes[mode];
  return {
    '--primary': t.primary,
    '--primary-light': t.primaryLight,
    '--primary-dark': t.primaryDark,
    '--background': t.background,
    '--card': t.card,
    '--card-hover': t.cardHover,
    '--text-primary': t.text.primary,
    '--text-secondary': t.text.secondary,
    '--text-muted': t.text.muted,
    '--text-inverse': t.text.inverse,
    '--border-default': t.border.default,
    '--border-light': t.border.light,
    '--border-card': t.border.card,
    '--nav-bg': t.nav.background,
    '--nav-active': t.nav.active,
    '--nav-inactive': t.nav.inactive,
    '--status-success': t.status.success,
    '--status-warning': t.status.warning,
    '--status-error': t.status.error,
    '--status-info': t.status.info,
    '--shadow-card': t.shadow.card,
    '--shadow-button': t.shadow.button,
  };
}
