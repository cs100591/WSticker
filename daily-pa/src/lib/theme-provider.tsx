'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeMode, ThemeColors, themes, themeInfo, generateCSSVariables } from './theme';

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  colors: ThemeColors;
  isGlassy: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'daily-pa-theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('ocean');
  const [mounted, setMounted] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (saved && themes[saved]) {
      setModeState(saved);
    }
    setMounted(true);
  }, []);

  // Save theme to localStorage
  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem(STORAGE_KEY, newMode);
  };

  // Apply CSS variables
  useEffect(() => {
    if (!mounted) return;
    
    const cssVars = generateCSSVariables(mode);
    const root = document.documentElement;
    
    Object.entries(cssVars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    // Apply background gradient
    const t = themes[mode];
    root.style.background = `linear-gradient(180deg, ${t.backgroundGradient.join(', ')})`;
    root.style.minHeight = '100vh';
  }, [mode, mounted]);

  const colors = themes[mode];
  const isGlassy = mode !== 'minimal';

  // Prevent flash of wrong theme
  if (!mounted) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>;
  }

  return (
    <ThemeContext.Provider value={{ mode, setMode, colors, isGlassy }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export { themes, themeInfo, type ThemeMode, type ThemeColors };
